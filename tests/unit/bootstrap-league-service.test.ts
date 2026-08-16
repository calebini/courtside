import {describe, expect, it} from 'vitest';

import {
  createLeagueBootstrapService,
  type BootstrapLeagueStore,
  type BootstrapLeagueTransaction,
  type StoredBootstrapLeague,
  type StoredBootstrapReceipt
} from '@/courtside/services/bootstrap-league';

class MemoryBootstrapStore implements BootstrapLeagueStore, BootstrapLeagueTransaction {
  readonly accounts = [{id: 'account-1', contactEmail: 'admin@example.test'}];
  readonly leagues: StoredBootstrapLeague[] = [];
  readonly assignments: {id: string; leagueId: string; accountId: string}[] = [];
  readonly audits: {id: string}[] = [];
  readonly receipts: StoredBootstrapReceipt[] = [];

  async transaction<T>(work: (transaction: BootstrapLeagueTransaction) => Promise<T>) {
    return work(this);
  }

  async lockBootstrap() {}

  async findCommandReceipt(commandId: string) {
    return this.receipts.find((receipt) => receipt.commandId === commandId) ?? null;
  }

  async findAcceptedBootstrap(payloadHash: string) {
    return this.receipts.find((receipt) => receipt.payloadHash === payloadHash) ?? null;
  }

  async listLeaguesForUpdate() {
    return this.leagues;
  }

  async findAccountsByEmail(contactEmail: string) {
    return this.accounts.filter((account) => account.contactEmail === contactEmail);
  }

  async hasAdministratorAssignmentHistory(leagueId: string) {
    return this.assignments.some((assignment) => assignment.leagueId === leagueId);
  }

  async insertLeague(input: StoredBootstrapLeague & {createdAt: Date}) {
    this.leagues.push(input);
  }

  async insertAdministratorAssignment(input: {
    id: string;
    leagueId: string;
    accountId: string;
    assignedAt: Date;
  }) {
    this.assignments.push(input);
  }

  async appendAuditRecord(input: {id: string}) {
    this.audits.push(input);
  }

  async saveCommandReceipt(input: StoredBootstrapReceipt & {createdAt: Date}) {
    this.receipts.push(input);
  }
}

const baseCommand = {
  adminEmail: 'admin@example.test',
  leagueName: 'Paris Rec Basketball',
  timezone: 'Europe/Paris',
  defaultLanguage: 'fr' as const
};

describe('initial League Administrator bootstrap service', () => {
  it('plans without mutation, then creates one audited assignment atomically', async () => {
    const store = new MemoryBootstrapStore();
    const ids = ['league-1', 'assignment-1', 'audit-1'];
    const bootstrap = createLeagueBootstrapService(store, {
      now: () => new Date('2026-08-15T20:00:00Z'),
      newId: () => ids.shift()!
    });

    const plan = await bootstrap({...baseCommand, commandId: 'command-plan', apply: false});
    expect(plan).toMatchObject({
      status: 'planned',
      league: {id: null, willCreate: true},
      administrator: {accountId: 'account-1', assignmentId: null}
    });
    expect(store.leagues).toHaveLength(0);
    expect(store.assignments).toHaveLength(0);
    expect(store.audits).toHaveLength(0);
    expect(store.receipts).toHaveLength(0);

    const result = await bootstrap({...baseCommand, commandId: 'command-apply', apply: true});
    expect(result).toMatchObject({
      status: 'created',
      receiptReused: false,
      league: {id: 'league-1', willCreate: true},
      administrator: {accountId: 'account-1', assignmentId: 'assignment-1'},
      auditRecordId: 'audit-1'
    });
    expect(store.leagues).toHaveLength(1);
    expect(store.assignments).toHaveLength(1);
    expect(store.audits).toHaveLength(1);
    expect(store.receipts).toHaveLength(1);
  });

  it('reuses identical accepted content and rejects a later conflicting bootstrap', async () => {
    const store = new MemoryBootstrapStore();
    const ids = ['league-1', 'assignment-1', 'audit-1'];
    const bootstrap = createLeagueBootstrapService(store, {newId: () => ids.shift()!});
    const first = await bootstrap({...baseCommand, commandId: 'command-1', apply: true});

    const repeated = await bootstrap({...baseCommand, commandId: 'command-2', apply: true});
    expect(repeated).toEqual({...first, status: 'reused', receiptReused: true});
    expect(store.assignments).toHaveLength(1);
    expect(store.receipts).toHaveLength(1);

    await expect(bootstrap({
      ...baseCommand,
      adminEmail: 'someone-else@example.test',
      commandId: 'command-3',
      apply: true
    })).rejects.toMatchObject({rule: 'bootstrap.already_completed'});
  });

  it('rejects reuse of a command identity for different content', async () => {
    const store = new MemoryBootstrapStore();
    const ids = ['league-1', 'assignment-1', 'audit-1'];
    const bootstrap = createLeagueBootstrapService(store, {newId: () => ids.shift()!});
    await bootstrap({...baseCommand, commandId: 'same-command', apply: true});

    await expect(bootstrap({
      ...baseCommand,
      leagueName: 'Different League',
      commandId: 'same-command',
      apply: true
    })).rejects.toMatchObject({rule: 'command.idempotency_identity'});
  });
});
