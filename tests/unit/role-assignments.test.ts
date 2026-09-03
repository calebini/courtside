import {describe, expect, it} from 'vitest';

import {
  createRoleAssignmentService,
  type RoleAssignmentResult,
  type RoleAssignmentStore,
  type RoleAssignmentTransaction,
  type StoredCaptainAssignment,
  type StoredLeagueAdminAssignment,
  type StoredLeagueStatkeeperAssignment,
  type StoredRoleReceipt
} from '@/courtside/services/manage-role-assignments';

class MemoryRoleStore implements RoleAssignmentStore, RoleAssignmentTransaction {
  readonly accounts = [
    {id: 'admin-1', displayName: 'Admin', contactEmail: 'admin@example.com'},
    {id: 'member-1', displayName: 'Member', contactEmail: 'member@example.com'},
    {id: 'member-2', displayName: 'Second', contactEmail: 'second@example.com'}
  ];
  readonly administrators: Array<StoredLeagueAdminAssignment & {active: boolean}> = [
    {id: 'admin-assignment-1', leagueId: 'league-1', userAccountId: 'admin-1', active: true}
  ];
  readonly captains: Array<StoredCaptainAssignment & {active: boolean}> = [];
  readonly statkeepers: StoredLeagueStatkeeperAssignment[] = [];
  readonly audits: Array<{id: string; action: string; previousValue: unknown; newValue: unknown}> = [];
  readonly receipts = new Map<string, StoredRoleReceipt>();

  async transaction<T>(work: (transaction: RoleAssignmentTransaction) => Promise<T>) { return work(this); }
  async lockCommand() {}
  async findCommandReceipt(id: string) { return this.receipts.get(id) ?? null; }
  async findLeagueForUpdate(id: string) { return id === 'league-1' ? {id} : null; }
  async findSeasonTeamForUpdate(id: string) { return id === 'season-team-1' ? {seasonTeamId: id, seasonId: 'season-1', leagueId: 'league-1'} : null; }
  async findAccountByEmail(email: string) { return this.accounts.find((account) => account.contactEmail === email) ?? null; }
  async hasActiveLeagueAdministrator(leagueId: string, accountId: string) { return this.administrators.some((assignment) => assignment.leagueId === leagueId && assignment.userAccountId === accountId && assignment.active); }
  async findActiveLeagueAdministrator(leagueId: string, accountId: string) { return this.administrators.find((assignment) => assignment.leagueId === leagueId && assignment.userAccountId === accountId && assignment.active) ?? null; }
  async findLeagueAdministratorAssignmentForUpdate(id: string) { return this.administrators.find((assignment) => assignment.id === id && assignment.active) ?? null; }
  async countActiveLeagueAdministrators(leagueId: string) { return this.administrators.filter((assignment) => assignment.leagueId === leagueId && assignment.active).length; }
  async insertLeagueAdministrator(input: {id: string; leagueId: string; userAccountId: string}) { this.administrators.push({...input, active: true}); }
  async revokeLeagueAdministrator(input: {assignmentId: string}) { this.administrators.find((assignment) => assignment.id === input.assignmentId)!.active = false; }
  async findActiveLeagueStatkeeper(leagueId: string, accountId: string) { return this.statkeepers.find((assignment) => assignment.leagueId === leagueId && assignment.userAccountId === accountId && !assignment.revokedAt) ?? null; }
  async findLeagueStatkeeperAssignment(id: string) { return this.statkeepers.find((assignment) => assignment.id === id) ?? null; }
  async insertLeagueStatkeeper(input: Parameters<RoleAssignmentTransaction['insertLeagueStatkeeper']>[0]) { this.statkeepers.push({id: input.id, leagueId: input.leagueId, userAccountId: input.userAccountId, assignedByAccountId: input.actorAccountId, assignedAt: input.assignedAt, revokedByAccountId: null, revokedAt: null}); }
  async revokeLeagueStatkeeper(input: Parameters<RoleAssignmentTransaction['revokeLeagueStatkeeper']>[0]) {
    const index = this.statkeepers.findIndex((assignment) => assignment.id === input.assignmentId);
    this.statkeepers[index] = {...this.statkeepers[index]!, revokedByAccountId: input.actorAccountId, revokedAt: input.revokedAt};
  }
  async findActiveCaptainForUpdate(seasonTeamId: string) { return this.captains.find((assignment) => assignment.seasonTeamId === seasonTeamId && assignment.active) ?? null; }
  async findCaptainAssignmentForUpdate(id: string) { return this.captains.find((assignment) => assignment.id === id && assignment.active) ?? null; }
  async insertCaptain(input: {id: string; seasonTeamId: string; userAccountId: string}) { this.captains.push({...input, seasonId: 'season-1', leagueId: 'league-1', active: true}); }
  async revokeCaptain(input: {assignmentId: string}) { this.captains.find((assignment) => assignment.id === input.assignmentId)!.active = false; }
  async appendAudit(input: {id: string; action: string; previousValue: unknown; newValue: unknown}) { this.audits.push(input); }
  async saveCommandReceipt(input: {commandId: string; commandType: string; payloadHash: string; result: RoleAssignmentResult}) { this.receipts.set(input.commandId, input); }
}

describe('role assignment service', () => {
  it('grants and revokes Statkeepers with terminal history, exact replay, and new regrant identity', async () => {
    const store = new MemoryRoleStore();
    let nextId = 0;
    const manage = createRoleAssignmentService(store, {newId: () => `statkeeper-${++nextId}`});
    const command = {type: 'grant_league_statkeeper' as const, commandId: 'grant-keeper', actorAccountId: 'admin-1', leagueId: 'league-1', targetEmail: ' MEMBER@example.com ', reason: '  Capture games  '};
    const first = await manage(command);
    await expect(manage({...command, targetEmail: 'member@example.com', reason: 'Capture games'})).resolves.toEqual({...first, receiptReused: true});
    await expect(manage({...command, targetEmail: 'second@example.com'})).rejects.toMatchObject({report: {violatedRule: 'command.idempotency_identity'}});
    await expect(manage({...command, commandId: 'duplicate-keeper'})).rejects.toMatchObject({report: {violatedRule: 'league_statkeeper.active_unique'}});
    const revoke = {type: 'revoke_league_statkeeper' as const, commandId: 'revoke-keeper', actorAccountId: 'admin-1', assignmentId: first.assignmentId};
    const revoked = await manage(revoke);
    await expect(manage(revoke)).resolves.toEqual({...revoked, receiptReused: true});
    await expect(manage({...revoke, commandId: 'already-revoked'})).rejects.toMatchObject({report: {violatedRule: 'league_statkeeper.active_assignment'}});
    const later = await manage({...command, commandId: 'regrant-keeper'});
    expect(later.assignmentId).not.toBe(first.assignmentId);
    expect(store.statkeepers).toHaveLength(2);
    expect(store.statkeepers[0]).toMatchObject({assignedByAccountId: 'admin-1', revokedByAccountId: 'admin-1', revokedAt: expect.any(Date)});
    expect(store.audits.map(({action}) => action)).toEqual(['league_statkeeper.assigned', 'league_statkeeper.revoked', 'league_statkeeper.assigned']);
    expect(store.receipts.size).toBe(3);
  });

  it('does not let Statkeeper authority administer roles or disclose grant-target lookup results', async () => {
    const store = new MemoryRoleStore();
    const manage = createRoleAssignmentService(store);
    const grant = await manage({type: 'grant_league_statkeeper', commandId: 'initial', actorAccountId: 'admin-1', leagueId: 'league-1', targetEmail: 'member@example.com'});
    await expect(manage({type: 'grant_league_statkeeper', commandId: 'unauthorized-grant', actorAccountId: 'member-1', leagueId: 'league-1', targetEmail: 'missing@example.com'})).rejects.toMatchObject({report: {violatedRule: 'authorization.league_admin_required'}});
    await expect(manage({type: 'revoke_league_statkeeper', commandId: 'unauthorized-revoke', actorAccountId: 'member-1', assignmentId: grant.assignmentId})).rejects.toMatchObject({report: {violatedRule: 'authorization.league_admin_required'}});
    await expect(manage({type: 'grant_league_statkeeper', commandId: 'missing-target', actorAccountId: 'admin-1', leagueId: 'league-1', targetEmail: 'missing@example.com'})).rejects.toMatchObject({report: {violatedRule: 'user_account.exists'}});
    expect(store.statkeepers[0]?.revokedAt).toBeNull();
    expect(store.audits).toHaveLength(1);
    expect(store.receipts.size).toBe(1);
  });

  it('grants an administrator idempotently and protects the final active administrator', async () => {
    const store = new MemoryRoleStore();
    const ids = ['audit-grant', 'assignment-grant'];
    const manage = createRoleAssignmentService(store, {newId: () => ids.shift()!});
    const command = {type: 'grant_league_admin' as const, commandId: 'command-grant', actorAccountId: 'admin-1', leagueId: 'league-1', targetEmail: ' MEMBER@example.com '};

    const first = await manage(command);
    expect(first.assignmentId).toBe('assignment-grant');
    await expect(manage(command)).resolves.toEqual({...first, receiptReused: true});
    expect(store.administrators.filter(({active}) => active)).toHaveLength(2);
    expect(store.audits.map(({action}) => action)).toEqual(['league_admin.assigned']);

    const revoke = createRoleAssignmentService(store, {newId: () => 'audit-revoke'});
    await revoke({type: 'revoke_league_admin', commandId: 'command-revoke', actorAccountId: 'admin-1', assignmentId: first.assignmentId});
    await expect(revoke({type: 'revoke_league_admin', commandId: 'command-final', actorAccountId: 'admin-1', assignmentId: 'admin-assignment-1'})).rejects.toMatchObject({report: {violatedRule: 'league_admin.final_active_preserved'}});
  });

  it('atomically reassigns and revokes a Team Captain marker', async () => {
    const store = new MemoryRoleStore();
    const ids = ['audit-first', 'captain-first', 'audit-second', 'captain-second', 'audit-revoke'];
    const manage = createRoleAssignmentService(store, {newId: () => ids.shift()!});

    const first = await manage({type: 'assign_team_captain', commandId: 'captain-command-1', actorAccountId: 'admin-1', seasonTeamId: 'season-team-1', targetEmail: 'member@example.com'});
    const second = await manage({type: 'assign_team_captain', commandId: 'captain-command-2', actorAccountId: 'admin-1', seasonTeamId: 'season-team-1', targetEmail: 'second@example.com'});
    expect(second.replacedAssignmentId).toBe(first.assignmentId);
    expect(store.captains.filter(({active}) => active).map(({userAccountId}) => userAccountId)).toEqual(['member-2']);
    expect(store.audits.map(({action}) => action)).toEqual(['team_captain.assigned', 'team_captain.reassigned']);

    await manage({type: 'revoke_team_captain', commandId: 'captain-command-3', actorAccountId: 'admin-1', assignmentId: second.assignmentId});
    expect(store.captains.filter(({active}) => active)).toHaveLength(0);
  });

  it('rejects unknown accounts and unauthorized actors without mutation', async () => {
    const store = new MemoryRoleStore();
    const manage = createRoleAssignmentService(store);
    await expect(manage({type: 'grant_league_admin', commandId: 'unknown', actorAccountId: 'admin-1', leagueId: 'league-1', targetEmail: 'missing@example.com'})).rejects.toMatchObject({report: {violatedRule: 'user_account.exists'}});
    await expect(manage({type: 'assign_team_captain', commandId: 'unauthorized', actorAccountId: 'member-1', seasonTeamId: 'season-team-1', targetEmail: 'second@example.com'})).rejects.toMatchObject({report: {violatedRule: 'authorization.league_admin_required'}});
    expect(store.audits).toHaveLength(0);
  });
});
