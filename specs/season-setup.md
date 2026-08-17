# Courtside Season Setup

- Status: accepted
- Spec version: 0.1.0
- Last updated: 2026-08-17

## Purpose

This specification defines authenticated League Administrator creation of a Season and the configuration installed at creation. It does not define Team creation, Season Team participation, frozen-configuration amendment, or playoff-bracket administration.

## Creation

Only an active League Administrator for the target League may create a Season. A Season name is whitespace-normalized, contains 2 through 120 characters, and is case-insensitively unique within its League. Creation locks the League, is idempotent by command identity and normalized content, and atomically creates the Season, one Audit Record, and one Command Receipt.

The browser supplies only command identity, League identity, Season name, and locale. The server derives the actor from a verified session and supplies the accepted configuration. Failed validation, missing authority, duplicate name, idempotency conflict, and infrastructure failure preserve authoritative state.

## Initial Configuration

The initial Season configuration installs the normative standings defaults: two League Points for a win, zero for a loss, ranking by League Points, point differential, points scored, then persisted random draw; eligible regular-season statuses are `final` and `forfeit`; standings adjustments are disabled; and a forfeit uses its explicit official score.

Season creation begins with no configured playoff Rounds. This means no playoff schedule exists; it does not select an illustrative one-game championship as a real League rule. A later playoff setup action must define the actual fixed Rounds and aggregate-points Matchup rules before playoff Games may be created. If result-affecting configuration has already frozen, adding or changing playoff configuration uses the accepted versioned, audited amendment lifecycle.

## Configuration Safety

The Season configuration remains mutable until the first accepted `final` or `forfeit` Game freezes it under `specs/lifecycle.md`. A normal post-freeze rule adjustment must create a new configuration version, identify the administrator and reason, append audit history, preserve prior versions, and deterministically recompute affected projections.

Direct database edits are not a supported administrator or developer mode. An exceptional operational repair may use a reviewed migration or recovery runbook, but it must preserve the same version, audit, reproducibility, and conflict-resolution invariants rather than overwriting frozen configuration in place.

## Deletion Boundary

Creation mistakes use the separately accepted `specs/season-deletion.md` workflow. Only a Season
without dependent domain records may be hard-deleted. Used Season retention and archival remain
separate from setup.

## Delivery

League Setup renders a bilingual Season creation form for each administered League. An administered League with no Seasons is shown as accessible and ready for setup. After creation, the setup route renders the Season and its Team, configuration, and eligible unused-Season deletion controls.
