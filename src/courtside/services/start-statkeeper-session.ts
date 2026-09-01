import {randomUUID} from 'node:crypto';

import {RuleViolation} from '@/courtside/core/errors';
import {
  normalizeYouTubeMediaReference,
  type NormalizedGameMediaIdentity,
  type YouTubeMediaReference
} from '@/courtside/core/statkeeper-media';
import type {NormalizedStatkeeperProfile} from '@/courtside/core/statkeeper-profile';
import {statkeeperCanonicalHash} from '@/courtside/core/statkeeper-canonical-json';
import type {GameStatus} from '@/courtside/core/game';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMMAND_TYPE = 'statkeeper.session_started';

export interface StartStatkeeperSessionCommand {
  readonly type: 'start_statkeeper_session';
  readonly commandId: string;
  /** Trusted, provisioned, server-resolved actor; a browser/auth binding is not in this slice. */
  readonly actorAccountId: string;
  readonly gameId: string;
  readonly youtubeMedia: YouTubeMediaReference;
  readonly didNotPlayRosterMembershipIds: readonly string[];
}

export interface StartStatkeeperSessionResult {
  readonly receiptReused: boolean;
  readonly operation: 'start_statkeeper_session';
  readonly captureSessionId: string;
  readonly gameId: string;
  readonly profileVersionId: string;
  readonly profileContentHash: string;
  readonly mediaId: string;
  readonly ledgerVersion: 1;
  readonly progressVersion: 0;
  readonly appearedCount: number;
  readonly didNotPlayCount: number;
}

export class StatkeeperSessionStartRejected extends Error {
  constructor(
    message: string,
    readonly report: {
      readonly entityType: string;
      readonly entityId: string;
      readonly currentStateOrCondition: string;
      readonly requestedMutation: 'start Statkeeper Capture Session';
      readonly actorAccountId: string;
      readonly violatedRule: string;
      readonly authoritativeStatePreserved: true;
      readonly canonicalCaptureSessionId?: string;
    }
  ) {
    super(message);
    this.name = 'StatkeeperSessionStartRejected';
  }
}

export interface StoredStatkeeperPreflightGame {
  readonly id: string;
  readonly leagueId: string;
  readonly seasonId: string;
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
  readonly status: GameStatus;
  readonly competitionEligibilityAt: Date | null;
}

export interface EligibleStatkeeperParticipant {
  readonly rosterMembershipId: string;
  readonly playerId: string;
  readonly seasonId: string;
  readonly seasonTeamId: string;
}

export interface StoredActiveStatkeeperPreflightProfile {
  readonly id: string;
  readonly leagueId: string;
  readonly versionNumber: number;
  readonly profile: NormalizedStatkeeperProfile;
}

export interface StoredStatkeeperGameMedia {
  readonly id: string;
  readonly gameId: string;
}

export interface StoredStatkeeperSessionReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: StartStatkeeperSessionResult;
}

export interface StatkeeperSessionTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredStatkeeperSessionReceipt | null>;
  findGameForUpdate(gameId: string): Promise<StoredStatkeeperPreflightGame | null>;
  lockLeague(leagueId: string): Promise<boolean>;
  hasUserAccount(accountId: string): Promise<boolean>;
  findCaptureSessionIdByGame(gameId: string): Promise<string | null>;
  listEligibleParticipants(game: StoredStatkeeperPreflightGame): Promise<EligibleStatkeeperParticipant[]>;
  findActiveProfile(leagueId: string): Promise<StoredActiveStatkeeperPreflightProfile | null>;
  findGameMedia(leagueId: string, media: NormalizedGameMediaIdentity): Promise<StoredStatkeeperGameMedia | null>;
  insertGameMedia(input: {
    id: string;
    game: StoredStatkeeperPreflightGame;
    media: NormalizedGameMediaIdentity;
    createdByAccountId: string;
    createdAt: Date;
  }): Promise<void>;
  createCaptureSession(input: {
    id: string;
    workingRevisionId: string;
    game: StoredStatkeeperPreflightGame;
    profile: StoredActiveStatkeeperPreflightProfile;
    mediaId: string;
    participants: readonly (EligibleStatkeeperParticipant & {
      readonly participationStatus: 'appeared' | 'did_not_play';
    })[];
    createdByAccountId: string;
    createdAt: Date;
  }): Promise<void>;
  saveCommandReceipt(input: {
    commandId: string;
    payloadHash: string;
    result: StartStatkeeperSessionResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface StatkeeperSessionStore {
  transaction<T>(work: (transaction: StatkeeperSessionTransaction) => Promise<T>): Promise<T>;
}

function rejected(
  command: StartStatkeeperSessionCommand,
  input: {
    entityType?: string;
    entityId?: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
    canonicalCaptureSessionId?: string;
  }
) {
  return new StatkeeperSessionStartRejected(input.message, {
    entityType: input.entityType ?? 'Game',
    entityId: input.entityId ?? command.gameId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: 'start Statkeeper Capture Session',
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true,
    ...(input.canonicalCaptureSessionId
      ? {canonicalCaptureSessionId: input.canonicalCaptureSessionId}
      : {})
  });
}

function uuid(value: unknown, label: string) {
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new RuleViolation('statkeeper.session.identity', `${label} must be a UUID`);
  }
  return value.toLowerCase();
}

export function createStatkeeperSessionStartService(
  store: StatkeeperSessionStore,
  dependencies: {readonly now?: () => Date; readonly newId?: () => string} = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function startStatkeeperSession(
    rawCommand: StartStatkeeperSessionCommand
  ): Promise<StartStatkeeperSessionResult> {
    let command: StartStatkeeperSessionCommand;
    let media: NormalizedGameMediaIdentity;
    try {
      if (rawCommand.type !== 'start_statkeeper_session') {
        throw new RuleViolation('statkeeper.session.command_type', 'Session command type is unsupported');
      }
      if (!Array.isArray(rawCommand.didNotPlayRosterMembershipIds)) {
        throw new RuleViolation('statkeeper.session.participation', 'DNP declaration must be an identity set');
      }
      const didNotPlayRosterMembershipIds = rawCommand.didNotPlayRosterMembershipIds.map((id) =>
        uuid(id, 'DNP Roster Membership identity')
      );
      if (new Set(didNotPlayRosterMembershipIds).size !== didNotPlayRosterMembershipIds.length) {
        throw new RuleViolation('statkeeper.session.participation', 'DNP identities must be unique');
      }
      didNotPlayRosterMembershipIds.sort();
      command = {
        ...rawCommand,
        commandId: uuid(rawCommand.commandId, 'Command identity'),
        actorAccountId: uuid(rawCommand.actorAccountId, 'Actor identity'),
        gameId: uuid(rawCommand.gameId, 'Game identity'),
        didNotPlayRosterMembershipIds
      };
      media = normalizeYouTubeMediaReference(rawCommand.youtubeMedia);
    } catch (error) {
      if (!(error instanceof RuleViolation)) throw error;
      throw rejected(rawCommand, {
        currentStateOrCondition: 'invalid session preflight input',
        violatedRule: error.rule,
        message: error.message
      });
    }

    const payloadHash = statkeeperCanonicalHash({
      actor_account_id: command.actorAccountId,
      did_not_play_roster_membership_ids: command.didNotPlayRosterMembershipIds,
      game_id: command.gameId,
      media: {
        original_reference: media.originalReference,
        provider: media.provider,
        provider_asset_id: media.providerAssetId
      }
    });

    return store.transaction(async (transaction) => {
      await transaction.lockCommand(command.commandId);
      const receipt = await transaction.findCommandReceipt(command.commandId);
      if (receipt) {
        if (receipt.commandType !== COMMAND_TYPE || receipt.payloadHash !== payloadHash) {
          throw rejected(command, {
            entityType: 'CommandReceipt',
            entityId: command.commandId,
            currentStateOrCondition: 'command identity already accepted with different content',
            violatedRule: 'command.idempotency',
            message: 'Command identity cannot be reused for different session preflight content'
          });
        }
        return {...receipt.result, receiptReused: true};
      }

      const game = await transaction.findGameForUpdate(command.gameId);
      if (!game) {
        throw rejected(command, {
          currentStateOrCondition: 'Game not found',
          violatedRule: 'game.exists',
          message: 'The Game does not exist'
        });
      }
      if (!['final', 'forfeit'].includes(game.status) || !game.competitionEligibilityAt) {
        throw rejected(command, {
          currentStateOrCondition: game.status,
          violatedRule: 'statkeeper.session.game_anchored',
          message: 'Session preflight requires a completed, eligibility-anchored Game'
        });
      }
      if (!await transaction.lockLeague(game.leagueId)) {
        throw new Error(`Game ${game.id} references missing League ${game.leagueId}`);
      }
      if (!await transaction.hasUserAccount(command.actorAccountId)) {
        throw rejected(command, {
          entityType: 'UserAccount',
          entityId: command.actorAccountId,
          currentStateOrCondition: 'not provisioned',
          violatedRule: 'statkeeper.session.actor',
          message: 'Session actor must be a provisioned User Account'
        });
      }
      const existingSessionId = await transaction.findCaptureSessionIdByGame(game.id);
      if (existingSessionId) {
        throw rejected(command, {
          entityType: 'CaptureSession',
          entityId: existingSessionId,
          currentStateOrCondition: 'canonical session already exists for Game',
          violatedRule: 'statkeeper.session.existing_session_conflict',
          message: 'Review and resume the existing Capture Session preflight basis',
          canonicalCaptureSessionId: existingSessionId
        });
      }

      const eligible = await transaction.listEligibleParticipants(game);
      const eligibleById = new Map(eligible.map((participant) => [participant.rosterMembershipId, participant]));
      for (const membershipId of command.didNotPlayRosterMembershipIds) {
        if (!eligibleById.has(membershipId)) {
          throw rejected(command, {
            entityType: 'RosterMembership',
            entityId: membershipId,
            currentStateOrCondition: 'not eligible for either participating Team at the Game anchor',
            violatedRule: 'statkeeper.session.participation_eligible',
            message: 'Every DNP declaration must identify an eligible Game Roster Membership'
          });
        }
      }
      const profile = await transaction.findActiveProfile(game.leagueId);
      if (!profile) {
        throw rejected(command, {
          entityType: 'League',
          entityId: game.leagueId,
          currentStateOrCondition: 'no active Statkeeper Profile Version',
          violatedRule: 'statkeeper.session.active_profile_required',
          message: 'The League must activate a Statkeeper Profile Version before starting a session'
        });
      }

      const existingMedia = await transaction.findGameMedia(game.leagueId, media);
      if (existingMedia && existingMedia.gameId !== game.id) {
        throw rejected(command, {
          entityType: 'Media',
          entityId: existingMedia.id,
          currentStateOrCondition: 'provider asset is already associated with another Game',
          violatedRule: 'statkeeper.media.game_unique',
          message: 'A canonical Game Media identity cannot be reassigned to another Game'
        });
      }

      const acceptedAt = now();
      const captureSessionId = newId();
      const workingRevisionId = newId();
      const mediaId = existingMedia?.id ?? newId();
      if (!existingMedia) {
        await transaction.insertGameMedia({
          id: mediaId,
          game,
          media,
          createdByAccountId: command.actorAccountId,
          createdAt: acceptedAt
        });
      }
      const dnp = new Set(command.didNotPlayRosterMembershipIds);
      const participants = eligible.map((participant) => ({
        ...participant,
        participationStatus: dnp.has(participant.rosterMembershipId)
          ? 'did_not_play' as const
          : 'appeared' as const
      }));
      await transaction.createCaptureSession({
        id: captureSessionId,
        workingRevisionId,
        game,
        profile,
        mediaId,
        participants,
        createdByAccountId: command.actorAccountId,
        createdAt: acceptedAt
      });
      const result: StartStatkeeperSessionResult = {
        receiptReused: false,
        operation: 'start_statkeeper_session',
        captureSessionId,
        gameId: game.id,
        profileVersionId: profile.id,
        profileContentHash: profile.profile.contentHash,
        mediaId,
        ledgerVersion: 1,
        progressVersion: 0,
        appearedCount: participants.length - dnp.size,
        didNotPlayCount: dnp.size
      };
      await transaction.saveCommandReceipt({
        commandId: command.commandId,
        payloadHash,
        result,
        createdAt: acceptedAt
      });
      return result;
    });
  };
}
