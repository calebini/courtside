import {describe, expect, it} from 'vitest';

import {normalizeVenueDetails} from '@/courtside/core/venue';
import {
  createVenueService,
  type StoredVenue,
  type StoredVenueReceipt,
  type VenueResult,
  type VenueStore,
  type VenueTransaction
} from '@/courtside/services/manage-venue';

class MemoryVenueStore implements VenueStore, VenueTransaction {
  authorized = true;
  readonly venues: StoredVenue[] = [];
  readonly audits: Array<{id: string; action: string}> = [];
  readonly receipts = new Map<string, StoredVenueReceipt>();

  async transaction<T>(work: (transaction: VenueTransaction) => Promise<T>) {
    return work(this);
  }

  async lockCommand() {}

  async findCommandReceipt(commandId: string) {
    return this.receipts.get(commandId) ?? null;
  }

  async findLeagueForUpdate(leagueId: string) {
    return leagueId === 'league-1' ? {id: leagueId} : null;
  }

  async findVenueForUpdate(venueId: string) {
    return this.venues.find((venue) => venue.id === venueId) ?? null;
  }

  async hasActiveLeagueAdministrator() {
    return this.authorized;
  }

  async findActiveVenueByName(
    leagueId: string,
    name: string,
    excludedVenueId: string | null
  ) {
    const venue = this.venues.find(
      (candidate) =>
        candidate.leagueId === leagueId &&
        candidate.archivedAt === null &&
        candidate.id !== excludedVenueId &&
        candidate.name.toLowerCase() === name.toLowerCase()
    );
    return venue ? {id: venue.id, name: venue.name} : null;
  }

  async insertVenue(input: {
    id: string;
    leagueId: string;
    name: string;
    address: string;
    notes: string | null;
  }) {
    this.venues.push({...input, archivedAt: null});
  }

  async updateVenue(input: {
    venueId: string;
    name: string;
    address: string;
    notes: string | null;
  }) {
    const index = this.venues.findIndex((venue) => venue.id === input.venueId);
    this.venues[index] = {...this.venues[index], ...input, id: input.venueId};
  }

  async archiveVenue(input: {venueId: string; archivedAt: Date}) {
    const index = this.venues.findIndex((venue) => venue.id === input.venueId);
    this.venues[index] = {...this.venues[index], archivedAt: input.archivedAt};
  }

  async appendAuditRecord(input: {id: string; action: string}) {
    this.audits.push(input);
  }

  async saveCommandReceipt(input: {
    commandId: string;
    commandType: string;
    payloadHash: string;
    result: VenueResult;
  }) {
    this.receipts.set(input.commandId, input);
  }
}

function storedVenue(input: Partial<StoredVenue> = {}): StoredVenue {
  return {
    id: 'venue-1',
    leagueId: 'league-1',
    name: 'Gymnase Saint-Merri',
    address: '16 Rue du Renard, Paris',
    notes: null,
    archivedAt: null,
    ...input
  };
}

describe('Venue core', () => {
  it('normalizes required details and optional notes', () => {
    expect(normalizeVenueDetails({
      name: '  Gymnase   Saint-Merri ',
      address: ' 16   Rue du Renard, Paris ',
      notes: '  Entrée   côté cour '
    })).toEqual({
      name: 'Gymnase Saint-Merri',
      address: '16 Rue du Renard, Paris',
      notes: 'Entrée côté cour'
    });
    expect(normalizeVenueDetails({name: 'Gym', address: 'Paris', notes: ' '})).toMatchObject({
      notes: null
    });
    expect(() => normalizeVenueDetails({name: 'x', address: 'Paris', notes: null})).toThrow(
      /2 through 120/
    );
  });
});

describe('Venue management service', () => {
  it('creates one audited Venue and reuses an identical command', async () => {
    const store = new MemoryVenueStore();
    const ids = ['audit-create', 'venue-created'];
    const manage = createVenueService(store, {
      now: () => new Date('2026-08-16T06:00:00Z'),
      newId: () => ids.shift()!
    });
    const command = {
      type: 'create' as const,
      commandId: 'command-create',
      actorAccountId: 'admin-1',
      leagueId: 'league-1',
      name: ' Gymnase Saint-Merri ',
      address: '16 Rue du Renard, Paris',
      notes: ''
    };

    const first = await manage(command);
    expect(first).toMatchObject({
      receiptReused: false,
      operation: 'create',
      venue: {id: 'venue-created', name: 'Gymnase Saint-Merri', notes: null},
      auditRecordId: 'audit-create'
    });
    await expect(manage(command)).resolves.toEqual({...first, receiptReused: true});
    expect(store.venues).toHaveLength(1);
    expect(store.audits.map((audit) => audit.action)).toEqual(['venue.created']);
  });

  it('rejects unauthorized and duplicate creation without mutation', async () => {
    const store = new MemoryVenueStore();
    store.authorized = false;
    const manage = createVenueService(store);
    await expect(manage({
      type: 'create',
      commandId: 'command-no-access',
      actorAccountId: 'outsider-1',
      leagueId: 'league-1',
      name: 'Gymnase Saint-Merri',
      address: '16 Rue du Renard, Paris',
      notes: null
    })).rejects.toMatchObject({report: {violatedRule: 'authorization.league_admin_required'}});

    store.authorized = true;
    store.venues.push(storedVenue());
    await expect(manage({
      type: 'create',
      commandId: 'command-duplicate',
      actorAccountId: 'admin-1',
      leagueId: 'league-1',
      name: 'GYMNASE SAINT-MERRI',
      address: 'Another address',
      notes: null
    })).rejects.toMatchObject({report: {violatedRule: 'venue.active_name_unique_per_league'}});
    expect(store.venues).toHaveLength(1);
  });

  it('audits a material correction and rejects an unchanged update', async () => {
    const store = new MemoryVenueStore();
    store.venues.push(storedVenue());
    const manage = createVenueService(store, {newId: () => 'audit-update'});
    const command = {
      type: 'update' as const,
      commandId: 'command-update',
      actorAccountId: 'admin-1',
      venueId: 'venue-1',
      name: 'Gymnase Saint-Merri',
      address: '16 Rue du Renard, 75004 Paris',
      notes: 'Entrée côté cour'
    };

    await expect(manage(command)).resolves.toMatchObject({
      operation: 'update',
      venue: {address: '16 Rue du Renard, 75004 Paris', notes: 'Entrée côté cour'}
    });
    expect(store.audits.map((audit) => audit.action)).toEqual(['venue.updated']);

    await expect(manage({...command, commandId: 'command-unchanged'})).rejects.toMatchObject({
      report: {violatedRule: 'venue.change_required'}
    });
  });

  it('archives terminally without deleting Venue identity', async () => {
    const store = new MemoryVenueStore();
    store.venues.push(storedVenue());
    const manage = createVenueService(store, {
      now: () => new Date('2026-08-16T06:30:00Z'),
      newId: () => 'audit-archive'
    });

    const result = await manage({
      type: 'archive',
      commandId: 'command-archive',
      actorAccountId: 'admin-1',
      venueId: 'venue-1'
    });
    expect(result.venue.archivedAt).toBe('2026-08-16T06:30:00.000Z');
    expect(store.venues).toHaveLength(1);
    expect(store.venues[0].archivedAt).toEqual(new Date('2026-08-16T06:30:00Z'));
    expect(store.audits.map((audit) => audit.action)).toEqual(['venue.archived']);

    await expect(manage({
      type: 'archive',
      commandId: 'command-archive-again',
      actorAccountId: 'admin-1',
      venueId: 'venue-1'
    })).rejects.toMatchObject({report: {violatedRule: 'venue.active_required'}});
  });
});
