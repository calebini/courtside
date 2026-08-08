import {randomUUID} from 'node:crypto';

import {canonicalHash} from '@/courtside/core/configuration';
import {RuleViolation} from '@/courtside/core/errors';
import {
  cancelGameState,
  postponeGameState,
  rescheduleGameState,
  startGameState,
  validateGameParticipants,
  type GameState,
  type GameStatus
} from '@/courtside/core/game';

interface BaseGameOperationCommand {
  readonly commandId: string;
  readonly actorAccountId: string;
}

export interface ScheduleGameCommand extends BaseGameOperationCommand {
  readonly type: 'schedule';
  readonly seasonId: string;
  readonly homeSeasonTeamId: string;
  readonly awaySeasonTeamId: string;
  readonly localScheduledAt: string;
  readonly venueId: string | null;
  readonly venueInstructions: string | null;
}

export interface RescheduleGameCommand extends BaseGameOperationCommand {
  readonly type: 'reschedule';
  readonly gameId: string;
  readonly localScheduledAt: string;
  readonly venueId: string | null;
  readonly venueInstructions: string | null;
}

export interface TransitionGameCommand extends BaseGameOperationCommand {
  readonly type: 'postpone' | 'cancel' | 'start';
  readonly gameId: string;
}

export type GameOperationCommand =
  | ScheduleGameCommand
  | RescheduleGameCommand
  | TransitionGameCommand;

export interface GameOperationResult {
  readonly receiptReused: boolean;
  readonly operation: GameOperationCommand['type'];
  readonly game: {
    readonly id: string;
    readonly status: GameStatus;
    readonly scheduledAt: string;
    readonly startedAt: string | null;
    readonly venueId: string | null;
    readonly venueInstructions: string | null;
    readonly version: number;
  };
  readonly auditRecordId: string;
}

export interface GameOperationRejectionReport {
  readonly entityType: string;
  readonly entityId: string;
  readonly currentStateOrCondition: string;
  readonly requestedMutation: string;
  readonly actorAccountId: string;
  readonly violatedRule: string;
  readonly authoritativeStatePreserved: true;
}

export class GameOperationRejected extends Error {
  readonly report: GameOperationRejectionReport;

  constructor(message: string, report: GameOperationRejectionReport) {
    super(message);
    this.name = 'GameOperationRejected';
    this.report = report;
  }
}

export interface StoredGameOperationReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: GameOperationResult;
}

export interface StoredGameOperationGame extends GameState {
  readonly seasonId: string;
  readonly leagueId: string;
  readonly leagueTimezone: string;
  readonly scheduledAt: Date;
  readonly startedAt: Date | null;
  readonly venueId: string | null;
  readonly venueInstructions: string | null;
}

export interface StoredGameOperationSeason {
  readonly id: string;
  readonly leagueId: string;
  readonly leagueTimezone: string;
}

export interface GameOperationTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredGameOperationReceipt | null>;
  findSeasonForUpdate(seasonId: string): Promise<StoredGameOperationSeason | null>;
  findGameForUpdate(gameId: string): Promise<StoredGameOperationGame | null>;
  hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string): Promise<boolean>;
  seasonTeamsBelongToSeason(seasonId: string, seasonTeamIds: readonly string[]): Promise<boolean>;
  venueBelongsToLeague(leagueId: string, venueId: string): Promise<boolean>;
  insertScheduledGame(input: {
    id: string;
    seasonId: string;
    homeSeasonTeamId: string;
    awaySeasonTeamId: string;
    scheduledAt: Date;
    venueId: string | null;
    venueInstructions: string | null;
  }): Promise<void>;
  rescheduleGame(input: {
    gameId: string;
    expectedVersion: number;
    expectedStatus: 'scheduled' | 'postponed';
    scheduledAt: Date;
    venueId: string | null;
    venueInstructions: string | null;
  }): Promise<void>;
  transitionGame(input: {
    gameId: string;
    expectedVersion: number;
    expectedStatus: 'scheduled' | 'postponed';
    status: 'postponed' | 'cancelled' | 'in_progress';
    startedAt: Date | null;
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
  saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: GameOperationResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface GameOperationStore {
  transaction<T>(work: (transaction: GameOperationTransaction) => Promise<T>): Promise<T>;
}

export interface ScheduledInstantResolver {
  resolve(localDateTime: string, timeZone: string): Date | null;
}

export interface GameOperationDependencies {
  readonly now?: () => Date;
  readonly newId?: () => string;
}

function rejection(
  command: GameOperationCommand,
  input: {
    entityType: string;
    entityId: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
  }
) {
  return new GameOperationRejected(input.message, {
    entityType: input.entityType,
    entityId: input.entityId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: `${command.type} Game`,
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

function commandPayload(command: GameOperationCommand) {
  switch (command.type) {
    case 'schedule':
      return {
        actor_account_id: command.actorAccountId,
        season_id: command.seasonId,
        home_season_team_id: command.homeSeasonTeamId,
        away_season_team_id: command.awaySeasonTeamId,
        local_scheduled_at: command.localScheduledAt,
        venue_id: command.venueId,
        venue_instructions: normalizeVenueInstructions(command.venueInstructions)
      };
    case 'reschedule':
      return {
        actor_account_id: command.actorAccountId,
        game_id: command.gameId,
        local_scheduled_at: command.localScheduledAt,
        venue_id: command.venueId,
        venue_instructions: normalizeVenueInstructions(command.venueInstructions)
      };
    default:
      return {actor_account_id: command.actorAccountId, game_id: command.gameId};
  }
}

function normalizeVenueInstructions(value: string | null) {
  const trimmed = value?.trim() ?? '';
  return trimmed || null;
}

function auditGameValue(game: GameOperationResult['game']) {
  return {
    status: game.status,
    scheduled_at: game.scheduledAt,
    started_at: game.startedAt,
    venue_id: game.venueId,
    venue_instructions: game.venueInstructions,
    version: game.version
  };
}

function auditAction(type: GameOperationCommand['type']) {
  switch (type) {
    case 'schedule':
      return 'game.scheduled';
    case 'reschedule':
      return 'game.rescheduled';
    case 'postpone':
      return 'game.postponed';
    case 'cancel':
      return 'game.cancelled';
    case 'start':
      return 'game.started';
  }
}

function applyTransition(command: TransitionGameCommand, game: StoredGameOperationGame) {
  switch (command.type) {
    case 'postpone':
      return postponeGameState(game);
    case 'cancel':
      return cancelGameState(game);
    case 'start':
      return startGameState(game);
  }
}

export function createGameOperationsService(
  store: GameOperationStore,
  scheduledInstantResolver: ScheduledInstantResolver,
  dependencies: GameOperationDependencies = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function manageGame(command: GameOperationCommand): Promise<GameOperationResult> {
    const commandType = `game.${command.type}`;
    const payloadHash = canonicalHash(commandPayload(command));

    return store.transaction(async (transaction) => {
      await transaction.lockCommand(command.commandId);
      const receipt = await transaction.findCommandReceipt(command.commandId);
      if (receipt) {
        if (receipt.commandType !== commandType || receipt.payloadHash !== payloadHash) {
          throw rejection(command, {
            entityType: 'Command',
            entityId: command.commandId,
            currentStateOrCondition: 'command identity already accepted with different content',
            violatedRule: 'command.idempotency_identity',
            message: 'The command identity cannot be reused for different content'
          });
        }
        return {...receipt.result, receiptReused: true};
      }

      const acceptedAt = now();
      let leagueId: string;
      let gameId: string;
      let previousValue: unknown;
      let nextGame: GameOperationResult['game'];

      if (command.type === 'schedule') {
        const season = await transaction.findSeasonForUpdate(command.seasonId);
        if (!season) {
          throw rejection(command, {
            entityType: 'Season',
            entityId: command.seasonId,
            currentStateOrCondition: 'not found',
            violatedRule: 'season.exists',
            message: `Season ${command.seasonId} does not exist`
          });
        }
        leagueId = season.leagueId;
        if (!(await transaction.hasActiveLeagueAdministrator(leagueId, command.actorAccountId))) {
          throw rejection(command, {
            entityType: 'League',
            entityId: leagueId,
            currentStateOrCondition: 'actor has no active League Administrator assignment',
            violatedRule: 'authorization.league_admin_required',
            message: 'Only an active League Administrator may schedule a Game'
          });
        }

        try {
          validateGameParticipants(command.homeSeasonTeamId, command.awaySeasonTeamId);
        } catch (error) {
          if (error instanceof RuleViolation) {
            throw rejection(command, {
              entityType: 'Season',
              entityId: command.seasonId,
              currentStateOrCondition: 'requested participants are invalid',
              violatedRule: error.rule,
              message: error.message
            });
          }
          throw error;
        }

        if (!(await transaction.seasonTeamsBelongToSeason(command.seasonId, [
          command.homeSeasonTeamId,
          command.awaySeasonTeamId
        ]))) {
          throw rejection(command, {
            entityType: 'Season',
            entityId: command.seasonId,
            currentStateOrCondition: 'one or more participants do not belong to the Season',
            violatedRule: 'game.participants_belong_to_season',
            message: 'Both Game participants must belong to the selected Season'
          });
        }

        const scheduledAt = scheduledInstantResolver.resolve(
          command.localScheduledAt,
          season.leagueTimezone
        );
        if (!scheduledAt) {
          throw rejection(command, {
            entityType: 'Season',
            entityId: command.seasonId,
            currentStateOrCondition: `scheduled value ${command.localScheduledAt} in ${season.leagueTimezone}`,
            violatedRule: 'game.scheduled_instant_unambiguous',
            message: 'The local scheduled time does not identify one unambiguous instant'
          });
        }
        if (
          command.venueId &&
          !(await transaction.venueBelongsToLeague(leagueId, command.venueId))
        ) {
          throw rejection(command, {
            entityType: 'Venue',
            entityId: command.venueId,
            currentStateOrCondition: 'Venue does not belong to the Game League',
            violatedRule: 'game.venue_belongs_to_league',
            message: 'The selected Venue does not belong to the Game League'
          });
        }

        gameId = newId();
        const venueInstructions = normalizeVenueInstructions(command.venueInstructions);
        await transaction.insertScheduledGame({
          id: gameId,
          seasonId: command.seasonId,
          homeSeasonTeamId: command.homeSeasonTeamId,
          awaySeasonTeamId: command.awaySeasonTeamId,
          scheduledAt,
          venueId: command.venueId,
          venueInstructions
        });
        previousValue = null;
        nextGame = {
          id: gameId,
          status: 'scheduled',
          scheduledAt: scheduledAt.toISOString(),
          startedAt: null,
          venueId: command.venueId,
          venueInstructions,
          version: 0
        };
      } else {
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
        leagueId = game.leagueId;
        gameId = game.id;
        if (!(await transaction.hasActiveLeagueAdministrator(leagueId, command.actorAccountId))) {
          throw rejection(command, {
            entityType: 'League',
            entityId: leagueId,
            currentStateOrCondition: 'actor has no active League Administrator assignment',
            violatedRule: 'authorization.league_admin_required',
            message: `Only an active League Administrator may ${command.type} a Game`
          });
        }
        previousValue = {
          status: game.status,
          scheduled_at: game.scheduledAt.toISOString(),
          started_at: game.startedAt?.toISOString() ?? null,
          venue_id: game.venueId,
          venue_instructions: game.venueInstructions,
          version: game.version
        };

        if (command.type === 'reschedule') {
          let nextState: GameState;
          try {
            nextState = rescheduleGameState(game);
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
          const scheduledAt = scheduledInstantResolver.resolve(
            command.localScheduledAt,
            game.leagueTimezone
          );
          if (!scheduledAt) {
            throw rejection(command, {
              entityType: 'Game',
              entityId: game.id,
              currentStateOrCondition: `scheduled value ${command.localScheduledAt} in ${game.leagueTimezone}`,
              violatedRule: 'game.scheduled_instant_unambiguous',
              message: 'The local scheduled time does not identify one unambiguous instant'
            });
          }
          if (
            command.venueId &&
            !(await transaction.venueBelongsToLeague(leagueId, command.venueId))
          ) {
            throw rejection(command, {
              entityType: 'Venue',
              entityId: command.venueId,
              currentStateOrCondition: 'Venue does not belong to the Game League',
              violatedRule: 'game.venue_belongs_to_league',
              message: 'The selected Venue does not belong to the Game League'
            });
          }
          const venueInstructions = normalizeVenueInstructions(command.venueInstructions);
          await transaction.rescheduleGame({
            gameId: game.id,
            expectedVersion: game.version,
            expectedStatus: game.status as 'scheduled' | 'postponed',
            scheduledAt,
            venueId: command.venueId,
            venueInstructions
          });
          nextGame = {
            id: game.id,
            status: nextState.status,
            scheduledAt: scheduledAt.toISOString(),
            startedAt: null,
            venueId: command.venueId,
            venueInstructions,
            version: nextState.version
          };
        } else {
          let nextState: GameState;
          try {
            nextState = applyTransition(command, game);
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
          const startedAt = command.type === 'start' ? acceptedAt : game.startedAt;
          await transaction.transitionGame({
            gameId: game.id,
            expectedVersion: game.version,
            expectedStatus: game.status as 'scheduled' | 'postponed',
            status: nextState.status as 'postponed' | 'cancelled' | 'in_progress',
            startedAt
          });
          nextGame = {
            id: game.id,
            status: nextState.status,
            scheduledAt: game.scheduledAt.toISOString(),
            startedAt: startedAt?.toISOString() ?? null,
            venueId: game.venueId,
            venueInstructions: game.venueInstructions,
            version: nextState.version
          };
        }
      }

      const auditRecordId = newId();
      await transaction.appendAuditRecord({
        id: auditRecordId,
        leagueId,
        actorAccountId: command.actorAccountId,
        action: auditAction(command.type),
        entityType: 'Game',
        entityId: gameId,
        previousValue,
        newValue:
          command.type === 'schedule'
            ? {
                season_id: command.seasonId,
                phase: 'regular',
                home_season_team_id: command.homeSeasonTeamId,
                away_season_team_id: command.awaySeasonTeamId,
                ...auditGameValue(nextGame)
              }
            : auditGameValue(nextGame),
        reason: null,
        createdAt: acceptedAt
      });

      const result: GameOperationResult = {
        receiptReused: false,
        operation: command.type,
        game: nextGame,
        auditRecordId
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
