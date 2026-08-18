# Courtside Administrator Information Architecture

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-16

## Purpose

This specification defines how authenticated League administration is organized around recurring work rather than implementation order. It changes delivery structure only. Existing domain authority, lifecycle, audit, transaction, and persistence rules remain authoritative.

## Navigation and Scope

The authenticated administrator shell exposes stable destinations for League Desk, Games, People and rosters, Player-access requests, and League Setup. Navigation is bilingual, keyboard-operable, usable on narrow screens, and does not imply authority beyond the server-verified active League Administrator assignment.

League Desk, Games, and League Setup share an explicit active-Season context. A requested Season is accepted only when it appears in the authenticated administrator read model; an unknown or unauthorized identity falls back to the newest loaded authorized Season. Navigation between those destinations preserves the selected Season. If multiple Seasons are available, the administrator can switch context explicitly.

## League Desk

League Desk is an operational overview and does not contain full setup or mutation directories. Its ordering is based on existing authoritative state, without an inferred urgency score:

1. in-progress Games awaiting an outcome;
2. postponed Games awaiting scheduling resolution;
3. pending Player-access requests;
4. upcoming scheduled Games;
5. recent authoritative results; and
6. a compact standings snapshot.

The Desk exposes direct links to the corresponding complete workflows. It shows only a bounded recent-result and upcoming-Game preview rather than an unbounded history. Public schedule and standings remain separate read-only surfaces.

## Games

Games owns the recurring competition workflow: scheduling, starting, postponing, rescheduling, cancelling, forfeiting, finalizing, correcting authoritative results, entering and verifying Player points, viewing standings, and inspecting completed history. Player points remain subordinate to a completed Game disclosure rather than creating another top-level destination. State requiring attention appears before ordinary upcoming work. Existing server actions, application services, and audit behavior remain unchanged.

## People

People and rosters owns durable Player identity and Season roster operations. Player-access requests remain a distinct queue because batch review is an attention-bearing authorization workflow. Both destinations remain visible from the shared administrator navigation and League Desk attention summary.

## League Setup

League Setup owns infrequent configuration:

- League-owned Venues;
- creation of another Season;
- active-Season standings configuration; and
- active-Season Team participation.
- League Administrator and active-Season Team Captain assignments.

The setup page shows a derived readiness checklist for Season existence, minimum Team participation, optional reusable Venue availability, and first scheduled Game. The checklist does not create new lifecycle state and is not an authoritative completion record. Frozen Season configuration remains read-only under the accepted configuration lifecycle.

## Delivery Boundary

The initial reorganization reuses existing authenticated PostgreSQL read models and write services. It adds no database schema and no alternate mutation path. Route-specific query optimization, pagination, calendar presentation, and a combined People landing page may follow when data volume or observed use justifies them.
