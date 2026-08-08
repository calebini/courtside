import {randomUUID} from 'node:crypto';

import {canonicalHash, readStandingsConfiguration} from '@/courtside/core/configuration';
import {RuleViolation} from '@/courtside/core/errors';
import {
  correctAuthoritativeGameState,
  finalizeGameState,
  forfeitGameState,
  type AuthoritativeGameState,
  type GamePhase,
  type GameStatus
} from '@/courtside/core/game';
import {calculateStandings, type StandingsGame, type StandingsProjection} from '@/courtside/core/standings';

interface BaseGameResultCommand {
  readonly commandId: string;
  readonly actorAccountId: string;
  readonly gameId: string;
  readonly homeScore: number;
  readonly awayScore: number;
}

export interface FinalizeGameCommand extends BaseGameResultCommand {
  readonly type?: 'finalize';
}

export interface ForfeitGameCommand extends BaseGameResultCommand {
  readonly type: 'forfeit';
  readonly winningSeasonTeamId: string;
  readonly reason: string | null;
}

export interface CorrectGameResultCommand extends BaseGameResultCommand {
  readonly type: 'correct';
  readonly winningSeasonTeamId: string;
  readonly reason: string;
}

export type GameResultCommand =
  | (FinalizeGameCommand & {readonly type: 'finalize'})
  | ForfeitGameCommand
  | CorrectGameResultCommand;

export interface GameResultMutationResult {
  readonly receiptReused: boolean;
  readonly operation: GameResultCommand['type'];
  readonly game: {
    readonly id: string;
    readonly status: 'final' | 'forfeit';
    readonly homeScore: number;
    readonly awayScore: number;
    readonly winningSeasonTeamId: string;
    readonly version: number;
  };
  readonly configurationVersionId: string;
  readonly auditRecordId: string;
  readonly standings: StandingsProjection;
}

export type FinalizeGameResult = Omit<GameResultMutationResult, 'operation' | 'game'> & {
  readonly operation: 'finalize';
  readonly game: GameResultMutationResult['game'] & {readonly status: 'final'};
};

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
  readonly result: GameResultMutationResult;
}

export interface StoredGame {
  readonly id: string;
  readonly seasonId: string;
  readonly leagueId: string;
  readonly status: GameStatus;
  readonly phase: GamePhase;
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
  readonly homeScore: number | null;
  readonly awayScore: number | null;
  readonly winningSeasonTeamId: string | null;
  readonly configurationVersionId: string | null;
  readonly competitionEligibilityAt: Date | null;
  readonly finalizedAt: Date | null;
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
  saveAuthoritativeResult(input: {
    gameId: string;
    expectedVersion: number;
    expectedStatus: GameStatus;
    status: 'final' | 'forfeit';
    homeScore: number;
    awayScore: number;
    winningSeasonTeamId: string;
    configurationVersionId: string;
    competitionEligibilityAt: Date;
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
    result: GameResultMutationResult;
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

function normalizeReason(value: string | null) {
  const normalized = value?.trim() ?? '';
  return normalized || null;
}

function rejection(
  command: GameResultCommand,
  input: {
    entityType: string;
    entityId: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
  }
): MutationRejected {
  return new MutationRejected(input.message, {
    entityType: input.entityType,
    entityId: input.entityId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: `${command.type} Game result`,
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

function commandPayload(command: GameResultCommand) {
  return {
    actor_account_id: command.actorAccountId,
    game_id: command.gameId,
    home_score: command.homeScore,
    away_score: command.awayScore,
    ...(command.type === 'finalize'
      ? {}
      : {
          winning_season_team_id: command.winningSeasonTeamId,
          reason: normalizeReason(command.reason)
        })
  };
}

function previousAuditValue(game: StoredGame) {
  return {
    status: game.status,
    home_score: game.homeScore,
    away_score: game.awayScore,
    winning_season_team_id: game.winningSeasonTeamId,
    configuration_version_id: game.configurationVersionId,
    finalized_at: game.finalizedAt?.toISOString() ?? null,
    version: game.version
  };
}

function applyResultCommand(command: GameResultCommand, game: StoredGame) {
  const score = {home: command.homeScore, away: command.awayScore};
  if (command.type === 'finalize') {
    return finalizeGameState(game, score);
  }
  if (command.type === 'forfeit') {
    return forfeitGameState(game, score, command.winningSeasonTeamId);
  }
  if (!normalizeReason(command.reason)) {
    throw new RuleViolation(
      'game.result_correction_reason_required',
      'An authoritative result correction requires a reason'
    );
  }
  if (
    game.homeScore === null ||
    game.awayScore === null ||
    game.winningSeasonTeamId === null ||
    (game.status !== 'final' && game.status !== 'forfeit')
  ) {
    throw new RuleViolation(
      'game.authoritative_result_correction_only',
      `Game ${game.id} does not have an authoritative result to correct`
    );
  }
  return correctAuthoritativeGameState(
    game as AuthoritativeGameState,
    score,
    command.winningSeasonTeamId
  );
}

export function createGameResultService(
  store: FinalizeGameStore,
  dependencies: FinalizeGameDependencies = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function manageGameResult(
    command: GameResultCommand
  ): Promise<GameResultMutationResult> {
    const commandType = `game.${command.type}`;
    const payloadHash = canonicalHash(commandPayload(command));

    return store.transaction(async (transaction) => {
      await transaction.lockCommand(command.commandId);
      const existingReceipt = await transaction.findCommandReceipt(command.commandId);
      if (existingReceipt) {
        if (
          existingReceipt.commandType !== commandType ||
          existingReceipt.payloadHash !== payloadHash
        ) {
          throw rejection(command, {
            entityType: 'Command',
            entityId: command.commandId,
            currentStateOrCondition: 'command identity already accepted with different content',
            violatedRule: 'command.idempotency_identity',
            message: 'The command identity cannot be reused for different content'
          });
        }
        return {...existingReceipt.result, operation: command.type, receiptReused: true};
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
          message: `Only an active League Administrator may ${command.type} a Game result`
        });
      }

      let authoritativeGame;
      try {
        authoritativeGame = applyResultCommand(command, game);
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

      const acceptedAt = now();
      const season = await transaction.findSeasonForUpdate(game.seasonId);
      let configurationVersion: StoredConfigurationVersion;
      if (command.type === 'correct') {
        if (!game.configurationVersionId) {
          throw new Error(`Authoritative Game ${game.id} has no configuration version`);
        }
        configurationVersion = await transaction.findConfigurationVersion(game.configurationVersionId);
      } else {
        const mutableBasisHash = canonicalHash(season.resultConfiguration);
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
              message: 'The Game result cannot be accepted from a different configuration basis'
            });
          }
        } else {
          configurationVersion = await transaction.createConfigurationVersion({
            id: newId(),
            seasonId: season.id,
            configuration: season.resultConfiguration,
            basisHash: mutableBasisHash,
            frozenAt: acceptedAt
          });
          await transaction.setFrozenConfigurationVersion(season.id, configurationVersion.id);
        }
      }

      const competitionEligibilityAt = game.competitionEligibilityAt ?? acceptedAt;
      if (command.type === 'correct' && !game.finalizedAt) {
        throw new Error(`Authoritative Game ${game.id} has no result timestamp`);
      }
      const finalizedAt = game.finalizedAt ?? acceptedAt;
      await transaction.saveAuthoritativeResult({
        gameId: game.id,
        expectedVersion: game.version,
        expectedStatus: game.status,
        status: authoritativeGame.status,
        homeScore: authoritativeGame.homeScore,
        awayScore: authoritativeGame.awayScore,
        winningSeasonTeamId: authoritativeGame.winningSeasonTeamId,
        configurationVersionId: configurationVersion.id,
        competitionEligibilityAt,
        finalizedAt
      });

      const auditRecordId = newId();
      await transaction.appendAuditRecord({
        id: auditRecordId,
        leagueId: game.leagueId,
        actorAccountId: command.actorAccountId,
        action:
          command.type === 'finalize'
            ? 'game.finalized'
            : command.type === 'forfeit'
              ? 'game.forfeited'
              : 'game.result_corrected',
        entityType: 'Game',
        entityId: game.id,
        previousValue: previousAuditValue(game),
        newValue: {
          status: authoritativeGame.status,
          home_score: authoritativeGame.homeScore,
          away_score: authoritativeGame.awayScore,
          winning_season_team_id: authoritativeGame.winningSeasonTeamId,
          configuration_version_id: configurationVersion.id,
          finalized_at: finalizedAt.toISOString(),
          version: authoritativeGame.version
        },
        reason: command.type === 'finalize' ? null : normalizeReason(command.reason),
        createdAt: acceptedAt
      });

      const standings = calculateStandings({
        seasonId: season.id,
        configurationVersionId: configurationVersion.id,
        seasonTeamIds: await transaction.listSeasonTeamIds(season.id),
        games: await transaction.listAuthoritativeRegularGames(season.id),
        configuration: readStandingsConfiguration(configurationVersion.configuration)
      });

      const result: GameResultMutationResult = {
        receiptReused: false,
        operation: command.type,
        game: {
          id: game.id,
          status: authoritativeGame.status,
          homeScore: authoritativeGame.homeScore,
          awayScore: authoritativeGame.awayScore,
          winningSeasonTeamId: authoritativeGame.winningSeasonTeamId,
          version: authoritativeGame.version
        },
        configurationVersionId: configurationVersion.id,
        auditRecordId,
        standings
      };

      await transaction.saveCommandReceipt({
        commandId: command.commandId,
        commandType,
        payloadHash,
        result,
        createdAt: acceptedAt
      });
      return result;
    });
  };
}

export function createFinalizeGameService(
  store: FinalizeGameStore,
  dependencies: FinalizeGameDependencies = {}
) {
  const manageGameResult = createGameResultService(store, dependencies);
  return async function finalizeGame(command: FinalizeGameCommand): Promise<FinalizeGameResult> {
    const result = await manageGameResult({...command, type: 'finalize'});
    return result as FinalizeGameResult;
  };
}
