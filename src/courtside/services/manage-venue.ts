import {randomUUID} from 'node:crypto';

import {canonicalHash} from '@/courtside/core/configuration';
import {RuleViolation} from '@/courtside/core/errors';
import {normalizeVenueDetails} from '@/courtside/core/venue';

interface BaseVenueCommand {
  readonly commandId: string;
  readonly actorAccountId: string;
}

export interface CreateVenueCommand extends BaseVenueCommand {
  readonly type: 'create';
  readonly leagueId: string;
  readonly name: string;
  readonly address: string;
  readonly notes: string | null;
}

export interface UpdateVenueCommand extends BaseVenueCommand {
  readonly type: 'update';
  readonly venueId: string;
  readonly name: string;
  readonly address: string;
  readonly notes: string | null;
}

export interface ArchiveVenueCommand extends BaseVenueCommand {
  readonly type: 'archive';
  readonly venueId: string;
}

export type VenueCommand = CreateVenueCommand | UpdateVenueCommand | ArchiveVenueCommand;

export interface ManagedVenue {
  readonly id: string;
  readonly leagueId: string;
  readonly name: string;
  readonly address: string;
  readonly notes: string | null;
  readonly archivedAt: string | null;
}

export interface VenueResult {
  readonly receiptReused: boolean;
  readonly operation: VenueCommand['type'];
  readonly venue: ManagedVenue;
  readonly auditRecordId: string;
}

export interface VenueRejectionReport {
  readonly entityType: 'League' | 'Venue' | 'Command';
  readonly entityId: string;
  readonly currentStateOrCondition: string;
  readonly requestedMutation: string;
  readonly actorAccountId: string;
  readonly violatedRule: string;
  readonly authoritativeStatePreserved: true;
}

export class VenueRejected extends Error {
  readonly report: VenueRejectionReport;

  constructor(message: string, report: VenueRejectionReport) {
    super(message);
    this.name = 'VenueRejected';
    this.report = report;
  }
}

export interface StoredVenueReceipt {
  readonly commandType: string;
  readonly payloadHash: string;
  readonly result: VenueResult;
}

export interface StoredVenue {
  readonly id: string;
  readonly leagueId: string;
  readonly name: string;
  readonly address: string;
  readonly notes: string | null;
  readonly archivedAt: Date | null;
}

export interface VenueTransaction {
  lockCommand(commandId: string): Promise<void>;
  findCommandReceipt(commandId: string): Promise<StoredVenueReceipt | null>;
  findLeagueForUpdate(leagueId: string): Promise<{id: string} | null>;
  findVenueForUpdate(venueId: string): Promise<StoredVenue | null>;
  hasActiveLeagueAdministrator(leagueId: string, actorAccountId: string): Promise<boolean>;
  findActiveVenueByName(
    leagueId: string,
    name: string,
    excludedVenueId: string | null
  ): Promise<{id: string; name: string} | null>;
  insertVenue(input: {
    id: string;
    leagueId: string;
    name: string;
    address: string;
    notes: string | null;
    createdAt: Date;
  }): Promise<void>;
  updateVenue(input: {
    venueId: string;
    name: string;
    address: string;
    notes: string | null;
  }): Promise<void>;
  archiveVenue(input: {venueId: string; archivedAt: Date}): Promise<void>;
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
    result: VenueResult;
    createdAt: Date;
  }): Promise<void>;
}

export interface VenueStore {
  transaction<T>(work: (transaction: VenueTransaction) => Promise<T>): Promise<T>;
}

export interface VenueDependencies {
  readonly now?: () => Date;
  readonly newId?: () => string;
}

function requestedMutation(command: VenueCommand) {
  return command.type === 'create'
    ? 'create Venue'
    : command.type === 'update'
      ? 'update Venue'
      : 'archive Venue';
}

function rejected(
  command: VenueCommand,
  input: {
    entityType: VenueRejectionReport['entityType'];
    entityId: string;
    currentStateOrCondition: string;
    violatedRule: string;
    message: string;
  }
) {
  return new VenueRejected(input.message, {
    entityType: input.entityType,
    entityId: input.entityId,
    currentStateOrCondition: input.currentStateOrCondition,
    requestedMutation: requestedMutation(command),
    actorAccountId: command.actorAccountId,
    violatedRule: input.violatedRule,
    authoritativeStatePreserved: true
  });
}

function normalizeCommand(command: VenueCommand): VenueCommand {
  if (command.type === 'archive') {
    return command;
  }
  try {
    return {...command, ...normalizeVenueDetails(command)};
  } catch (error) {
    if (error instanceof RuleViolation) {
      throw rejected(command, {
        entityType: 'Venue',
        entityId: command.type === 'create' ? command.leagueId : command.venueId,
        currentStateOrCondition: 'requested Venue details are invalid',
        violatedRule: error.rule,
        message: error.message
      });
    }
    throw error;
  }
}

function commandPayload(command: VenueCommand) {
  return command.type === 'create'
    ? {
        actor_account_id: command.actorAccountId,
        league_id: command.leagueId,
        name: command.name,
        address: command.address,
        notes: command.notes
      }
    : command.type === 'update'
      ? {
          actor_account_id: command.actorAccountId,
          venue_id: command.venueId,
          name: command.name,
          address: command.address,
          notes: command.notes
        }
      : {actor_account_id: command.actorAccountId, venue_id: command.venueId};
}

function managedVenue(venue: StoredVenue): ManagedVenue {
  return {
    id: venue.id,
    leagueId: venue.leagueId,
    name: venue.name,
    address: venue.address,
    notes: venue.notes,
    archivedAt: venue.archivedAt?.toISOString() ?? null
  };
}

function auditVenue(venue: ManagedVenue) {
  return {
    id: venue.id,
    league_id: venue.leagueId,
    name: venue.name,
    address: venue.address,
    notes: venue.notes,
    archived_at: venue.archivedAt
  };
}

export function createVenueService(store: VenueStore, dependencies: VenueDependencies = {}) {
  const now = dependencies.now ?? (() => new Date());
  const newId = dependencies.newId ?? randomUUID;

  return async function manageVenue(rawCommand: VenueCommand): Promise<VenueResult> {
    const command = normalizeCommand(rawCommand);
    const commandType = `venue.${command.type}`;
    const payloadHash = canonicalHash(commandPayload(command));

    return store.transaction(async (transaction) => {
      await transaction.lockCommand(command.commandId);
      const receipt = await transaction.findCommandReceipt(command.commandId);
      if (receipt) {
        if (receipt.commandType !== commandType || receipt.payloadHash !== payloadHash) {
          throw rejected(command, {
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
      const auditRecordId = newId();
      let previousValue: ManagedVenue | null = null;
      let venue: ManagedVenue;

      if (command.type === 'create') {
        const league = await transaction.findLeagueForUpdate(command.leagueId);
        if (!league) {
          throw rejected(command, {
            entityType: 'League',
            entityId: command.leagueId,
            currentStateOrCondition: 'League not found',
            violatedRule: 'league.exists',
            message: 'The League does not exist'
          });
        }
        if (!await transaction.hasActiveLeagueAdministrator(league.id, command.actorAccountId)) {
          throw rejected(command, {
            entityType: 'League',
            entityId: league.id,
            currentStateOrCondition: 'actor has no active League Administrator assignment',
            violatedRule: 'authorization.league_admin_required',
            message: 'Only an active League Administrator may create a Venue'
          });
        }
        const duplicate = await transaction.findActiveVenueByName(league.id, command.name, null);
        if (duplicate) {
          throw rejected(command, {
            entityType: 'Venue',
            entityId: duplicate.id,
            currentStateOrCondition: `active Venue named ${duplicate.name} already exists`,
            violatedRule: 'venue.active_name_unique_per_league',
            message: 'An active Venue with that name already exists in this League'
          });
        }

        venue = {
          id: newId(),
          leagueId: league.id,
          name: command.name,
          address: command.address,
          notes: command.notes,
          archivedAt: null
        };
        await transaction.insertVenue({...venue, createdAt: acceptedAt});
      } else {
        const storedVenue = await transaction.findVenueForUpdate(command.venueId);
        if (!storedVenue) {
          throw rejected(command, {
            entityType: 'Venue',
            entityId: command.venueId,
            currentStateOrCondition: 'Venue not found',
            violatedRule: 'venue.exists',
            message: 'The Venue does not exist'
          });
        }
        if (!await transaction.hasActiveLeagueAdministrator(
          storedVenue.leagueId,
          command.actorAccountId
        )) {
          throw rejected(command, {
            entityType: 'Venue',
            entityId: storedVenue.id,
            currentStateOrCondition: 'actor has no active League Administrator assignment',
            violatedRule: 'authorization.league_admin_required',
            message: 'Only an active League Administrator may change a Venue'
          });
        }
        if (storedVenue.archivedAt) {
          throw rejected(command, {
            entityType: 'Venue',
            entityId: storedVenue.id,
            currentStateOrCondition: 'Venue is archived',
            violatedRule: 'venue.active_required',
            message: 'An archived Venue cannot be changed'
          });
        }

        previousValue = managedVenue(storedVenue);
        if (command.type === 'update') {
          if (
            storedVenue.name === command.name &&
            storedVenue.address === command.address &&
            storedVenue.notes === command.notes
          ) {
            throw rejected(command, {
              entityType: 'Venue',
              entityId: storedVenue.id,
              currentStateOrCondition: 'normalized Venue details are unchanged',
              violatedRule: 'venue.change_required',
              message: 'A Venue correction must change at least one field'
            });
          }
          const duplicate = await transaction.findActiveVenueByName(
            storedVenue.leagueId,
            command.name,
            storedVenue.id
          );
          if (duplicate) {
            throw rejected(command, {
              entityType: 'Venue',
              entityId: duplicate.id,
              currentStateOrCondition: `active Venue named ${duplicate.name} already exists`,
              violatedRule: 'venue.active_name_unique_per_league',
              message: 'An active Venue with that name already exists in this League'
            });
          }
          await transaction.updateVenue({
            venueId: storedVenue.id,
            name: command.name,
            address: command.address,
            notes: command.notes
          });
          venue = {
            ...previousValue,
            name: command.name,
            address: command.address,
            notes: command.notes
          };
        } else {
          await transaction.archiveVenue({venueId: storedVenue.id, archivedAt: acceptedAt});
          venue = {...previousValue, archivedAt: acceptedAt.toISOString()};
        }
      }

      const result: VenueResult = {
        receiptReused: false,
        operation: command.type,
        venue,
        auditRecordId
      };
      await transaction.appendAuditRecord({
        id: auditRecordId,
        leagueId: venue.leagueId,
        actorAccountId: command.actorAccountId,
        action: `venue.${command.type === 'update' ? 'updated' : command.type === 'archive' ? 'archived' : 'created'}`,
        entityType: 'Venue',
        entityId: venue.id,
        previousValue: previousValue ? auditVenue(previousValue) : null,
        newValue: auditVenue(venue),
        reason: null,
        createdAt: acceptedAt
      });
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
