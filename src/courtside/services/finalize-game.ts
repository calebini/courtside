import {randomUUID} from 'node:crypto';

import {canonicalHash, readStandingsConfiguration} from '@/courtside/core/configuration';
import {RuleViolation} from '@/courtside/core/errors';
import {finalizeGameState, type GamePhase, type GameStatus} from '@/courtside/core/game';
import {calculateStandings, type StandingsGame, type StandingsProjection} from '@/courtside/core/standings';

export interface FinalizeGameCommand {
  readonly commandId: string;
  readonly actorAccountId: string;
  readonly gameId: string;
  readonly homeScore: number;
  readonly awayScore: number;
}

export interface FinalizeGameResult {
  readonly receiptReused: boolean;
  readonly game: {
    readonly id: string;
    readonly status: 'final';
    readonly homeScore: number;
    readonly awayScore: number;
    readonly winningSeasonTeamId: string;
    readonly version: number;
  };
  readonly configurationVersionId: string;
  readonly auditRecordId: string;
  readonly standings: StandingsProjection;
}

export interface RejectionReport {
  readonly entityType: string;
  readonly entityId: string;
  readonly currentStateOrCondition: string;
  readonly requestedMutation: string;
  readonly actorAccountId: string;
  readonly violatedRule: string;
  readonly authoritativeStatePreserved: true;
}

export class MutationRejected extends Error {
  readonly report: RejectionReport;

  constructor(message: string, report: RejectionReport) {
    super(message);
    this.name = 'MutationRejected';
    this.report = report;
  }
}

export interface StoredCommandReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: FinalizeGameResult;
}

export interface StoredGame {
  readonly id: string;
  readonly seasonId: string;
  readonly leagueId: string;
  readonly status: GameStatus;
  readonly phase: GamePhase;
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
  readonly version: number;
}

export interface StoredSeason {
  readonly id: string;
  readonly resultConfiguration: unknown;
  readonly frozenConfigurationVersionId: string | null;
}

export interface StoredConfigurationVersion {
  readonly id: string;
  readonly configuration: unknown;
  readonly basisHash: string;
}

export interface FinalizeGameTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredCommandReceipt | null>;
  findGameForUpdate(gameId: string): Promise<StoredGame | null>;
  hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string): Promise<boolean>;
  findSeasonForUpdate(seasonId: string): Promise<StoredSeason>;
  findConfigurationVersion(configurationVersionId: string): Promise<StoredConfigurationVersion>;
  createConfigurationVersion(input: {
    id: string;
    seasonId: string;
    configuration: unknown;
    basisHash: string;
    frozenAt: Date;
  }): Promise<StoredConfigurationVersion>;
  setFrozenConfigurationVersion(seasonId: string, configurationVersionId: string): Promise<void>;
  finalizeGame(input: {
    gameId: string;
    expectedVersion: number;
    homeScore: number;
    awayScore: number;
    winningSeasonTeamId: string;
    configurationVersionId: string;
    finalizedAt: Date;
  }): Promise<void>;
  appendAuditRecord(input: {
    id: string;
    leagueId: string;
    actorAccountId: string;
    action: string;
    entityType: string;
    entityId: string;
    previousValue: unknown;
    newValue: unknown;
    reason: string | null;
    createdAt: Date;
  }): Promise<void>;
  listSeasonTeamIds(seasonId: string): Promise<string[]>;
  listAuthoritativeRegularGames(seasonId: string): Promise<StandingsGame[]>;
  saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: FinalizeGameResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface FinalizeGameStore {
  transaction<T>(work: (transaction: FinalizeGameTransaction) => Promise<T>): Promise<T>;
}

export interface FinalizeGameDependencies {
  readonly now?: () => Date;
  readonly newId?: () => string;
}

const COMMAND_TYPE = 'game.finalize';

function rejection(command: FinalizeGameCommand, input: {
  entityType: string;
  entityId: string;
  currentStateOrCondition: string;
  violatedRule: string;
  message: string;
}): MutationRejected {
  return new MutationRejected(input.message, {
    entityType: input.entityType,
    entityId: input.entityId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: 'finalize Game',
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

export function createFinalizeGameService(
  store: FinalizeGameStore,
  dependencies: FinalizeGameDependencies = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function finalizeGame(command: FinalizeGameCommand): Promise<FinalizeGameResult> {
    const payloadHash = canonicalHash({
      actor_account_id: command.actorAccountId,
      game_id: command.gameId,
      home_score: command.homeScore,
      away_score: command.awayScore
    });

    return store.transaction(async (transaction) => {
      await transaction.lockCommand(command.commandId);
      const existingReceipt = await transaction.findCommandReceipt(command.commandId);
      if (existingReceipt) {
        if (existingReceipt.commandType !== COMMAND_TYPE || existingReceipt.payloadHash !== payloadHash) {
          throw rejection(command, {
            entityType: 'Command',
            entityId: command.commandId,
            currentStateOrCondition: 'command identity already accepted with different content',
            violatedRule: 'command.idempotency_identity',
            message: 'The command identity cannot be reused for different content'
          });
        }
        return {...existingReceipt.result, receiptReused: true};
      }

      const game = await transaction.findGameForUpdate(command.gameId);
      if (!game) {
        throw rejection(command, {
          entityType: 'Game',
          entityId: command.gameId,
          currentStateOrCondition: 'not found',
          violatedRule: 'game.exists',
          message: `Game ${command.gameId} does not exist`
        });
      }

      if (!(await transaction.hasActiveLeagueAdministrator(game.leagueId, command.actorAccountId))) {
        throw rejection(command, {
          entityType: 'League',
          entityId: game.leagueId,
          currentStateOrCondition: 'actor has no active League Administrator assignment',
          violatedRule: 'authorization.league_admin_required',
          message: 'Only an active League Administrator may finalize a Game'
        });
      }

      let finalizedGame;
      try {
        finalizedGame = finalizeGameState(game, {
          home: command.homeScore,
          away: command.awayScore
        });
      } catch (error) {
        if (error instanceof RuleViolation) {
          throw rejection(command, {
            entityType: 'Game',
            entityId: game.id,
            currentStateOrCondition: game.status,
            violatedRule: error.rule,
            message: error.message
          });
        }
        throw error;
      }

      const season = await transaction.findSeasonForUpdate(game.seasonId);
      const mutableBasisHash = canonicalHash(season.resultConfiguration);
      let configurationVersion: StoredConfigurationVersion;

      if (season.frozenConfigurationVersionId) {
        configurationVersion = await transaction.findConfigurationVersion(
          season.frozenConfigurationVersionId
        );
        if (configurationVersion.basisHash !== mutableBasisHash) {
          throw rejection(command, {
            entityType: 'Season',
            entityId: season.id,
            currentStateOrCondition: 'mutable result-affecting configuration differs from frozen basis',
            violatedRule: 'season.configuration_basis_conflict',
            message: 'The Game cannot be finalized from a different configuration basis'
          });
        }
      } else {
        configurationVersion = await transaction.createConfigurationVersion({
          id: newId(),
          seasonId: season.id,
          configuration: season.resultConfiguration,
          basisHash: mutableBasisHash,
          frozenAt: now()
        });
        await transaction.setFrozenConfigurationVersion(season.id, configurationVersion.id);
      }

      const finalizedAt = now();
      await transaction.finalizeGame({
        gameId: game.id,
        expectedVersion: game.version,
        homeScore: finalizedGame.homeScore,
        awayScore: finalizedGame.awayScore,
        winningSeasonTeamId: finalizedGame.winningSeasonTeamId,
        configurationVersionId: configurationVersion.id,
        finalizedAt
      });

      const auditRecordId = newId();
      await transaction.appendAuditRecord({
        id: auditRecordId,
        leagueId: game.leagueId,
        actorAccountId: command.actorAccountId,
        action: 'game.finalized',
        entityType: 'Game',
        entityId: game.id,
        previousValue: {
          status: game.status,
          home_score: null,
          away_score: null,
          winning_season_team_id: null,
          configuration_version_id: null,
          version: game.version
        },
        newValue: {
          status: 'final',
          home_score: finalizedGame.homeScore,
          away_score: finalizedGame.awayScore,
          winning_season_team_id: finalizedGame.winningSeasonTeamId,
          configuration_version_id: configurationVersion.id,
          version: finalizedGame.version
        },
        reason: null,
        createdAt: finalizedAt
      });

      const standingsConfiguration = readStandingsConfiguration(configurationVersion.configuration);
      const standings = calculateStandings({
        seasonId: season.id,
        configurationVersionId: configurationVersion.id,
        seasonTeamIds: await transaction.listSeasonTeamIds(season.id),
        games: await transaction.listAuthoritativeRegularGames(season.id),
        configuration: standingsConfiguration
      });

      const result: FinalizeGameResult = {
        receiptReused: false,
        game: {
          id: game.id,
          status: 'final',
          homeScore: finalizedGame.homeScore,
          awayScore: finalizedGame.awayScore,
          winningSeasonTeamId: finalizedGame.winningSeasonTeamId,
          version: finalizedGame.version
        },
        configurationVersionId: configurationVersion.id,
        auditRecordId,
        standings
      };

      await transaction.saveCommandReceipt({
        commandId: command.commandId,
        commandType: COMMAND_TYPE,
        payloadHash,
        result,
        createdAt: finalizedAt
      });

      return result;
    });
  };
}
