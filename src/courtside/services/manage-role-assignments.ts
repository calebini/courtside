import {randomUUID} from 'node:crypto';

import {validateEmail} from '@/courtside/core/account-onboarding';
import {canonicalHash} from '@/courtside/core/configuration';
import {RuleViolation} from '@/courtside/core/errors';

interface BaseRoleCommand {
  readonly commandId: string;
  readonly actorAccountId: string;
  readonly reason?: string | null;
}

export type RoleAssignmentCommand =
  | (BaseRoleCommand & {type: 'grant_league_admin'; leagueId: string; targetEmail: string})
  | (BaseRoleCommand & {type: 'revoke_league_admin'; assignmentId: string})
  | (BaseRoleCommand & {type: 'assign_team_captain'; seasonTeamId: string; targetEmail: string})
  | (BaseRoleCommand & {type: 'revoke_team_captain'; assignmentId: string});

export interface RoleAssignmentResult {
  readonly receiptReused: boolean;
  readonly operation: RoleAssignmentCommand['type'];
  readonly assignmentId: string;
  readonly replacedAssignmentId: string | null;
  readonly auditRecordId: string;
}

export interface RoleAssignmentRejectionReport {
  readonly entityType: 'League' | 'LeagueAdministratorAssignment' | 'SeasonTeam' | 'TeamCaptainAssignment' | 'UserAccount' | 'Command';
  readonly entityId: string;
  readonly currentStateOrCondition: string;
  readonly requestedMutation: RoleAssignmentCommand['type'];
  readonly actorAccountId: string;
  readonly violatedRule: string;
  readonly authoritativeStatePreserved: true;
}

export class RoleAssignmentRejected extends Error {
  constructor(message: string, readonly report: RoleAssignmentRejectionReport) {
    super(message);
    this.name = 'RoleAssignmentRejected';
  }
}

export interface StoredRoleReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: RoleAssignmentResult;
}

export interface StoredRoleAccount {readonly id: string}
export interface StoredLeagueAdminAssignment {readonly id: string; readonly leagueId: string; readonly userAccountId: string}
export interface StoredCaptainScope {readonly seasonTeamId: string; readonly seasonId: string; readonly leagueId: string}
export interface StoredCaptainAssignment extends StoredCaptainScope {readonly id: string; readonly userAccountId: string}

export interface RoleAssignmentTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredRoleReceipt | null>;
  findLeagueForUpdate(leagueId: string): Promise<{id: string} | null>;
  findSeasonTeamForUpdate(seasonTeamId: string): Promise<StoredCaptainScope | null>;
  findAccountByEmail(email: string): Promise<StoredRoleAccount | null>;
  hasActiveLeagueAdministrator(leagueId: string, accountId: string): Promise<boolean>;
  findActiveLeagueAdministrator(leagueId: string, accountId: string): Promise<StoredLeagueAdminAssignment | null>;
  findLeagueAdministratorAssignmentForUpdate(assignmentId: string): Promise<StoredLeagueAdminAssignment | null>;
  countActiveLeagueAdministrators(leagueId: string): Promise<number>;
  insertLeagueAdministrator(input: {id: string; leagueId: string; userAccountId: string; assignedAt: Date}): Promise<void>;
  revokeLeagueAdministrator(input: {assignmentId: string; revokedAt: Date}): Promise<void>;
  findActiveCaptainForUpdate(seasonTeamId: string): Promise<StoredCaptainAssignment | null>;
  findCaptainAssignmentForUpdate(assignmentId: string): Promise<StoredCaptainAssignment | null>;
  insertCaptain(input: {id: string; seasonTeamId: string; userAccountId: string; actorAccountId: string; assignedAt: Date}): Promise<void>;
  revokeCaptain(input: {assignmentId: string; actorAccountId: string; revokedAt: Date}): Promise<void>;
  appendAudit(input: {id: string; leagueId: string; actorAccountId: string; action: string; entityType: string; entityId: string; previousValue: unknown; newValue: unknown; reason: string | null; createdAt: Date}): Promise<void>;
  saveCommandReceipt(input: {commandId: string; commandType: string; payloadHash: string; result: RoleAssignmentResult; createdAt: Date}): Promise<void>;
}

export interface RoleAssignmentStore {
  transaction<T>(work: (transaction: RoleAssignmentTransaction) => Promise<T>): Promise<T>;
}

function reject(command: RoleAssignmentCommand, input: Omit<RoleAssignmentRejectionReport, 'requestedMutation' | 'actorAccountId' | 'authoritativeStatePreserved'> & {message: string}) {
  return new RoleAssignmentRejected(input.message, {
    entityType: input.entityType,
    entityId: input.entityId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: command.type,
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

function normalizeCommand(command: RoleAssignmentCommand): RoleAssignmentCommand {
  if (!('targetEmail' in command)) return {...command, reason: command.reason?.trim() || null};
  try {
    return {...command, targetEmail: validateEmail(command.targetEmail), reason: command.reason?.trim() || null};
  } catch (error) {
    if (error instanceof RuleViolation) {
      throw reject(command, {entityType: 'UserAccount', entityId: command.targetEmail, currentStateOrCondition: 'invalid registered email', violatedRule: error.rule, message: error.message});
    }
    throw error;
  }
}

function payload(command: RoleAssignmentCommand) {
  const content: Record<string, unknown> = {...command};
  delete content.commandId;
  return {...content, reason: command.reason ?? null};
}

export function createRoleAssignmentService(store: RoleAssignmentStore, dependencies: {now?: () => Date; newId?: () => string} = {}) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;
  return async (rawCommand: RoleAssignmentCommand): Promise<RoleAssignmentResult> => {
    const command = normalizeCommand(rawCommand);
    const commandType = `role.${command.type}`;
    const payloadHash = canonicalHash(payload(command));
    return store.transaction(async (transaction) => {
      await transaction.lockCommand(command.commandId);
      const receipt = await transaction.findCommandReceipt(command.commandId);
      if (receipt) {
        if (receipt.commandType !== commandType || receipt.payloadHash !== payloadHash) {
          throw reject(command, {entityType: 'Command', entityId: command.commandId, currentStateOrCondition: 'identity already accepted with different content', violatedRule: 'command.idempotency_identity', message: 'Command identity cannot be reused'});
        }
        return {...receipt.result, receiptReused: true};
      }

      const acceptedAt = now();
      let assignmentId: string;
      let replacedAssignmentId: string | null = null;
      const auditRecordId = newId();
      let leagueId: string;
      let action: string;
      let entityType: string;
      let previousValue: unknown = {};
      let newValue: unknown;

      if (command.type === 'grant_league_admin') {
        const league = await transaction.findLeagueForUpdate(command.leagueId);
        if (!league) throw reject(command, {entityType: 'League', entityId: command.leagueId, currentStateOrCondition: 'not found', violatedRule: 'league.exists', message: 'League not found'});
        if (!await transaction.hasActiveLeagueAdministrator(league.id, command.actorAccountId)) throw reject(command, {entityType: 'League', entityId: league.id, currentStateOrCondition: 'actor lacks active assignment', violatedRule: 'authorization.league_admin_required', message: 'League Administrator authority required'});
        const account = await transaction.findAccountByEmail(command.targetEmail);
        if (!account) throw reject(command, {entityType: 'UserAccount', entityId: command.targetEmail, currentStateOrCondition: 'no provisioned account', violatedRule: 'user_account.exists', message: 'The account must register before authority can be granted'});
        if (await transaction.findActiveLeagueAdministrator(league.id, account.id)) throw reject(command, {entityType: 'UserAccount', entityId: account.id, currentStateOrCondition: 'already an active League Administrator', violatedRule: 'league_admin.active_unique', message: 'The account already has administrator authority'});
        assignmentId = newId();
        leagueId = league.id;
        await transaction.insertLeagueAdministrator({id: assignmentId, leagueId, userAccountId: account.id, assignedAt: acceptedAt});
        action = 'league_admin.assigned';
        entityType = 'LeagueAdministratorAssignment';
        newValue = {userAccountId: account.id, active: true};
      } else if (command.type === 'revoke_league_admin') {
        const assignment = await transaction.findLeagueAdministratorAssignmentForUpdate(command.assignmentId);
        if (!assignment) throw reject(command, {entityType: 'LeagueAdministratorAssignment', entityId: command.assignmentId, currentStateOrCondition: 'not active', violatedRule: 'league_admin.active_assignment', message: 'Active assignment not found'});
        await transaction.findLeagueForUpdate(assignment.leagueId);
        if (!await transaction.hasActiveLeagueAdministrator(assignment.leagueId, command.actorAccountId)) throw reject(command, {entityType: 'LeagueAdministratorAssignment', entityId: assignment.id, currentStateOrCondition: 'actor lacks active assignment', violatedRule: 'authorization.league_admin_required', message: 'League Administrator authority required'});
        if (await transaction.countActiveLeagueAdministrators(assignment.leagueId) <= 1) throw reject(command, {entityType: 'LeagueAdministratorAssignment', entityId: assignment.id, currentStateOrCondition: 'final active League Administrator', violatedRule: 'league_admin.final_active_preserved', message: 'The final active League Administrator cannot be revoked'});
        assignmentId = assignment.id;
        leagueId = assignment.leagueId;
        previousValue = {userAccountId: assignment.userAccountId, active: true};
        newValue = {userAccountId: assignment.userAccountId, active: false};
        await transaction.revokeLeagueAdministrator({assignmentId, revokedAt: acceptedAt});
        action = 'league_admin.revoked';
        entityType = 'LeagueAdministratorAssignment';
      } else if (command.type === 'assign_team_captain') {
        const scope = await transaction.findSeasonTeamForUpdate(command.seasonTeamId);
        if (!scope) throw reject(command, {entityType: 'SeasonTeam', entityId: command.seasonTeamId, currentStateOrCondition: 'not found', violatedRule: 'season_team.exists', message: 'Season Team not found'});
        if (!await transaction.hasActiveLeagueAdministrator(scope.leagueId, command.actorAccountId)) throw reject(command, {entityType: 'SeasonTeam', entityId: scope.seasonTeamId, currentStateOrCondition: 'actor lacks active assignment', violatedRule: 'authorization.league_admin_required', message: 'League Administrator authority required'});
        const account = await transaction.findAccountByEmail(command.targetEmail);
        if (!account) throw reject(command, {entityType: 'UserAccount', entityId: command.targetEmail, currentStateOrCondition: 'no provisioned account', violatedRule: 'user_account.exists', message: 'The account must register before authority can be assigned'});
        const current = await transaction.findActiveCaptainForUpdate(scope.seasonTeamId);
        if (current?.userAccountId === account.id) throw reject(command, {entityType: 'TeamCaptainAssignment', entityId: current.id, currentStateOrCondition: 'account is already the active captain', violatedRule: 'team_captain.no_op', message: 'This account is already the Team Captain'});
        if (current) {
          replacedAssignmentId = current.id;
          previousValue = {assignmentId: current.id, userAccountId: current.userAccountId, active: true};
          await transaction.revokeCaptain({assignmentId: current.id, actorAccountId: command.actorAccountId, revokedAt: acceptedAt});
        }
        assignmentId = newId();
        leagueId = scope.leagueId;
        await transaction.insertCaptain({id: assignmentId, seasonTeamId: scope.seasonTeamId, userAccountId: account.id, actorAccountId: command.actorAccountId, assignedAt: acceptedAt});
        action = current ? 'team_captain.reassigned' : 'team_captain.assigned';
        entityType = 'TeamCaptainAssignment';
        newValue = {assignmentId, seasonTeamId: scope.seasonTeamId, seasonId: scope.seasonId, userAccountId: account.id, active: true};
      } else {
        const assignment = await transaction.findCaptainAssignmentForUpdate(command.assignmentId);
        if (!assignment) throw reject(command, {entityType: 'TeamCaptainAssignment', entityId: command.assignmentId, currentStateOrCondition: 'not active', violatedRule: 'team_captain.active_assignment', message: 'Active captain assignment not found'});
        if (!await transaction.hasActiveLeagueAdministrator(assignment.leagueId, command.actorAccountId)) throw reject(command, {entityType: 'TeamCaptainAssignment', entityId: assignment.id, currentStateOrCondition: 'actor lacks active assignment', violatedRule: 'authorization.league_admin_required', message: 'League Administrator authority required'});
        assignmentId = assignment.id;
        leagueId = assignment.leagueId;
        previousValue = {seasonTeamId: assignment.seasonTeamId, userAccountId: assignment.userAccountId, active: true};
        newValue = {seasonTeamId: assignment.seasonTeamId, userAccountId: assignment.userAccountId, active: false};
        await transaction.revokeCaptain({assignmentId, actorAccountId: command.actorAccountId, revokedAt: acceptedAt});
        action = 'team_captain.revoked';
        entityType = 'TeamCaptainAssignment';
      }

      await transaction.appendAudit({id: auditRecordId, leagueId, actorAccountId: command.actorAccountId, action, entityType, entityId: assignmentId, previousValue, newValue, reason: command.reason ?? null, createdAt: acceptedAt});
      const result: RoleAssignmentResult = {receiptReused: false, operation: command.type, assignmentId, replacedAssignmentId, auditRecordId};
      await transaction.saveCommandReceipt({commandId: command.commandId, commandType, payloadHash, result, createdAt: acceptedAt});
      return result;
    });
  };
}
