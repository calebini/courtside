import {randomUUID} from 'node:crypto';

import {canonicalHash} from '@/courtside/core/configuration';
import {RuleViolation} from '@/courtside/core/errors';
import {normalizeTeamNameBatch} from '@/courtside/core/team-setup';

interface BaseSeasonTeamCommand {
  readonly commandId: string;
  readonly actorAccountId: string;
}

export interface AddSeasonTeamsCommand extends BaseSeasonTeamCommand {
  readonly type: 'add_teams';
  readonly seasonId: string;
  readonly names: readonly string[];
}

export interface RemoveSeasonTeamCommand extends BaseSeasonTeamCommand {
  readonly type: 'remove_team';
  readonly seasonTeamId: string;
}

export type SeasonTeamCommand = AddSeasonTeamsCommand | RemoveSeasonTeamCommand;

export interface ManagedSeasonTeam {
  readonly seasonTeamId: string;
  readonly teamId: string;
  readonly name: string;
  readonly teamCreated: boolean;
  readonly participationCreated: boolean;
}

export interface SeasonTeamResult {
  readonly receiptReused: boolean;
  readonly operation: SeasonTeamCommand['type'];
  readonly seasonId: string;
  readonly teams: readonly ManagedSeasonTeam[];
  readonly auditRecordIds: readonly string[];
}

export interface SeasonTeamRejectionReport {
  readonly entityType: 'Season' | 'SeasonTeam' | 'Command';
  readonly entityId: string;
  readonly currentStateOrCondition: string;
  readonly requestedMutation: string;
  readonly actorAccountId: string;
  readonly violatedRule: string;
  readonly authoritativeStatePreserved: true;
}

export class SeasonTeamRejected extends Error {
  readonly report: SeasonTeamRejectionReport;

  constructor(message: string, report: SeasonTeamRejectionReport) {
    super(message);
    this.name = 'SeasonTeamRejected';
    this.report = report;
  }
}

export interface StoredSeasonTeamReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: SeasonTeamResult;
}

export interface StoredSeasonTeamSeason {
  readonly id: string;
  readonly leagueId: string;
}

export interface StoredLeagueTeam {
  readonly id: string;
  readonly name: string;
}

export interface StoredSeasonTeam {
  readonly id: string;
  readonly seasonId: string;
  readonly leagueId: string;
  readonly teamId: string;
  readonly name: string;
}

export interface SeasonTeamTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredSeasonTeamReceipt | null>;
  findSeasonForUpdate(seasonId: string): Promise<StoredSeasonTeamSeason | null>;
  findSeasonTeamForUpdate(seasonTeamId: string): Promise<StoredSeasonTeam | null>;
  hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string): Promise<boolean>;
  findLeagueTeamsByNames(leagueId: string, names: readonly string[]): Promise<readonly StoredLeagueTeam[]>;
  findSeasonParticipations(
    seasonId: string,
    teamIds: readonly string[]
  ): Promise<ReadonlyMap<string, string>>;
  insertTeam(input: {
    id: string;
    leagueId: string;
    name: string;
    createdAt: Date;
  }): Promise<void>;
  insertSeasonTeam(input: {
    id: string;
    seasonId: string;
    teamId: string;
    createdAt: Date;
  }): Promise<void>;
  hasSeasonTeamDependencies(seasonTeamId: string): Promise<boolean>;
  deleteSeasonTeam(seasonTeamId: string): Promise<void>;
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
    result: SeasonTeamResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface SeasonTeamStore {
  transaction<T>(work: (transaction: SeasonTeamTransaction) => Promise<T>): Promise<T>;
}

export interface SeasonTeamDependencies {
  readonly now?: () => Date;
  readonly newId?: () => string;
}

function rejection(
  command: SeasonTeamCommand,
  input: {
    entityType: SeasonTeamRejectionReport['entityType'];
    entityId: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
  }
) {
  return new SeasonTeamRejected(input.message, {
    entityType: input.entityType,
    entityId: input.entityId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: command.type === 'add_teams'
      ? 'add Teams to Season'
      : 'remove Team from Season',
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

function normalizeCommand(command: SeasonTeamCommand) {
  if (command.type === 'remove_team') {
    return command;
  }
  try {
    return {...command, names: normalizeTeamNameBatch(command.names)};
  } catch (error) {
    if (error instanceof RuleViolation) {
      throw rejection(command, {
        entityType: 'Season',
        entityId: command.seasonId,
        currentStateOrCondition: 'requested Team batch is invalid',
        violatedRule: error.rule,
        message: error.message
      });
    }
    throw error;
  }
}

function commandPayload(command: SeasonTeamCommand) {
  return command.type === 'add_teams'
    ? {
        actor_account_id: command.actorAccountId,
        season_id: command.seasonId,
        names: command.names
      }
    : {
        actor_account_id: command.actorAccountId,
        season_team_id: command.seasonTeamId
      };
}

export function createSeasonTeamService(
  store: SeasonTeamStore,
  dependencies: SeasonTeamDependencies = {}
) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function manageSeasonTeams(rawCommand: SeasonTeamCommand): Promise<SeasonTeamResult> {
    const command = normalizeCommand(rawCommand);
    const commandType = `season_team.${command.type}`;
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
      const auditRecordIds: string[] = [];
      let result: SeasonTeamResult;

      if (command.type === 'add_teams') {
        const season = await transaction.findSeasonForUpdate(command.seasonId);
        if (!season) {
          throw rejection(command, {
            entityType: 'Season',
            entityId: command.seasonId,
            currentStateOrCondition: 'Season not found',
            violatedRule: 'season.exists',
            message: 'The Season does not exist'
          });
        }
        if (!await transaction.hasActiveLeagueAdministrator(season.leagueId, command.actorAccountId)) {
          throw rejection(command, {
            entityType: 'Season',
            entityId: season.id,
            currentStateOrCondition: 'actor has no active League Administrator assignment',
            violatedRule: 'authorization.league_admin_required',
            message: 'Only an active League Administrator may add Teams to a Season'
          });
        }

        const storedTeams = await transaction.findLeagueTeamsByNames(season.leagueId, command.names);
        const teamsByName = new Map(storedTeams.map((team) => [team.name.toLowerCase(), team]));
        const resolved: Array<StoredLeagueTeam & {teamCreated: boolean}> = [];
        for (const name of command.names) {
          let team = teamsByName.get(name.toLowerCase());
          let teamCreated = false;
          if (!team) {
            team = {id: newId(), name};
            teamCreated = true;
            await transaction.insertTeam({
              id: team.id,
              leagueId: season.leagueId,
              name: team.name,
              createdAt: acceptedAt
            });
            const auditRecordId = newId();
            auditRecordIds.push(auditRecordId);
            await transaction.appendAuditRecord({
              id: auditRecordId,
              leagueId: season.leagueId,
              actorAccountId: command.actorAccountId,
              action: 'team.created',
              entityType: 'Team',
              entityId: team.id,
              previousValue: null,
              newValue: {id: team.id, league_id: season.leagueId, name: team.name},
              reason: null,
              createdAt: acceptedAt
            });
          }
          resolved.push({...team, teamCreated});
        }

        const participations = await transaction.findSeasonParticipations(
          season.id,
          resolved.map((team) => team.id)
        );
        const teams: ManagedSeasonTeam[] = [];
        for (const team of resolved) {
          const existingSeasonTeamId = participations.get(team.id);
          if (existingSeasonTeamId) {
            teams.push({
              seasonTeamId: existingSeasonTeamId,
              teamId: team.id,
              name: team.name,
              teamCreated: team.teamCreated,
              participationCreated: false
            });
            continue;
          }

          const seasonTeamId = newId();
          await transaction.insertSeasonTeam({
            id: seasonTeamId,
            seasonId: season.id,
            teamId: team.id,
            createdAt: acceptedAt
          });
          const auditRecordId = newId();
          auditRecordIds.push(auditRecordId);
          await transaction.appendAuditRecord({
            id: auditRecordId,
            leagueId: season.leagueId,
            actorAccountId: command.actorAccountId,
            action: 'season_team.added',
            entityType: 'SeasonTeam',
            entityId: seasonTeamId,
            previousValue: null,
            newValue: {
              id: seasonTeamId,
              season_id: season.id,
              team_id: team.id,
              team_name: team.name
            },
            reason: null,
            createdAt: acceptedAt
          });
          teams.push({
            seasonTeamId,
            teamId: team.id,
            name: team.name,
            teamCreated: team.teamCreated,
            participationCreated: true
          });
        }
        result = {
          receiptReused: false,
          operation: command.type,
          seasonId: season.id,
          teams,
          auditRecordIds
        };
      } else {
        const seasonTeam = await transaction.findSeasonTeamForUpdate(command.seasonTeamId);
        if (!seasonTeam) {
          throw rejection(command, {
            entityType: 'SeasonTeam',
            entityId: command.seasonTeamId,
            currentStateOrCondition: 'Season Team not found',
            violatedRule: 'season_team.exists',
            message: 'The Season participation does not exist'
          });
        }
        if (!await transaction.hasActiveLeagueAdministrator(
          seasonTeam.leagueId,
          command.actorAccountId
        )) {
          throw rejection(command, {
            entityType: 'SeasonTeam',
            entityId: seasonTeam.id,
            currentStateOrCondition: 'actor has no active League Administrator assignment',
            violatedRule: 'authorization.league_admin_required',
            message: 'Only an active League Administrator may remove a Team from a Season'
          });
        }
        if (await transaction.hasSeasonTeamDependencies(seasonTeam.id)) {
          throw rejection(command, {
            entityType: 'SeasonTeam',
            entityId: seasonTeam.id,
            currentStateOrCondition: 'Roster Membership, Game, or role history depends on this Season Team',
            violatedRule: 'season_team.removal_without_dependencies',
            message: 'A Team with roster, Game, or role history cannot be removed from the Season'
          });
        }

        await transaction.deleteSeasonTeam(seasonTeam.id);
        const auditRecordId = newId();
        auditRecordIds.push(auditRecordId);
        await transaction.appendAuditRecord({
          id: auditRecordId,
          leagueId: seasonTeam.leagueId,
          actorAccountId: command.actorAccountId,
          action: 'season_team.removed',
          entityType: 'SeasonTeam',
          entityId: seasonTeam.id,
          previousValue: {
            id: seasonTeam.id,
            season_id: seasonTeam.seasonId,
            team_id: seasonTeam.teamId,
            team_name: seasonTeam.name
          },
          newValue: null,
          reason: null,
          createdAt: acceptedAt
        });
        result = {
          receiptReused: false,
          operation: command.type,
          seasonId: seasonTeam.seasonId,
          teams: [{
            seasonTeamId: seasonTeam.id,
            teamId: seasonTeam.teamId,
            name: seasonTeam.name,
            teamCreated: false,
            participationCreated: false
          }],
          auditRecordIds
        };
      }

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
