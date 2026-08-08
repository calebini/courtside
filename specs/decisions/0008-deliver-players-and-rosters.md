# ADR 0008: Deliver Players and Rosters

- Status: accepted
- Spec version: 0.1.0
- Date: 2026-08-08

## Context

Courtside has durable Team and Season Team identity but no durable Player records or historical roster participation. Player statistics and member-managed profiles cannot be attributed safely until roster eligibility exists independently of authentication and mutable current-team fields.

## Decision

Add League-owned Players and half-open, time-effective Roster Membership intervals. Deliver idempotent League Administrator commands for Player creation and display-name replacement plus membership addition, ending, and atomic same-Season transfer. Enforce same-League ownership and non-overlapping Player intervals in PostgreSQL as well as in the service boundary. Preserve every accepted change in append-only Audit Records.

Expose the workflow only through the authenticated localized League Admin roster route. Continue to defer User Account-to-Player linking, member self-service, profile photos, public Player visibility, Team Captain mutation authority, and Player Stat Lines.

## Consequences

Courtside gains an authoritative eligibility history suitable for later Player Stat Line attribution. Transfers do not rewrite prior participation, and two concurrent commands cannot create conflicting memberships. The next natural slice is approved Player Management Relationships and private profile management, including member-controlled profile photos, after its privacy and upload policy is accepted.
