# Decision Register

- mode: `end_of_cycle`
- terminal_state: `TARGET_NOT_REACHED`
- decision_status_counts: `deferred_scope_decision`=42, `operator_review_recommended`=106
- unresolved_human_decision_count: `148`

## dec_301afd202ce14c37

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Courtside Core Domain — Isolated Phase 1.03 Composite

Should `Courtside Core Domain — Isolated Phase 1.03 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.03 Composite

Evidence:
- # Courtside Core Domain — Isolated Phase 1.03 Composite

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_b43483a0db72b5f3

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`, `scope_change`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: General Lifecycle Failure Rule

Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): Authorization failures are rejected under the same preserve-state reporting semantics. The rejection report must identify the actor, affected League, Season, Season Team, Player, or Game scope when applicable, attempted mutation, missing or insufficient authority, violated authority rule, and confirmation that authoritative state and derived projections remain unchanged.

Evidence:
- Authorization failures are rejected under the same preserve-state reporting semantics. The rejection report must identify the actor, affected League, Season, Season Team, Player, or Game scope when applicable, attempted mutation, missing or insufficient authority, violated authority rule, and confirmation that authoritative state and derived projections remain unchanged.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_f7d82017388c166c

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`, `choose_policy`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Season Configuration Lifecycle

Should `Season Configuration Lifecycle` adopt this change (tighten requirement, choose policy): 3. The freeze operation is idempotent per Season. Later or retried authoritative Game transitions for that Season must reference the existing frozen version rather than creating another first version.

Evidence:
- 3. The freeze operation is idempotent per Season. Later or retried authoritative Game transitions for that Season must reference the existing frozen version rather than creating another first version.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_08d324d71c332ba0

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`, `choose_policy`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Season Configuration Lifecycle

Should `Season Configuration Lifecycle` adopt this change (tighten requirement, choose policy): 4. If concurrent first-freeze attempts occur, exactly one snapshot creation is accepted. A competing attempt must reuse the created snapshot when it depends on the same result-affecting configuration basis, or be rejected without mutating authoritative state when it depends on a different mutable configuration basis.

Evidence:
- 4. If concurrent first-freeze attempts occur, exactly one snapshot creation is accepted. A competing attempt must reuse the created snapshot when it depends on the same result-affecting configuration basis, or be rejected without mutating authoritative state when it depends on a different mutable configuration basis.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_57aa1f55221f8a3d

- type: `relax_requirement`
- status: `operator_review_recommended`
- triggers: `relax_requirement`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Season Configuration Lifecycle

Should `Season Configuration Lifecycle` adopt this change (relax requirement): 6. A League Administrator may amend frozen configuration only by creating a new version and an Audit Record.

Evidence:
- 6. A League Administrator may amend frozen configuration only by creating a new version and an Audit Record.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_5bc5102579e48f8f

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Season Configuration Lifecycle

Should `Season Configuration Lifecycle` adopt this change (choose policy): After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same action can apply the amendment through the playoff conflict-resolution semantics already required for authoritative result corrections. An amendment action that would change participant slots, Matchup completion, aggregate outcome, or downstream advancement without either preserving the existing authoritative path as an audited administrative exception or halting affected downstream advancement until replacement authoritative outcomes are recorded is rejected without mutating authoritative state.

Evidence:
- After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same action can apply the amendment through the playoff conflict-resolution semantics already required for authoritative result corrections. An amendment action that would change participant slots, Matchup completion, aggregate outcome, or downstream advancement without either preserving the existing authoritative path as an audited administrative exception or halting affected downstream advancement until replacement authoritative outcomes are recorded is rejected without mutating authoritative state.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_5c2a62f2fd7c92bc

- type: `tighten_requirement`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Scheduling Transitions

Should `Scheduling Transitions` adopt this change (tighten requirement): Every scheduled instant is interpreted in the League's configured IANA timezone and stored as an unambiguous instant. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history, but it must be available to explain rescheduling, postponement, cancellation, and start transitions.

Evidence:
- Every scheduled instant is interpreted in the League's configured IANA timezone and stored as an unambiguous instant. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history, but it must be available to explain rescheduling, postponement, cancellation, and start transitions.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_d12db48235ffc659

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`, `scope_change`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings Lifecycle

Should `Standings Lifecycle` adopt this change (tighten requirement, choose policy, scope change): A random-draw tie context has a stable identity composed of the Season, the frozen Season configuration version, the ranking step or criterion that invoked `random_draw`, the tied Season Teams in canonical identity order before the draw, and the equal preceding criterion values that made the tie unresolved. Canonical identity order is the ascending byte order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created. A canonical domain identity used for this ordering must be an ASCII-only opaque identifier, is case-sensitive, and is compared byte-for-byte without locale collation, Unicode normalization, or display-name transformation. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result for the same tie context is rejected as a deterministic conflict without performing another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

Evidence:
- A random-draw tie context has a stable identity composed of the Season, the frozen Season configuration version, the ranking step or criterion that invoked `random_draw`, the tied Season Teams in canonical identity order before the draw, and the equal preceding criterion values that made the tie unresolved. Canonical identity order is the ascending byte order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created. A canonical domain identity used for this ordering must be an ASCII-only opaque identifier, is case-sensitive, and is compared byte-for-byte without locale collation, Unicode normalization, or display-name transformation. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result for the same tie context is rejected as a deterministic conflict without performing another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_0d2360f616cc1584

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (tighten requirement, choose policy): 7. Unauthorized mutation attempts and lifecycle transitions not explicitly permitted by the lifecycle specification are rejected without mutating authoritative state and must produce the required rejection report.

Evidence:
- 7. Unauthorized mutation attempts and lifecycle transitions not explicitly permitted by the lifecycle specification are rejected without mutating authoritative state and must produce the required rejection report.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_ce15ed7a376afce9

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Configuration and Reproducibility

Should `Configuration and Reproducibility` adopt this change (choose policy): 1. The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes for the same Season reuse that frozen version.

Evidence:
- 1. The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes for the same Season reuse that frozen version.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_b570408d2fccb971

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`, `choose_policy`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Configuration and Reproducibility

Should `Configuration and Reproducibility` adopt this change (tighten requirement, choose policy): 3. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution.

Evidence:
- 3. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_a6bce6501c4fe7b3

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Configuration and Reproducibility

Should `Configuration and Reproducibility` adopt this change (choose policy): 5. Given the same authoritative outcomes, adjustment records, persisted random draws, and configuration version, standings and playoff advancement are deterministic.

Evidence:
- 5. Given the same authoritative outcomes, adjustment records, persisted random draws, and configuration version, standings and playoff advancement are deterministic.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_74614ad29be05e35

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authority and Precedence

Should `Authority and Precedence` adopt this change (choose policy): More specific values override less specific values only where this specification permits customization. The first accepted authoritative Season Game outcome freezes all result-affecting values into a single versioned Season snapshot. Later, retried, or concurrent authoritative outcome transitions for that Season reuse the existing snapshot or are rejected under the lifecycle freeze rule when they depend on a different mutable configuration basis.

Evidence:
- More specific values override less specific values only where this specification permits customization. The first accepted authoritative Season Game outcome freezes all result-affecting values into a single versioned Season snapshot. Later, retried, or concurrent authoritative outcome transitions for that Season reuse the existing snapshot or are rejected under the lifecycle freeze rule when they depend on a different mutable configuration basis.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_233fe79790aea2a8

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`, `scope_change`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings Configuration

Should `Standings Configuration` adopt this change (tighten requirement, choose policy, scope change): The stable tie-context identity is composed of the Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and the equal preceding criterion values. Canonical identity order is the ascending byte order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created. A canonical domain identity used for this ordering must be an ASCII-only opaque identifier, is case-sensitive, and is compared byte-for-byte without locale collation, Unicode normalization, or display-name transformation. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context return the existing result. Attempting to create a second result for the same tie context is rejected as a deterministic conflict and must not perform another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

Evidence:
- The stable tie-context identity is composed of the Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and the equal preceding criterion values. Canonical identity order is the ascending byte order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created. A canonical domain identity used for this ordering must be an ASCII-only opaque identifier, is case-sensitive, and is compared byte-for-byte without locale collation, Unicode normalization, or display-name transformation. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context return the existing result. Attempting to create a second result for the same tie context is rejected as a deterministic conflict and must not perform another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_b7ed569df9de0b5a

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Playoff Configuration

Should `Playoff Configuration` adopt this change (choose policy): Round structure and policies become part of the frozen result-affecting Season configuration. After dependent authoritative playoff Games exist, amendments to Round structure, configured Games per Matchup, slot sources, advancement rule, or aggregate-tiebreak policy are subject to the frozen configuration amendment legality rule in `lifecycle.md`.

Evidence:
- Round structure and policies become part of the frozen result-affecting Season configuration. After dependent authoritative playoff Games exist, amendments to Round structure, configured Games per Matchup, slot sources, advancement rule, or aggregate-tiebreak policy are subject to the frozen configuration amendment legality rule in `lifecycle.md`.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_1289e4edc3fe5f82

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Courtside Core Domain — Isolated Phase 1.04 Composite

Should `Courtside Core Domain — Isolated Phase 1.04 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.04 Composite

Evidence:
- # Courtside Core Domain — Isolated Phase 1.04 Composite

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_b7a3417059b45745

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Role Assignment

Should `Role Assignment` adopt this change (choose policy): after the initial League Administrator bootstrap boundary for a League, an existing League Administrator assigns, reassigns, and revokes League Administrator assignments for that League;

Evidence:
- - after the initial League Administrator bootstrap boundary for a League, an existing League Administrator assigns, reassigns, and revokes League Administrator assignments for that League;

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_61623aefa2b99397

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Role Assignment

Should `Role Assignment` adopt this change (choose policy, scope change): the initial League Administrator bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority; and

Evidence:
- - the initial League Administrator bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority; and

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_7f0493aed90b8c71

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (relax requirement, scope change): League Administrators may create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke League Administrator and Team Captain role assignments; amend frozen Season configuration; and resolve playoff correction conflicts.

Evidence:
- - League Administrators may create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke League Administrator and Team Captain role assignments; amend frozen Season configuration; and resolve playoff correction conflicts.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_834c1d37698f3552

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (choose policy, scope change): Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League. The initial League Administrator bootstrap boundary for a League is outside Phase 1 domain mutation semantics and does not create a general unauthenticated role-assignment path.

Evidence:
- - Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League. The initial League Administrator bootstrap boundary for a League is outside Phase 1 domain mutation semantics and does not create a general unauthenticated role-assignment path.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_54afa060aa790ad0

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`, `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Season Configuration Lifecycle

Should `Season Configuration Lifecycle` adopt this change (tighten requirement, choose policy, scope change): For first-freeze duplicate detection, the result-affecting configuration basis is the canonical content identity of the exact result-affecting values that would be captured in the frozen Season configuration version. It includes standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes League timezone, localization, Venue, Media, display text, and other values that this specification says do not affect standings or playoff outcomes. The canonical basis identity is derived from normalized domain values, not from serialization format, storage order, display labels, or implementation-specific identifiers except stable canonical domain identities where the specification requires them. Collections use their configured order when order is result-affecting and canonical identity order otherwise. Equal canonical basis identities mean the attempted freeze depends on the same result-affecting value set and must reuse the existing frozen version. Unequal canonical basis identities mean the attempted freeze depends on a different mutable configuration basis and must be rejected without mutating authoritative state, persisted projections, or configuration versions.

Evidence:
- For first-freeze duplicate detection, the result-affecting configuration basis is the canonical content identity of the exact result-affecting values that would be captured in the frozen Season configuration version. It includes standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes League timezone, localization, Venue, Media, display text, and other values that this specification says do not affect standings or playoff outcomes. The canonical basis identity is derived from normalized domain values, not from serialization format, storage order, display labels, or implementation-specific identifiers except stable canonical domain identities where the specification requires them. Collections use their configured order when order is result-affecting and canonical identity order otherwise. Equal canonical basis identities mean the attempted freeze depends on the same result-affecting value set and must reuse the existing frozen version. Unequal canonical basis identities mean the attempted freeze depends on a different mutable configuration basis and must be rejected without mutating authoritative state, persisted projections, or configuration versions.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_df864f80e7c88266

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Role Assignment Lifecycle

Should `Role Assignment Lifecycle` adopt this change (choose policy): After the initial League Administrator bootstrap boundary for a League, League Administrators assign, reassign, and revoke League Administrator assignments for that League.

Evidence:
- - After the initial League Administrator bootstrap boundary for a League, League Administrators assign, reassign, and revoke League Administrator assignments for that League.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_493d6f1cb3f0d122

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Role Assignment Lifecycle

Should `Role Assignment Lifecycle` adopt this change (choose policy, scope change): The initial League Administrator bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority.

Evidence:
- - The initial League Administrator bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_81bd72cf13dc8659

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (choose policy, scope change): 2. Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League after the initial League Administrator bootstrap boundary, which is outside Phase 1 domain mutation semantics.

Evidence:
- 2. Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League after the initial League Administrator bootstrap boundary, which is outside Phase 1 domain mutation semantics.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_51ee2970000a365c

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (choose policy): 3. Team Captain authority is scoped to exactly one Season Team.

Evidence:
- 3. Team Captain authority is scoped to exactly one Season Team.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_2100b8f8b24c5dfd

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (relax requirement, choose policy): 4. Only a League Administrator may approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, assign, reassign, or revoke League Administrator authority after bootstrap, assign, reassign, or revoke Team Captain authority, mutate Game lifecycle status, create or change Roster Memberships, create or materially change Player Stat Lines, or resolve playoff correction conflicts.

Evidence:
- 4. Only a League Administrator may approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, assign, reassign, or revoke League Administrator authority after bootstrap, assign, reassign, or revoke Team Captain authority, mutate Game lifecycle status, create or change Roster Memberships, create or materially change Player Stat Lines, or resolve playoff correction conflicts.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_7974eebca254b065

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (choose policy, scope change): 5. An approved Player Management Relationship grants Player-profile management authority only; it does not grant authority over rosters, Game outcomes, standings, playoff advancement, Season configuration, or role assignment.

Evidence:
- 5. An approved Player Management Relationship grants Player-profile management authority only; it does not grant authority over rosters, Game outcomes, standings, playoff advancement, Season configuration, or role assignment.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_216b43e10fb3bf52

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (choose policy, scope change): 6. Team Captain authority is an auditable scoped role marker in Phase 1 and grants no independent core mutation authority until a later accepted specification defines such permissions.

Evidence:
- 6. Team Captain authority is an auditable scoped role marker in Phase 1 and grants no independent core mutation authority until a later accepted specification defines such permissions.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_72579a9b35b52a5b

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (scope change): 7. Role and management-relationship changes are audited.

Evidence:
- 7. Role and management-relationship changes are audited.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_59f23e80802e9100

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (tighten requirement, choose policy): 8. Unauthorized mutation attempts and lifecycle transitions not explicitly permitted by the lifecycle specification are rejected without mutating authoritative state and must produce the required rejection report.

Evidence:
- 8. Unauthorized mutation attempts and lifecycle transitions not explicitly permitted by the lifecycle specification are rejected without mutating authoritative state and must produce the required rejection report.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_6a08adb38bd15f72

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Configuration and Reproducibility

Should `Configuration and Reproducibility` adopt this change (choose policy): 2. Concurrent or retried first-freeze attempts compare the canonical result-affecting configuration basis identity; equal identities reuse the existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions.

Evidence:
- 2. Concurrent or retried first-freeze attempts compare the canonical result-affecting configuration basis identity; equal identities reuse the existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_38d7db1a1edb11db

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Configuration and Reproducibility

Should `Configuration and Reproducibility` adopt this change (choose policy): 3. Later amendments require League Administrator authority and an Audit Record.

Evidence:
- 3. Later amendments require League Administrator authority and an Audit Record.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_050796bb6761ba78

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`, `choose_policy`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Configuration and Reproducibility

Should `Configuration and Reproducibility` adopt this change (tighten requirement, choose policy): 4. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution.

Evidence:
- 4. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_95261629f7294b5b

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Configuration and Reproducibility

Should `Configuration and Reproducibility` adopt this change (choose policy): 6. Given the same authoritative outcomes, adjustment records, persisted random draws, and configuration version, standings and playoff advancement are deterministic.

Evidence:
- 6. Given the same authoritative outcomes, adjustment records, persisted random draws, and configuration version, standings and playoff advancement are deterministic.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_569730ddc780404e

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authority and Precedence

Should `Authority and Precedence` adopt this change (choose policy, scope change): The result-affecting configuration basis identity used for concurrent or retried first-freeze comparison is the canonical content identity of the values that would be captured in the frozen Season configuration version. It covers standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes timezone, localization, Venue, Media, display text, and other non-result-affecting values. Equal basis identities reuse the existing frozen version. Unequal basis identities are rejected without mutating authoritative state, persisted projections, or configuration versions.

Evidence:
- The result-affecting configuration basis identity used for concurrent or retried first-freeze comparison is the canonical content identity of the values that would be captured in the frozen Season configuration version. It covers standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes timezone, localization, Venue, Media, display text, and other non-result-affecting values. Equal basis identities reuse the existing frozen version. Unequal basis identities are rejected without mutating authoritative state, persisted projections, or configuration versions.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_a9fc4e431b1e9aed

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `16`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization Configuration

Should `Authorization Configuration` adopt this change (choose policy, scope change): After the initial League Administrator bootstrap boundary for a League, existing League Administrators assign, reassign, and revoke League Administrator authority for that League. The bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority. League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, and playoff correction conflict resolution. Persisted random-draw duplicate or conflict attempts are handled only by deterministic reuse or rejection under the stable tie-context rule; League Administrators do not replace or override an existing draw result in Phase 1. Team Captain authority is a scoped role marker in Phase 1 and does not add independent mutation permissions unless a later accepted specification defines them. Adding roles or changing their authority requires an accepted specification update.

Evidence:
- After the initial League Administrator bootstrap boundary for a League, existing League Administrators assign, reassign, and revoke League Administrator authority for that League. The bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority. League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, and playoff correction conflict resolution. Persisted random-draw duplicate or conflict attempts are handled only by deterministic reuse or rejection under the stable tie-context rule; League Administrators do not replace or override an existing draw result in Phase 1. Team Captain authority is a scoped role marker in Phase 1 and does not add independent mutation permissions unless a later accepted specification defines them. Adding roles or changing their authority requires an accepted specification update.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_57ae79b979531725

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `20`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Courtside Core Domain — Isolated Phase 1.05 Composite

Should `Courtside Core Domain — Isolated Phase 1.05 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.05 Composite

Evidence:
- # Courtside Core Domain — Isolated Phase 1.05 Composite

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_1192d9a364be600d

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `20`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Roster Membership Lifecycle

Should `Roster Membership Lifecycle` adopt this change (relax requirement, choose policy): A Game evaluates roster eligibility at its competition eligibility anchor. For a Game that enters `in_progress`, the anchor is the first accepted start instant for that Game. For a Game that becomes `forfeit` from `scheduled` or `postponed` without entering `in_progress`, the anchor is the official forfeit decision instant recorded with the forfeiture. A cancelled Game has no competition eligibility anchor for Player Stat Line attribution. Rescheduling or postponement before the anchor may change when the Game is expected to occur, but it does not create Player Stat Line eligibility until the anchor is established. Finalization and later authoritative result corrections do not change the anchor or rewrite existing Player Stat Line attribution. A Player Stat Line is valid only when its referenced Roster Membership was effective for one of the Game's participating Season Teams at the competition eligibility anchor.

Evidence:
- A Game evaluates roster eligibility at its competition eligibility anchor. For a Game that enters `in_progress`, the anchor is the first accepted start instant for that Game. For a Game that becomes `forfeit` from `scheduled` or `postponed` without entering `in_progress`, the anchor is the official forfeit decision instant recorded with the forfeiture. A cancelled Game has no competition eligibility anchor for Player Stat Line attribution. Rescheduling or postponement before the anchor may change when the Game is expected to occur, but it does not create Player Stat Line eligibility until the anchor is established. Finalization and later authoritative result corrections do not change the anchor or rewrite existing Player Stat Line attribution. A Player Stat Line is valid only when its referenced Roster Membership was effective for one of the Game's participating Season Teams at the competition eligibility anchor.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_cddefa59eaccf28d

- type: `relax_requirement`
- status: `operator_review_recommended`
- triggers: `relax_requirement`
- round: `20`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Competition Transitions

Should `Competition Transitions` adopt this change (relax requirement): A Game may become `forfeit` only from `scheduled`, `postponed`, or `in_progress`, and only with an explicit winning team and an official non-tied score. That official score is the source for standings and aggregate calculations.

Evidence:
- - A Game may become `forfeit` only from `scheduled`, `postponed`, or `in_progress`, and only with an explicit winning team and an official non-tied score. That official score is the source for standings and aggregate calculations.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_9436dc1608134290

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `20`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): When the chosen resolution halts affected downstream advancement, the halted condition is observable in the current playoff projection and resolution report rather than as a new Matchup lifecycle state. The projection must mark each affected participant slot or dependent Matchup as halted by the accepted correction resolution, identify the corrected participant source that must be replayed, and exclude conflicted downstream authoritative Games from current advancement calculations for the corrected path while retaining those Games as historical authoritative records. A halted path resumes only when replacement authoritative outcomes exist for every affected configured downstream Game whose participant slots match the corrected bracket participants and fixed slot sources. Recomputations before that condition is satisfied must continue to report the same halted slots and must not advance through them.

Evidence:
- When the chosen resolution halts affected downstream advancement, the halted condition is observable in the current playoff projection and resolution report rather than as a new Matchup lifecycle state. The projection must mark each affected participant slot or dependent Matchup as halted by the accepted correction resolution, identify the corrected participant source that must be replayed, and exclude conflicted downstream authoritative Games from current advancement calculations for the corrected path while retaining those Games as historical authoritative records. A halted path resumes only when replacement authoritative outcomes exist for every affected configured downstream Game whose participant slots match the corrected bracket participants and fixed slot sources. Recomputations before that condition is satisfied must continue to report the same halted slots and must not advance through them.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_a76f9b5b75bc904a

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`, `choose_policy`
- round: `20`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted correction resolution is composed of the corrected Game, the corrected authoritative value, the affected participant slots, the downstream authoritative Games that create the conflict, and the chosen resolution type. Retries, replays, or concurrent recomputations for the same resolution identity must return the same projection effect and resolution report. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

Evidence:
- The deterministic identity of an accepted correction resolution is composed of the corrected Game, the corrected authoritative value, the affected participant slots, the downstream authoritative Games that create the conflict, and the chosen resolution type. Retries, replays, or concurrent recomputations for the same resolution identity must return the same projection effect and resolution report. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_3fe36ccbd7d86bf0

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `20`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Games and Results

Should `Games and Results` adopt this change (choose policy): 12. An accepted halted playoff correction resolution makes affected slots or Matchups halted in the current projection, excludes conflicted downstream authoritative Games from current corrected-path advancement calculations while preserving them historically, and resumes only when replacement authoritative outcomes exist under the corrected bracket participants.

Evidence:
- 12. An accepted halted playoff correction resolution makes affected slots or Matchups halted in the current projection, excludes conflicted downstream authoritative Games from current corrected-path advancement calculations while preserving them historically, and resumes only when replacement authoritative outcomes exist under the corrected bracket participants.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_1d890fe73d53f25f

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `20`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Playoffs

Should `Playoffs` adopt this change (choose policy): 11. Accepted correction resolutions that halt advancement are deterministic by their resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy the resume condition.

Evidence:
- 11. Accepted correction resolutions that halt advancement are deterministic by their resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy the resume condition.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_b01a5bdacdba2fe8

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `20`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Configuration and Reproducibility

Should `Configuration and Reproducibility` adopt this change (choose policy): 6. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic.

Evidence:
- 6. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_b4a9722339a0e68d

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `20`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Audit Configuration

Should `Audit Configuration` adopt this change (tighten requirement, choose policy): An Audit Record for a playoff correction conflict resolution must include the resolution type, affected participant slots, conflicted downstream authoritative Games, resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff.

Evidence:
- An Audit Record for a playoff correction conflict resolution must include the resolution type, affected participant slots, conflicted downstream authoritative Games, resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_7702e5cdcee83f8a

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `24`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Courtside Core Domain — Isolated Phase 1.06 Composite

Should `Courtside Core Domain — Isolated Phase 1.06 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.06 Composite

Evidence:
- # Courtside Core Domain — Isolated Phase 1.06 Composite

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_516b588d462bd569

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `24`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted correction resolution is composed of the corrected Game, the corrected authoritative value, the affected participant slots, the downstream authoritative Games that create the conflict, and the chosen resolution type. Affected participant slots are canonicalized by their fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within the fixed bracket order. Identity equality is based on that canonicalized content, not on traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, or concurrent recomputations for the same resolution identity must return the same projection effect and resolution report. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

Evidence:
- The deterministic identity of an accepted correction resolution is composed of the corrected Game, the corrected authoritative value, the affected participant slots, the downstream authoritative Games that create the conflict, and the chosen resolution type. Affected participant slots are canonicalized by their fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within the fixed bracket order. Identity equality is based on that canonicalized content, not on traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, or concurrent recomputations for the same resolution identity must return the same projection effect and resolution report. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_1ed80b2032539eb6

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `24`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Playoffs

Should `Playoffs` adopt this change (choose policy): 11. Accepted correction resolutions that halt advancement are deterministic by their canonicalized resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy the resume condition.

Evidence:
- 11. Accepted correction resolutions that halt advancement are deterministic by their canonicalized resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy the resume condition.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_8f64646be1cd8e18

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `24`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Audit Configuration

Should `Audit Configuration` adopt this change (tighten requirement, choose policy): An Audit Record for a playoff correction conflict resolution must include the resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff.

Evidence:
- An Audit Record for a playoff correction conflict resolution must include the resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_d201dd7c6ac97aa9

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Courtside Core Domain — Isolated Phase 1.07 Composite

Should `Courtside Core Domain — Isolated Phase 1.07 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.07 Composite

Evidence:
- # Courtside Core Domain — Isolated Phase 1.07 Composite

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_6a92420f5c855dd5

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Scope

Should `Scope` adopt this change (choose policy): Courtside covers persistent league, team, player, and user-account identity; season-specific team participation, rosters, schedules, results, standings, and playoffs; provisional, partial, confirmed, and corrected player game statistics; configurable score-based standings and round-specific playoff series; league-scoped administration and season-team captain authority; simple venues and reusable media associations; English and French user-interface and authored-content localization; and simple audit records for material administrative changes.

Evidence:
- Courtside covers persistent league, team, player, and user-account identity; season-specific team participation, rosters, schedules, results, standings, and playoffs; provisional, partial, confirmed, and corrected player game statistics; configurable score-based standings and round-specific playoff series; league-scoped administration and season-team captain authority; simple venues and reusable media associations; English and French user-interface and authored-content localization; and simple audit records for material administrative changes.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_233f440fa0402886

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Canonical Concepts

Should `Canonical Concepts` adopt this change (choose policy, scope change): A League is the persistent organization that owns seasons, league defaults, supported languages, the league timezone, administrator assignments, venues, and the league gallery. Courtside currently assumes one organizational league boundary; cross-league identity and competition are out of scope.

Evidence:
- A League is the persistent organization that owns seasons, league defaults, supported languages, the league timezone, administrator assignments, venues, and the league gallery. Courtside currently assumes one organizational league boundary; cross-league identity and competition are out of scope.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_c7a57eab7a1e7a4a

- type: `relax_requirement`
- status: `operator_review_recommended`
- triggers: `relax_requirement`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Canonical Concepts

Should `Canonical Concepts` adopt this change (relax requirement): A Season Team is one Team participating in one Season. It owns that Season roster memberships, Season-specific captain assignments, schedule participation, and derived Season performance. At most one Season Team may connect the same Team and Season.

Evidence:
- A Season Team is one Team participating in one Season. It owns that Season roster memberships, Season-specific captain assignments, schedule participation, and derived Season performance. At most one Season Team may connect the same Team and Season.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_73a9a1b358d1a43f

- type: `relax_requirement`
- status: `operator_review_recommended`
- triggers: `relax_requirement`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Canonical Concepts

Should `Canonical Concepts` adopt this change (relax requirement): A Roster Membership is a Player membership in one Season Team over an effective period. Transfers close the prior membership and open a new one without rewriting historical Games or Player Stat Lines. A Player may not have overlapping active memberships in more than one Season Team in the same Season.

Evidence:
- A Roster Membership is a Player membership in one Season Team over an effective period. Transfers close the prior membership and open a new one without rewriting historical Games or Player Stat Lines. A Player may not have overlapping active memberships in more than one Season Team in the same Season.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_c23fa46dd589ad5f

- type: `relax_requirement`
- status: `operator_review_recommended`
- triggers: `relax_requirement`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Canonical Concepts

Should `Canonical Concepts` adopt this change (relax requirement): A User Account is a login identity and is never the same domain entity as a Player. Accounts may exist without Players, Players may exist without accounts, one account may manage multiple Players, and multiple accounts may manage one Player through separately approved relationships.

Evidence:
- A User Account is a login identity and is never the same domain entity as a Player. Accounts may exist without Players, Players may exist without accounts, one account may manage multiple Players, and multiple accounts may manage one Player through separately approved relationships.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_7caaab7d32d5f362

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Canonical Concepts

Should `Canonical Concepts` adopt this change (choose policy, scope change): Authorization is expressed through scoped assignments. League Administrator assignments apply to one League and persist across Seasons until revoked. After the initial League Administrator bootstrap boundary for a League, an existing League Administrator assigns, reassigns, and revokes League Administrator assignments for that League. The bootstrap boundary is outside Phase 1 domain mutation semantics. Team Captain assignments apply to exactly one Season Team and are assigned, reassigned, or revoked by a League Administrator. In Phase 1, Team Captain is a scoped domain authority marker and does not independently grant authority over Game outcomes, rosters, Player Stat Lines, Player Management approvals, Season configuration amendments, or playoff conflict resolution unless a later accepted specification grants that authority.

Evidence:
- Authorization is expressed through scoped assignments. League Administrator assignments apply to one League and persist across Seasons until revoked. After the initial League Administrator bootstrap boundary for a League, an existing League Administrator assigns, reassigns, and revokes League Administrator assignments for that League. The bootstrap boundary is outside Phase 1 domain mutation semantics. Team Captain assignments apply to exactly one Season Team and are assigned, reassigned, or revoked by a League Administrator. In Phase 1, Team Captain is a scoped domain authority marker and does not independently grant authority over Game outcomes, rosters, Player Stat Lines, Player Management approvals, Season configuration amendments, or playoff conflict resolution unless a later accepted specification grants that authority.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_e4cc29e2eea3d908

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Canonical Concepts

Should `Canonical Concepts` adopt this change (choose policy, scope change): A Game is a scheduled basketball match between two distinct Season Teams in the same Season. It records schedule, venue, competition phase, lifecycle status, authoritative score when available, optional Player Stat Lines, and optional Media associations. Regular-season and playoff Games share the same Game concept.

Evidence:
- A Game is a scheduled basketball match between two distinct Season Teams in the same Season. It records schedule, venue, competition phase, lifecycle status, authoritative score when available, optional Player Stat Lines, and optional Media associations. Regular-season and playoff Games share the same Game concept.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_ee02027686c6dbb2

- type: `relax_requirement`
- status: `operator_review_recommended`
- triggers: `relax_requirement`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Canonical Concepts

Should `Canonical Concepts` adopt this change (relax requirement): A Player Stat Line is a Player statistical performance in a Game, attributed through the Roster Membership that made the Player eligible for one participating Season Team. Every statistical value distinguishes unknown from known zero. A line may be partial and has an independent verification status of provisional or confirmed.

Evidence:
- A Player Stat Line is a Player statistical performance in a Game, attributed through the Roster Membership that made the Player eligible for one participating Season Team. Every statistical value distinguishes unknown from known zero. A line may be partial and has an independent verification status of provisional or confirmed.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_21c8f8ee70400aae

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Canonical Concepts

Should `Canonical Concepts` adopt this change (choose policy): Team Statistics are derived Season-Team performance calculated from authoritative Game results and, where explicitly needed, aggregated Player Stat Lines. The authoritative Game score remains the source for points for, points against, and result-based standings calculations.

Evidence:
- Team Statistics are derived Season-Team performance calculated from authoritative Game results and, where explicitly needed, aggregated Player Stat Lines. The authoritative Game score remains the source for points for, points against, and result-based standings calculations.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_993e865475feb19f

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Canonical Concepts

Should `Canonical Concepts` adopt this change (choose policy): Standings are derived rankings of Season Teams under the Season frozen standings configuration. They are never directly edited and are recomputed from eligible authoritative Game outcomes plus explicit, audited adjustment records if configuration permits adjustments.

Evidence:
- Standings are derived rankings of Season Teams under the Season frozen standings configuration. They are never directly edited and are recomputed from eligible authoritative Game outcomes plus explicit, audited adjustment records if configuration permits adjustments.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_7d7f27eaf1ca4872

- type: `relax_requirement`
- status: `operator_review_recommended`
- triggers: `relax_requirement`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Canonical Concepts

Should `Canonical Concepts` adopt this change (relax requirement): A Venue is a reusable League-owned location with a name, address, and optional notes. A Game may reference one Venue and may add Game-specific court or arrival instructions.

Evidence:
- A Venue is a reusable League-owned location with a name, address, and optional notes. A Game may reference one Venue and may add Game-specific court or arrival instructions.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_1b1190d519c43c31

- type: `relax_requirement`
- status: `operator_review_recommended`
- triggers: `relax_requirement`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Canonical Concepts

Should `Canonical Concepts` adopt this change (relax requirement): Media are optional photo records or YouTube links. The same Media item may be associated with Games, the League Gallery, or both. Association is independent of Media identity.

Evidence:
- Media are optional photo records or YouTube links. The same Media item may be associated with Games, the League Gallery, or both. Association is independent of Media identity.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_1d333a5e351e0251

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Derived Data Authority

Should `Derived Data Authority` adopt this change (tighten requirement, choose policy): Authoritative Game outcomes produce regular-season standings, Season-Team result statistics, playoff aggregate scores, and playoff advancement. Player Stat Lines produce Player game logs and optional detailed Team Statistics. Player-stat availability or completeness must never block an authoritative Game result, standings recomputation, or playoff advancement.

Evidence:
- Authoritative Game outcomes produce regular-season standings, Season-Team result statistics, playoff aggregate scores, and playoff advancement. Player Stat Lines produce Player game logs and optional detailed Team Statistics. Player-stat availability or completeness must never block an authoritative Game result, standings recomputation, or playoff advancement.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_016bff0074ce8689

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: General Lifecycle Failure Rule

Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, current state or condition, requested state or mutation, actor, and violated lifecycle rule. In-scope invariant, configuration validation, and authorization failures follow the same preserve-state rule and must identify the affected scope, attempted mutation, violated rule, and confirmation that authoritative records, persisted projections, and configuration versions remain unchanged. Auditing rejected attempts is not required unless the audit policy for that surface explicitly requires it.

Evidence:
- For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, current state or condition, requested state or mutation, actor, and violated lifecycle rule. In-scope invariant, configuration validation, and authorization failures follow the same preserve-state rule and must identify the affected scope, attempted mutation, violated rule, and confirmation that authoritative records, persisted projections, and configuration versions remain unchanged. Auditing rejected attempts is not required unless the audit policy for that surface explicitly requires it.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_31e785e1443daa6b

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (relax requirement, choose policy, scope change): Mutation authority is evaluated at request time and scoped to the affected League, Season, Season Team, Player, or Game. League Administrators may create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke League Administrator and Team Captain role assignments; amend frozen Season configuration; and resolve playoff correction conflicts. Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League after bootstrap. Approved Player Management Relationships grant Player-profile management authority only. Team Captain assignments are auditable scoped role markers and grant no independent core mutation authority in Phase 1. Derived standings, Season-Team result statistics, playoff aggregates, and playoff advancement are deterministic projections and are not directly edited by any actor.

Evidence:
- Mutation authority is evaluated at request time and scoped to the affected League, Season, Season Team, Player, or Game. League Administrators may create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke League Administrator and Team Captain role assignments; amend frozen Season configuration; and resolve playoff correction conflicts. Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League after bootstrap. Approved Player Management Relationships grant Player-profile management authority only. Team Captain assignments are auditable scoped role markers and grant no independent core mutation authority in Phase 1. Derived standings, Season-Team result statistics, playoff aggregates, and playoff advancement are deterministic projections and are not directly edited by any actor.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_0c282d54a399f7fa

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Season Configuration Lifecycle

Should `Season Configuration Lifecycle` adopt this change (relax requirement, choose policy): A Season begins with mutable configuration derived from League defaults and Season overrides. The first accepted transition of any Season Game to `final` or `forfeit` freezes a single versioned snapshot of all result-affecting Season configuration for that Season. The freeze operation is idempotent per Season; later or retried authoritative Game transitions reuse the existing frozen version rather than creating another first version. Concurrent first-freeze attempts accept exactly one snapshot. A competing attempt reuses the created snapshot when it depends on the same result-affecting configuration basis, or is rejected without mutation when it depends on a different mutable configuration basis. All standings and playoff calculations identify the frozen configuration version they use. A League Administrator may amend frozen configuration only by creating a new version and an Audit Record. Recalculation under an amended version is deterministic and applies to every affected derived projection, while historical versions remain available.

Evidence:
- A Season begins with mutable configuration derived from League defaults and Season overrides. The first accepted transition of any Season Game to `final` or `forfeit` freezes a single versioned snapshot of all result-affecting Season configuration for that Season. The freeze operation is idempotent per Season; later or retried authoritative Game transitions reuse the existing frozen version rather than creating another first version. Concurrent first-freeze attempts accept exactly one snapshot. A competing attempt reuses the created snapshot when it depends on the same result-affecting configuration basis, or is rejected without mutation when it depends on a different mutable configuration basis. All standings and playoff calculations identify the frozen configuration version they use. A League Administrator may amend frozen configuration only by creating a new version and an Audit Record. Recalculation under an amended version is deterministic and applies to every affected derived projection, while historical versions remain available.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_bf806ac6866e705d

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Season Configuration Lifecycle

Should `Season Configuration Lifecycle` adopt this change (choose policy, scope change): For first-freeze duplicate detection, the result-affecting configuration basis is the canonical content identity of exact result-affecting values captured in the frozen Season configuration version. It includes standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes League timezone, localization, Venue, Media, display text, and other values that do not affect standings or playoff outcomes. Equal canonical basis identities reuse the existing frozen version. Unequal canonical basis identities are rejected without mutating authoritative state, persisted projections, or configuration versions.

Evidence:
- For first-freeze duplicate detection, the result-affecting configuration basis is the canonical content identity of exact result-affecting values captured in the frozen Season configuration version. It includes standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes League timezone, localization, Venue, Media, display text, and other values that do not affect standings or playoff outcomes. Equal canonical basis identities reuse the existing frozen version. Unequal canonical basis identities are rejected without mutating authoritative state, persisted projections, or configuration versions.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_17ad71b967d04589

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Season Configuration Lifecycle

Should `Season Configuration Lifecycle` adopt this change (choose policy): After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same action can apply the amendment through the playoff conflict-resolution semantics required for authoritative result corrections.

Evidence:
- After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same action can apply the amendment through the playoff conflict-resolution semantics required for authoritative result corrections.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_3113aced1852e6de

- type: `tighten_requirement`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Roster Membership Lifecycle

Should `Roster Membership Lifecycle` adopt this change (tighten requirement): A Roster Membership has an effective start and may have an effective end. A Player becomes eligible for a Season Team when a membership becomes effective. A Player may not have overlapping effective memberships for different Season Teams in the same Season. A transfer ends the prior membership before the new membership begins. Ending or transferring a membership does not rewrite eligibility, attribution, or Player Stat Lines for Games played while the prior membership was effective. A Player Stat Line must reference the membership that established eligibility for that Game.

Evidence:
- A Roster Membership has an effective start and may have an effective end. A Player becomes eligible for a Season Team when a membership becomes effective. A Player may not have overlapping effective memberships for different Season Teams in the same Season. A transfer ends the prior membership before the new membership begins. Ending or transferring a membership does not rewrite eligibility, attribution, or Player Stat Lines for Games played while the prior membership was effective. A Player Stat Line must reference the membership that established eligibility for that Game.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_66791f2b4117234a

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Roster Membership Lifecycle

Should `Roster Membership Lifecycle` adopt this change (relax requirement, choose policy): A Game evaluates roster eligibility at its competition eligibility anchor. For a Game that enters `in_progress`, the anchor is the first accepted start instant. For a Game that becomes `forfeit` from `scheduled` or `postponed` without entering `in_progress`, the anchor is the official forfeit decision instant. A cancelled Game has no competition eligibility anchor for Player Stat Line attribution. Rescheduling or postponement before the anchor may change expected timing but does not create Player Stat Line eligibility. Finalization and later authoritative result corrections do not change the anchor or rewrite attribution. A closed membership interval is terminal; later participation requires a new non-overlapping interval.

Evidence:
- A Game evaluates roster eligibility at its competition eligibility anchor. For a Game that enters `in_progress`, the anchor is the first accepted start instant. For a Game that becomes `forfeit` from `scheduled` or `postponed` without entering `in_progress`, the anchor is the official forfeit decision instant. A cancelled Game has no competition eligibility anchor for Player Stat Line attribution. Rescheduling or postponement before the anchor may change expected timing but does not create Player Stat Line eligibility. Finalization and later authoritative result corrections do not change the anchor or rewrite attribution. A closed membership interval is terminal; later participation requires a new non-overlapping interval.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_bf1befb86a6670c6

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Game Lifecycle

Should `Game Lifecycle` adopt this change (relax requirement, choose policy): A new Game begins as `scheduled`. A `scheduled` Game may become `postponed`, `cancelled`, `in_progress`, or `forfeit`. A `postponed` Game may return to `scheduled` with a revised scheduled instant, become `cancelled`, or become `forfeit`. A `cancelled` Game has no authoritative competitive outcome and does not affect standings or playoff aggregates. `cancelled` is terminal and replacement competition requires a new or separately scheduled Game.

Evidence:
- A new Game begins as `scheduled`. A `scheduled` Game may become `postponed`, `cancelled`, `in_progress`, or `forfeit`. A `postponed` Game may return to `scheduled` with a revised scheduled instant, become `cancelled`, or become `forfeit`. A `cancelled` Game has no authoritative competitive outcome and does not affect standings or playoff aggregates. `cancelled` is terminal and replacement competition requires a new or separately scheduled Game.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_e2a867e67a37d697

- type: `tighten_requirement`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Game Lifecycle

Should `Game Lifecycle` adopt this change (tighten requirement): Every scheduled instant is interpreted in the League configured IANA timezone and stored as an unambiguous instant. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history.

Evidence:
- Every scheduled instant is interpreted in the League configured IANA timezone and stored as an unambiguous instant. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_e6e6ff3034e7a16a

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Game Lifecycle

Should `Game Lifecycle` adopt this change (relax requirement, choose policy): An `in_progress` Game may become `final` after an authoritative non-tied score is recorded. An `in_progress` Game tied at the end of regulation continues through overtime until one team wins. A Game may become `forfeit` only from `scheduled`, `postponed`, or `in_progress`, and only with an explicit winning team and official non-tied score. `final` and `forfeit` are authoritative terminal outcome statuses and do not return to prior statuses. Detailed Player statistics are not required for `final` or `forfeit`.

Evidence:
- An `in_progress` Game may become `final` after an authoritative non-tied score is recorded. An `in_progress` Game tied at the end of regulation continues through overtime until one team wins. A Game may become `forfeit` only from `scheduled`, `postponed`, or `in_progress`, and only with an explicit winning team and official non-tied score. `final` and `forfeit` are authoritative terminal outcome statuses and do not return to prior statuses. Detailed Player statistics are not required for `final` or `forfeit`.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_1e2559ba477ee435

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (choose policy): ## Authoritative Result Corrections

Evidence:
- ## Authoritative Result Corrections

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_a0aa4c7dac9b3593

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (relax requirement, choose policy): A League Administrator may correct the score or declared winner of a `final` or `forfeit` Game. A correction preserves authoritative status, writes an Audit Record containing actor, timestamp, action, previous value, new value, and mandatory reason, triggers deterministic recomputation of affected standings, Season-Team result statistics, playoff aggregates, and playoff advancement, and never silently rewrites prior audit history.

Evidence:
- A League Administrator may correct the score or declared winner of a `final` or `forfeit` Game. A correction preserves authoritative status, writes an Audit Record containing actor, timestamp, action, previous value, new value, and mandatory reason, triggers deterministic recomputation of affected standings, Season-Team result statistics, playoff aggregates, and playoff advancement, and never silently rewrites prior audit history.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_abc77c2fc002ea5a

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The resolution report for an accepted correction must identify the corrected Game, affected Matchups and participant slots, downstream authoritative Games that create the conflict, the recalculated participant that would have advanced, the participant currently present downstream, and the League Administrator actor and reason. The permitted accepted resolutions are to apply the correction and halt affected downstream advancement until replacement authoritative outcomes are recorded under corrected bracket participants, or to apply the correction and explicitly affirm the existing downstream participant path as an audited administrative exception. Every accepted resolution writes an Audit Record, and the correction is rejected unless the chosen resolution is applied to every affected downstream participant slot in the same administrative action.

Evidence:
- The resolution report for an accepted correction must identify the corrected Game, affected Matchups and participant slots, downstream authoritative Games that create the conflict, the recalculated participant that would have advanced, the participant currently present downstream, and the League Administrator actor and reason. The permitted accepted resolutions are to apply the correction and halt affected downstream advancement until replacement authoritative outcomes are recorded under corrected bracket participants, or to apply the correction and explicitly affirm the existing downstream participant path as an audited administrative exception. Every accepted resolution writes an Audit Record, and the correction is rejected unless the chosen resolution is applied to every affected downstream participant slot in the same administrative action.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_92794fba7f147b6f

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted correction resolution is composed of the corrected Game, corrected authoritative value, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots are canonicalized by fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within fixed bracket order. Identity equality is based on canonicalized content, not traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, duplicate submissions, or concurrent recomputations for the same resolution identity must return the same projection effect, correction/resolution artifact identity, Audit Record identity, and resolution report. After a resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted correction and resolution rather than appending another material Audit Record or creating a competing acceptance. If an implementation records non-authoritative retry-attempt telemetry, that telemetry is separate from the authoritative append-only Audit Record surface and does not affect projection identity, audit identity, or resolution status. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

Evidence:
- The deterministic identity of an accepted correction resolution is composed of the corrected Game, corrected authoritative value, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots are canonicalized by fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within fixed bracket order. Identity equality is based on canonicalized content, not traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, duplicate submissions, or concurrent recomputations for the same resolution identity must return the same projection effect, correction/resolution artifact identity, Audit Record identity, and resolution report. After a resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted correction and resolution rather than appending another material Audit Record or creating a competing acceptance. If an implementation records non-authoritative retry-attempt telemetry, that telemetry is separate from the authoritative append-only Audit Record surface and does not affect projection identity, audit identity, or resolution status. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_f0d2929ab27dfe8a

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Player Stat Line Lifecycle

Should `Player Stat Line Lifecycle` adopt this change (relax requirement, choose policy): Verification and completeness are independent. A Player Stat Line may be created or updated as `provisional` before or after the Game result becomes authoritative. A line becomes `confirmed` when its currently known values have been verified. A confirmed line may remain partial. Updating a confirmed value returns the changed line to `provisional` unless the same authorized action explicitly verifies the replacement. `confirmed` is not terminal; the only permitted post-confirmation mutation is an authorized value update that returns the changed line to `provisional` unless explicitly verified in the same action.

Evidence:
- Verification and completeness are independent. A Player Stat Line may be created or updated as `provisional` before or after the Game result becomes authoritative. A line becomes `confirmed` when its currently known values have been verified. A confirmed line may remain partial. Updating a confirmed value returns the changed line to `provisional` unless the same authorized action explicitly verifies the replacement. `confirmed` is not terminal; the only permitted post-confirmation mutation is an authorized value update that returns the changed line to `provisional` unless explicitly verified in the same action.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_56bd5f6e7c4cb3bf

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Player Stat Line Lifecycle

Should `Player Stat Line Lifecycle` adopt this change (choose policy): Each statistical value is either known, including known zero, or unknown because it has not been recorded. Human-readable completeness labels are derived from which expected values are known and are not substitutes for field-level known/unknown state. Adding later details does not change Game-result authority. Material stat changes are audited with actor, timestamp, action, previous value, new value, and optional reason.

Evidence:
- Each statistical value is either known, including known zero, or unknown because it has not been recorded. Human-readable completeness labels are derived from which expected values are known and are not substitutes for field-level known/unknown state. Adding later details does not change Game-result authority. Material stat changes are audited with actor, timestamp, action, previous value, new value, and optional reason.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_3e35e95dca57c5be

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Player Management Lifecycle

Should `Player Management Lifecycle` adopt this change (relax requirement, choose policy): A User Account-to-Player management relationship follows `requested -> approved -> revoked`. A User Account may create a `requested` relationship for itself and a Player. A League Administrator may create a `requested` relationship on behalf of a User Account and Player, or create and approve the relationship in one audited administrative action. Only an approved relationship grants management authority. League Administrators approve and revoke relationships. Approval and revocation are audited. Multiple approved accounts may manage one Player, and one account may manage multiple Players. Duplicate active `requested` or `approved` relationships for the same User Account and Player are rejected without mutation. `revoked` is terminal for that relationship; later access requires a new request and approval.

Evidence:
- A User Account-to-Player management relationship follows `requested -> approved -> revoked`. A User Account may create a `requested` relationship for itself and a Player. A League Administrator may create a `requested` relationship on behalf of a User Account and Player, or create and approve the relationship in one audited administrative action. Only an approved relationship grants management authority. League Administrators approve and revoke relationships. Approval and revocation are audited. Multiple approved accounts may manage one Player, and one account may manage multiple Players. Duplicate active `requested` or `approved` relationships for the same User Account and Player are rejected without mutation. `revoked` is terminal for that relationship; later access requires a new request and approval.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_ada3293270ea9636

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Role Assignment Lifecycle

Should `Role Assignment Lifecycle` adopt this change (choose policy, scope change): League Administrator assignment is scoped to one League and persists across Seasons until revoked. After bootstrap, League Administrators assign, reassign, and revoke League Administrator assignments for that League. A Team Captain assignment is scoped to one Season Team, and League Administrators assign, reassign, and revoke Team Captain authority. Role assignment changes are audited. Ending a Season does not convert Team Captain assignment into authority over a later Season Team. A revoked role assignment is terminal; later authority requires a new assignment or reassignment under League Administrator authority.

Evidence:
- League Administrator assignment is scoped to one League and persists across Seasons until revoked. After bootstrap, League Administrators assign, reassign, and revoke League Administrator assignments for that League. A Team Captain assignment is scoped to one Season Team, and League Administrators assign, reassign, and revoke Team Captain authority. Role assignment changes are audited. Ending a Season does not convert Team Captain assignment into authority over a later Season Team. A revoked role assignment is terminal; later authority requires a new assignment or reassignment under League Administrator authority.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_163d4c13c1b24928

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings Lifecycle

Should `Standings Lifecycle` adopt this change (choose policy): Standings are recomputed projections, not independently mutable records. Only eligible `final` and `forfeit` regular-season Games contribute. Any authoritative eligible result or permitted adjustment change invalidates the prior projection. Recalculation uses the applicable frozen Season configuration version. A random-draw tiebreak is performed only after all preceding ranking criteria remain tied. Each draw result is persisted and audited; rendering or recalculating unchanged inputs reuses it.

Evidence:
- Standings are recomputed projections, not independently mutable records. Only eligible `final` and `forfeit` regular-season Games contribute. Any authoritative eligible result or permitted adjustment change invalidates the prior projection. Recalculation uses the applicable frozen Season configuration version. A random-draw tiebreak is performed only after all preceding ranking criteria remain tied. Each draw result is persisted and audited; rendering or recalculating unchanged inputs reuses it.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_b7d1799ce16d3307

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings Lifecycle

Should `Standings Lifecycle` adopt this change (tighten requirement, choose policy, scope change): A random-draw tie context has a stable identity composed of Season, frozen Season configuration version, ranking step or criterion that invoked `random_draw`, tied Season Teams in canonical identity order before the draw, and equal preceding criterion values. Canonical identity order is ascending byte order of each Season Team immutable canonical domain identity as assigned when the Season Team is created. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result is rejected as a deterministic conflict without another draw. League Administrators do not override or replace the persisted draw in Phase 1.

Evidence:
- A random-draw tie context has a stable identity composed of Season, frozen Season configuration version, ranking step or criterion that invoked `random_draw`, tied Season Teams in canonical identity order before the draw, and equal preceding criterion values. Canonical identity order is ascending byte order of each Season Team immutable canonical domain identity as assigned when the Season Team is created. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result is rejected as a deterministic conflict without another draw. League Administrators do not override or replace the persisted draw in Phase 1.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_edad99bdd70c5c97

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Playoff Matchup Lifecycle

Should `Playoff Matchup Lifecycle` adopt this change (tighten requirement, choose policy): Initial fixed-bracket Matchup slots resolve from configured Season seeds. Later Matchup slots resolve from winners of named prior Matchups. A Matchup contains the number of Games configured for its Round, and every configured Game must reach `final` or `forfeit` before normal advancement. The Matchup aggregate is the sum of authoritative scores. The team with greater aggregate advances through the fixed bracket. If aggregate scores are tied at the end of regulation in the final configured Game, that Game continues into aggregate-tiebreak overtime until the aggregate tie is broken, even when the regulation score of that individual Game was not tied. Overtime points remain part of the final Game score and therefore the Matchup aggregate. Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, or unknown tiebreak policy must not advance automatically and must report the violated rule.

Evidence:
- Initial fixed-bracket Matchup slots resolve from configured Season seeds. Later Matchup slots resolve from winners of named prior Matchups. A Matchup contains the number of Games configured for its Round, and every configured Game must reach `final` or `forfeit` before normal advancement. The Matchup aggregate is the sum of authoritative scores. The team with greater aggregate advances through the fixed bracket. If aggregate scores are tied at the end of regulation in the final configured Game, that Game continues into aggregate-tiebreak overtime until the aggregate tie is broken, even when the regulation score of that individual Game was not tied. Overtime points remain part of the final Game score and therefore the Matchup aggregate. Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, or unknown tiebreak policy must not advance automatically and must report the violated rule.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_bb05508557ae8b78

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Identity and Participation

Should `Identity and Participation` adopt this change (relax requirement, choose policy): A User Account and Player are distinct. A Player exists independently of User Accounts and team participation. A Team persists independently of any one Season. Season-specific roster, captain authority, Games, and performance attach to Season Team rather than directly to Team. At most one Season Team connects the same Team and Season. A Player may not have overlapping effective Roster Memberships for different Season Teams in the same Season. Transfers preserve historical membership, Game, and Player Stat Line attribution. A User Account may manage a Player only through an approved Player Management Relationship. Player management is many-to-many. Player Stat Line eligibility is evaluated against the Game competition eligibility anchor, and later scheduling, finalization, forfeiture, or result correction does not change historical attribution.

Evidence:
- A User Account and Player are distinct. A Player exists independently of User Accounts and team participation. A Team persists independently of any one Season. Season-specific roster, captain authority, Games, and performance attach to Season Team rather than directly to Team. At most one Season Team connects the same Team and Season. A Player may not have overlapping effective Roster Memberships for different Season Teams in the same Season. Transfers preserve historical membership, Game, and Player Stat Line attribution. A User Account may manage a Player only through an approved Player Management Relationship. Player management is many-to-many. Player Stat Line eligibility is evaluated against the Game competition eligibility anchor, and later scheduling, finalization, forfeiture, or result correction does not change historical attribution.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_2f97c94273574cc2

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (relax requirement, choose policy, scope change): League Administrator authority is scoped to one League and persists across Seasons until revoked. Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League after bootstrap. Team Captain authority is scoped to exactly one Season Team. Only a League Administrator may approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, assign or revoke League Administrator authority after bootstrap, assign or revoke Team Captain authority, mutate Game lifecycle status, create or change Roster Memberships, create or materially change Player Stat Lines, or resolve playoff correction conflicts. Approved Player Management Relationships grant Player-profile management authority only. Team Captain authority grants no independent core mutation authority in Phase 1. Role and management-relationship changes are audited. Unauthorized mutations and unpermitted lifecycle transitions are rejected without mutation and produce the required rejection report.

Evidence:
- League Administrator authority is scoped to one League and persists across Seasons until revoked. Ordinary League Administrator assignment mutation is performed only by an existing League Administrator for the affected League after bootstrap. Team Captain authority is scoped to exactly one Season Team. Only a League Administrator may approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, assign or revoke League Administrator authority after bootstrap, assign or revoke Team Captain authority, mutate Game lifecycle status, create or change Roster Memberships, create or materially change Player Stat Lines, or resolve playoff correction conflicts. Approved Player Management Relationships grant Player-profile management authority only. Team Captain authority grants no independent core mutation authority in Phase 1. Role and management-relationship changes are audited. Unauthorized mutations and unpermitted lifecycle transitions are rejected without mutation and produce the required rejection report.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_ddf4666079bc289c

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Games and Results

Should `Games and Results` adopt this change (tighten requirement, choose policy, scope change): A Game belongs to exactly one Season. Home and away Season Teams are distinct and belong to the Game Season. A `final` or `forfeit` Game has authoritative non-tied score and a winning team consistent with that score. Non-authoritative statuses do not contribute to standings or completed playoff aggregates. Tied Games are prohibited; regulation ties continue through overtime until resolved. A `forfeit` has an explicit official score; derived systems never invent one. Correcting an authoritative result preserves previous value in append-only audit history and recomputes every affected projection. Regular-season and playoff Games are the same entity type distinguished by phase and optional Matchup association. `cancelled`, `final`, and `forfeit` are terminal except that authoritative result corrections may modify score or declared winner of `final` or `forfeit` Games while preserving status. A playoff correction conflict must be resolved in the same administrative action as the correction or the correction is rejected without mutation. Accepted halted correction resolutions make affected slots or Matchups halted in the current projection, exclude conflicted downstream authoritative Games from current corrected-path advancement calculations while preserving them historically, and resume only when replacement authoritative outcomes exist under corrected bracket participants.

Evidence:
- A Game belongs to exactly one Season. Home and away Season Teams are distinct and belong to the Game Season. A `final` or `forfeit` Game has authoritative non-tied score and a winning team consistent with that score. Non-authoritative statuses do not contribute to standings or completed playoff aggregates. Tied Games are prohibited; regulation ties continue through overtime until resolved. A `forfeit` has an explicit official score; derived systems never invent one. Correcting an authoritative result preserves previous value in append-only audit history and recomputes every affected projection. Regular-season and playoff Games are the same entity type distinguished by phase and optional Matchup association. `cancelled`, `final`, and `forfeit` are terminal except that authoritative result corrections may modify score or declared winner of `final` or `forfeit` Games while preserving status. A playoff correction conflict must be resolved in the same administrative action as the correction or the correction is rejected without mutation. Accepted halted correction resolutions make affected slots or Matchups halted in the current projection, exclude conflicted downstream authoritative Games from current corrected-path advancement calculations while preserving them historically, and resume only when replacement authoritative outcomes exist under corrected bracket participants.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_41c00c4f67676ca3

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Player Statistics

Should `Player Statistics` adopt this change (relax requirement, choose policy): A Player Stat Line belongs to exactly one Game, Player, and Roster Membership establishing eligibility. Unknown and known zero are distinct. Completeness and verification are independent. A Game result may become authoritative while Player Stat Lines are absent, provisional, partial, or unknown. Player-stat completeness never affects standings eligibility or playoff advancement. Team points for, points against, and result-derived Team Statistics use authoritative Game score, not the sum of Player Stat Lines. Corrected confirmed statistics return to provisional unless the replacement is explicitly verified in the same authorized action.

Evidence:
- A Player Stat Line belongs to exactly one Game, Player, and Roster Membership establishing eligibility. Unknown and known zero are distinct. Completeness and verification are independent. A Game result may become authoritative while Player Stat Lines are absent, provisional, partial, or unknown. Player-stat completeness never affects standings eligibility or playoff advancement. Team points for, points against, and result-derived Team Statistics use authoritative Game score, not the sum of Player Stat Lines. Corrected confirmed statistics return to provisional unless the replacement is explicitly verified in the same authorized action.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_9fdb024ce3ccdb13

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings

Should `Standings` adopt this change (tighten requirement, choose policy): Standings are derived and cannot be directly edited. Only eligible authoritative regular-season Game outcomes and explicit configuration-permitted adjustment records may influence standings. Under defaults, games played equals wins plus losses, league points equal wins times two, and point differential equals points for minus points against. Default descending ranking order is league points, point differential, points scored, then random draw. A loss awards zero League Points. Random draw is used only when all earlier criteria remain tied. A random-draw result is persisted and audited and must not change because standings are viewed or recomputed from unchanged inputs. Exactly one persisted random-draw result may exist for a stable tie context, and duplicates reuse the existing result or are rejected without another draw. A standings projection identifies the frozen Season configuration version used. Playoff Games do not affect regular-season standings.

Evidence:
- Standings are derived and cannot be directly edited. Only eligible authoritative regular-season Game outcomes and explicit configuration-permitted adjustment records may influence standings. Under defaults, games played equals wins plus losses, league points equal wins times two, and point differential equals points for minus points against. Default descending ranking order is league points, point differential, points scored, then random draw. A loss awards zero League Points. Random draw is used only when all earlier criteria remain tied. A random-draw result is persisted and audited and must not change because standings are viewed or recomputed from unchanged inputs. Exactly one persisted random-draw result may exist for a stable tie context, and duplicates reuse the existing result or are rejected without another draw. A standings projection identifies the frozen Season configuration version used. Playoff Games do not affect regular-season standings.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_0b488265a1c8a003

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Playoffs

Should `Playoffs` adopt this change (tighten requirement, choose policy): A Playoff Bracket uses a fixed advancement graph and does not reseed. Initial Matchup participants resolve from seeds; later participants resolve from winners of fixed prior Matchups. A Matchup contains the Round-configured number of ordinary Games. Every configured Matchup Game is played to an authoritative outcome; early series termination based on Games won is prohibited. Advancement is determined by aggregate authoritative points, not Games won. The aggregate winner is the participating team with greater sum of authoritative Game points after configured Games and any aggregate-tiebreak overtime. Default aggregate-tiebreak overtime continues the final configured Game until the aggregate tie is broken. Aggregate-tiebreak points are part of the authoritative final Game score. A Matchup advances only from authoritative Game scores. A Matchup with incomplete outcomes must not advance automatically, and an attempted correction creating unresolved participant conflict is rejected before authoritative state changes. Accepted correction resolutions that halt advancement are deterministic by canonicalized resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy resume conditions.

Evidence:
- A Playoff Bracket uses a fixed advancement graph and does not reseed. Initial Matchup participants resolve from seeds; later participants resolve from winners of fixed prior Matchups. A Matchup contains the Round-configured number of ordinary Games. Every configured Matchup Game is played to an authoritative outcome; early series termination based on Games won is prohibited. Advancement is determined by aggregate authoritative points, not Games won. The aggregate winner is the participating team with greater sum of authoritative Game points after configured Games and any aggregate-tiebreak overtime. Default aggregate-tiebreak overtime continues the final configured Game until the aggregate tie is broken. Aggregate-tiebreak points are part of the authoritative final Game score. A Matchup advances only from authoritative Game scores. A Matchup with incomplete outcomes must not advance automatically, and an attempted correction creating unresolved participant conflict is rejected before authoritative state changes. Accepted correction resolutions that halt advancement are deterministic by canonicalized resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy resume conditions.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_db34c54671a2d83b

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Configuration and Reproducibility

Should `Configuration and Reproducibility` adopt this change (tighten requirement, choose policy): The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes reuse that frozen version. Concurrent or retried first-freeze attempts compare canonical result-affecting configuration basis identity; equal identities reuse existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions. Later amendments require League Administrator authority and an Audit Record. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution. Historical versions remain available. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic. Configuration cannot enable tied final Games. Unknown playoff policies, ranking criteria, or lifecycle transitions are rejected rather than silently interpreted.

Evidence:
- The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes reuse that frozen version. Concurrent or retried first-freeze attempts compare canonical result-affecting configuration basis identity; equal identities reuse existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions. Later amendments require League Administrator authority and an Audit Record. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution. Historical versions remain available. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic. Configuration cannot enable tied final Games. Unknown playoff policies, ranking criteria, or lifecycle transitions are rejected rather than silently interpreted.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_22f7ff6d82c3ed3f

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Venues, Media, and Audit

Should `Venues, Media, and Audit` adopt this change (relax requirement, choose policy): A Venue is reusable and League-owned; a Game may reference at most one Venue. A Media item may be associated with a Game, League Gallery, or both without duplicating Media identity. Every material Audit Record contains actor, timestamp, action, previous value, and new value. Audit reasons are optional except for authoritative Game-result corrections, where a reason is mandatory. Audit history is append-only. Required rejection reports identify entity, current state or condition, requested mutation, actor, violated rule, and state-preservation outcome. Accepted playoff correction resolution reports identify halted slots or Matchups, conflicted downstream Games retained as historical records, corrected-path records excluded from current advancement, resume condition, and canonicalized resolution identity used for deterministic retries.

Evidence:
- A Venue is reusable and League-owned; a Game may reference at most one Venue. A Media item may be associated with a Game, League Gallery, or both without duplicating Media identity. Every material Audit Record contains actor, timestamp, action, previous value, and new value. Audit reasons are optional except for authoritative Game-result corrections, where a reason is mandatory. Audit history is append-only. Required rejection reports identify entity, current state or condition, requested mutation, actor, violated rule, and state-preservation outcome. Accepted playoff correction resolution reports identify halted slots or Matchups, conflicted downstream Games retained as historical records, corrected-path records excluded from current advancement, resume condition, and canonicalized resolution identity used for deterministic retries.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_41b071ad77b05935

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authority and Precedence

Should `Authority and Precedence` adopt this change (choose policy): Configuration resolves from normative Courtside defaults to League configuration to Season overrides to frozen Season configuration version. More specific values override less specific values only where permitted. The first accepted authoritative Season Game outcome freezes all result-affecting values into a single versioned Season snapshot. Later, retried, or concurrent authoritative outcome transitions reuse the existing snapshot or are rejected under the lifecycle freeze rule when they depend on a different mutable configuration basis.

Evidence:
- Configuration resolves from normative Courtside defaults to League configuration to Season overrides to frozen Season configuration version. More specific values override less specific values only where permitted. The first accepted authoritative Season Game outcome freezes all result-affecting values into a single versioned Season snapshot. Later, retried, or concurrent authoritative outcome transitions reuse the existing snapshot or are rejected under the lifecycle freeze rule when they depend on a different mutable configuration basis.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_4688de2322bf9acf

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authority and Precedence

Should `Authority and Precedence` adopt this change (scope change): The result-affecting configuration basis identity used for first-freeze comparison is canonical content identity of values captured in the frozen version. It covers standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes timezone, localization, Venue, Media, display text, and other non-result-affecting values.

Evidence:
- The result-affecting configuration basis identity used for first-freeze comparison is canonical content identity of values captured in the frozen version. It covers standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes timezone, localization, Venue, Media, display text, and other non-result-affecting values.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_c1687c53e914cf68

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings Configuration

Should `Standings Configuration` adopt this change (choose policy): The standings engine is configurable by Season. It defines League Points for each authoritative outcome, ordered ranking criteria, eligible competition phases and Game statuses, whether explicit standings adjustments are permitted, and how random-draw results are persisted and reused. The normative default awards two points for a win and zero for a loss; eligible Games are regular-season `final` and `forfeit`; ranking is `league_points`, `point_differential`, `points_scored`, then `random_draw`; adjustments are disabled.

Evidence:
- The standings engine is configurable by Season. It defines League Points for each authoritative outcome, ordered ranking criteria, eligible competition phases and Game statuses, whether explicit standings adjustments are permitted, and how random-draw results are persisted and reused. The normative default awards two points for a win and zero for a loss; eligible Games are regular-season `final` and `forfeit`; ranking is `league_points`, `point_differential`, `points_scored`, then `random_draw`; adjustments are disabled.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_bc7ac21acf321e16

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings Configuration

Should `Standings Configuration` adopt this change (relax requirement, scope change): All numeric ranking criteria sort descending. `random_draw` is evaluated only for teams still tied after every preceding criterion. Each performed draw records tied participants, canonical tied-participant order before the draw, preceding equal criterion values, resulting order, actor or system initiator, timestamp, applicable Season configuration version, and stable tie-context identity. The same unresolved tie context reuses the recorded result. The stable tie-context identity is composed of Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and equal preceding criterion values. Exactly one persisted draw result may exist for a tie context. Duplicate attempts return the existing result or are rejected as deterministic conflicts without another draw. League Administrators do not override or replace persisted draws in Phase 1.

Evidence:
- All numeric ranking criteria sort descending. `random_draw` is evaluated only for teams still tied after every preceding criterion. Each performed draw records tied participants, canonical tied-participant order before the draw, preceding equal criterion values, resulting order, actor or system initiator, timestamp, applicable Season configuration version, and stable tie-context identity. The same unresolved tie context reuses the recorded result. The stable tie-context identity is composed of Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and equal preceding criterion values. Exactly one persisted draw result may exist for a tie context. Duplicate attempts return the existing result or are rejected as deterministic conflicts without another draw. League Administrators do not override or replace persisted draws in Phase 1.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_82954f5240e51c94

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standing Calculations

Should `Standing Calculations` adopt this change (tighten requirement, choose policy): For each Season Team under default rules: wins are eligible authoritative Games won; losses are eligible authoritative Games lost; games played equals wins plus losses; league points equal configured win and loss points; points for and against are sums of official eligible Game scores; point differential is points for minus points against; points scored is points for. A forfeit contributes its explicit official score. If standings adjustments are enabled later, each adjustment must be an explicit audited record rather than direct edit to derived standings.

Evidence:
- For each Season Team under default rules: wins are eligible authoritative Games won; losses are eligible authoritative Games lost; games played equals wins plus losses; league points equal configured win and loss points; points for and against are sums of official eligible Game scores; point differential is points for minus points against; points scored is points for. A forfeit contributes its explicit official score. If standings adjustments are enabled later, each adjustment must be an explicit audited record rather than direct edit to derived standings.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_09a42416211ed2d8

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Playoff Configuration

Should `Playoff Configuration` adopt this change (tighten requirement, choose policy): Playoff structure is configurable per Round. Each Round defines stable Round identity and display order, fixed input slots from seeds or named prior-Matchup winners, number of Games in each Matchup, `aggregate_points` as advancement rule, and aggregate-tiebreak policy. Example Game counts are illustrative only. Every Season must provide actual Round list and Game count for each Round. `overtime` is the normative default aggregate-tiebreak policy and continues the final configured Game after regulation until the Matchup aggregate is no longer tied. Unknown policies are rejected rather than silently falling back. Round structure and policies are result-affecting frozen configuration and are subject to frozen amendment legality after dependent authoritative playoff Games exist.

Evidence:
- Playoff structure is configurable per Round. Each Round defines stable Round identity and display order, fixed input slots from seeds or named prior-Matchup winners, number of Games in each Matchup, `aggregate_points` as advancement rule, and aggregate-tiebreak policy. Example Game counts are illustrative only. Every Season must provide actual Round list and Game count for each Round. `overtime` is the normative default aggregate-tiebreak policy and continues the final configured Game after regulation until the Matchup aggregate is no longer tied. Unknown policies are rejected rather than silently falling back. Round structure and policies are result-affecting frozen configuration and are subject to frozen amendment legality after dependent authoritative playoff Games exist.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_a6e27170d78207e2

- type: `scope_change`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Game and Venue Configuration

Should `Game and Venue Configuration` adopt this change (tighten requirement, scope change): Every Game has scheduled instant, home and away Season Teams, competition phase, optional Venue reference, and optional Game-specific venue instructions. Every Venue has stable League-local identity, name, address, and optional notes. The League timezone supplies scheduling interpretation for administrative entry and default display. Stored scheduled instants must remain unambiguous across daylight-saving transitions.

Evidence:
- Every Game has scheduled instant, home and away Season Teams, competition phase, optional Venue reference, and optional Game-specific venue instructions. Every Venue has stable League-local identity, name, address, and optional notes. The League timezone supplies scheduling interpretation for administrative entry and default display. Stored scheduled instants must remain unambiguous across daylight-saving transitions.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_f7a1fd44aba54ee8

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Statistics Configuration

Should `Statistics Configuration` adopt this change (tighten requirement, choose policy): The concrete statistic vocabulary is deferred until the initial scorekeeping surface is specified. Any later vocabulary must preserve field-level known versus unknown state, known zero as valid value, line-level provisional or confirmed verification, confirmed partial lines, and independence between Player-stat completeness and Game-result authority. Points may be recorded before other statistics and must not imply unrecorded fields are zero.

Evidence:
- The concrete statistic vocabulary is deferred until the initial scorekeeping surface is specified. Any later vocabulary must preserve field-level known versus unknown state, known zero as valid value, line-level provisional or confirmed verification, confirmed partial lines, and independence between Player-stat completeness and Game-result authority. Points may be recorded before other statistics and must not imply unrecorded fields are zero.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_9c31880bfb5e6a3a

- type: `tighten_requirement`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Localization Configuration

Should `Localization Configuration` adopt this change (tighten requirement): Language selection follows saved supported User Account preference, then League default language. If requested authored-content translation is missing, Courtside renders the League-default variant. UI and authored content must be capable of English and French variants. Proper names are stored and rendered without automatic translation. Concrete storage and editorial workflow are deferred.

Evidence:
- Language selection follows saved supported User Account preference, then League default language. If requested authored-content translation is missing, Courtside renders the League-default variant. UI and authored content must be capable of English and French variants. Proper names are stored and rendered without automatic translation. Concrete storage and editorial workflow are deferred.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_f30555fee78e6f96

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization Configuration

Should `Authorization Configuration` adopt this change (choose policy, scope change): The initial roles are `league_admin`, scoped to one League and persistent across Seasons until revoked, and `team_captain`, scoped to one Season Team. After bootstrap, existing League Administrators assign, reassign, and revoke League Administrator authority for that League. League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, and playoff correction conflict resolution. Persisted random-draw duplicate or conflict attempts are handled only by deterministic reuse or rejection. Team Captain authority is a scoped role marker in Phase 1. Adding roles or changing authority requires an accepted specification update.

Evidence:
- The initial roles are `league_admin`, scoped to one League and persistent across Seasons until revoked, and `team_captain`, scoped to one Season Team. After bootstrap, existing League Administrators assign, reassign, and revoke League Administrator authority for that League. League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, and playoff correction conflict resolution. Persisted random-draw duplicate or conflict attempts are handled only by deterministic reuse or rejection. Team Captain authority is a scoped role marker in Phase 1. Adding roles or changing authority requires an accepted specification update.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_3ceac5fb3954e5c5

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Audit Configuration

Should `Audit Configuration` adopt this change (choose policy): Audit Records contain actor, timestamp, action, previous value, new value, and reason, with reason optional unless otherwise required. Auditing is mandatory for finalized or forfeited Game-result corrections with a required reason, material Player-stat changes, Roster Membership changes, Player Management Relationship approvals and revocations, League Administrator and Team Captain assignment changes, frozen Season configuration amendments, persisted random-draw tiebreak results, playoff correction conflict resolutions, and scheduling changes unless required scheduling-change history is preserved outside Audit Records.

Evidence:
- Audit Records contain actor, timestamp, action, previous value, new value, and reason, with reason optional unless otherwise required. Auditing is mandatory for finalized or forfeited Game-result corrections with a required reason, material Player-stat changes, Roster Membership changes, Player Management Relationship approvals and revocations, League Administrator and Team Captain assignment changes, frozen Season configuration amendments, persisted random-draw tiebreak results, playoff correction conflict resolutions, and scheduling changes unless required scheduling-change history is preserved outside Audit Records.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_8268f7ae6be83018

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Audit Configuration

Should `Audit Configuration` adopt this change (tighten requirement, choose policy): An Audit Record for a playoff correction conflict resolution must include resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The canonicalized resolution identity is also the idempotency key for authoritative correction-resolution audit persistence: once accepted, duplicate submissions, retries, replays, and concurrent recomputations reuse the existing Audit Record identity and do not append another material Audit Record for the same accepted resolution. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff, including whether the request created a new accepted resolution or returned the prior acceptance.

Evidence:
- An Audit Record for a playoff correction conflict resolution must include resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The canonicalized resolution identity is also the idempotency key for authoritative correction-resolution audit persistence: once accepted, duplicate submissions, retries, replays, and concurrent recomputations reuse the existing Audit Record identity and do not append another material Audit Record for the same accepted resolution. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff, including whether the request created a new accepted resolution or returned the prior acceptance.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_78fcaf9f0f408a34

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Context

Should `Context` adopt this change (choose policy): Courtside needs a stable conceptual boundary before schema, API, framework, or deployment decisions. Without explicit domain authority, implementations are likely to collapse User Account and Player identity, lose roster history, treat playoff Games as a separate type, make standings depend on incomplete statistics, or encode one League policy as inflexible implementation rules.

Evidence:
- Courtside needs a stable conceptual boundary before schema, API, framework, or deployment decisions. Without explicit domain authority, implementations are likely to collapse User Account and Player identity, lose roster history, treat playoff Games as a separate type, make standings depend on incomplete statistics, or encode one League policy as inflexible implementation rules.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_e3b69a9b03c8dbb0

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Decision

Should `Decision` adopt this change (relax requirement, choose policy): Adopt the domain defined by overview, lifecycle, invariants, and configuration. The ratified direction is that Season is the competition container while Team and Player identities persist across Seasons; Season Team and Roster Membership preserve Season participation and transfers historically; User Account and Player remain separate and connected through many-to-many approved management relationships; League Administrator authority persists across Seasons; Team Captain authority is scoped to one Season Team; Games use `scheduled`, `postponed`, `cancelled`, `in_progress`, `final`, and `forfeit`; tied authoritative outcomes are prohibited; League Administrators may correct authoritative outcomes with append-only audit and mandatory reason; Player-stat values distinguish unknown from known zero and may be partial and independently provisional or confirmed; standings derive from authoritative regular-season results under customizable versioned configuration; playoffs use fixed aggregate-points brackets with configurable aggregate-tiebreak defaulting to overtime in the final configured Game; result-affecting Season configuration freezes at first final or forfeited Game and changes only by versioned audited League Administrator amendment; the League owns timezone, reusable Venues, English/French language configuration, default language, localizable UI and authored content, and reusable Media identity; and material administrative changes use the minimum audit fields defined in configuration.

Evidence:
- Adopt the domain defined by overview, lifecycle, invariants, and configuration. The ratified direction is that Season is the competition container while Team and Player identities persist across Seasons; Season Team and Roster Membership preserve Season participation and transfers historically; User Account and Player remain separate and connected through many-to-many approved management relationships; League Administrator authority persists across Seasons; Team Captain authority is scoped to one Season Team; Games use `scheduled`, `postponed`, `cancelled`, `in_progress`, `final`, and `forfeit`; tied authoritative outcomes are prohibited; League Administrators may correct authoritative outcomes with append-only audit and mandatory reason; Player-stat values distinguish unknown from known zero and may be partial and independently provisional or confirmed; standings derive from authoritative regular-season results under customizable versioned configuration; playoffs use fixed aggregate-points brackets with configurable aggregate-tiebreak defaulting to overtime in the final configured Game; result-affecting Season configuration freezes at first final or forfeited Game and changes only by versioned audited League Administrator amendment; the League owns timezone, reusable Venues, English/French language configuration, default language, localizable UI and authored content, and reusable Media identity; and material administrative changes use the minimum audit fields defined in configuration.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_cc7b04eceedc3ab9

- type: `tighten_requirement`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`
- round: `27`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Consequences

Should `Consequences` adopt this change (tighten requirement): Schema and API work must preserve participation history instead of placing a mutable team reference directly on Player. Derived standings and playoff advancement require reproducible configuration versions and audit-aware recomputation. Statistics representations must preserve missingness and verification separately. Playoff Matchups cannot use conventional games-won best-of logic. Interfaces and contracts may be designed later without reopening these concepts unless new requirements create a genuine domain conflict. No implementation, contract, or public protocol directories are created by this decision alone.

Evidence:
- Schema and API work must preserve participation history instead of placing a mutable team reference directly on Player. Derived standings and playoff advancement require reproducible configuration versions and audit-aware recomputation. Statistics representations must preserve missingness and verification separately. Playoff Matchups cannot use conventional games-won best-of logic. Interfaces and contracts may be designed later without reopening these concepts unless new requirements create a genuine domain conflict. No implementation, contract, or public protocol directories are created by this decision alone.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_63706f5931ad6c73

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Courtside Core Domain — Isolated Phase 1.01 Composite

Should `Courtside Core Domain — Isolated Phase 1.01 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.01 Composite

Evidence:
- # Courtside Core Domain — Isolated Phase 1.01 Composite

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_592757927bd6b275

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Role Assignment

Should `Role Assignment` adopt this change (choose policy, scope change): For Phase 1, Team Captain is a scoped domain authority marker. It does not by itself grant independent authority over Game outcomes, rosters, Player Stat Lines, Player Management approvals, Season configuration amendments, or playoff conflict resolution unless a later accepted specification grants that authority.

Evidence:
- For Phase 1, Team Captain is a scoped domain authority marker. It does not by itself grant independent authority over Game outcomes, rosters, Player Stat Lines, Player Management approvals, Season configuration amendments, or playoff conflict resolution unless a later accepted specification grants that authority.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_21dcea43c59badc0

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`, `scope_change`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: General Lifecycle Failure Rule

Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, the current state or condition, the requested state or mutation, the actor, and the violated lifecycle rule. Auditing rejected attempts is not required by this Phase 1 domain specification unless the audit policy for that surface explicitly requires it.

Evidence:
- For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, the current state or condition, the requested state or mutation, the actor, and the violated lifecycle rule. Auditing rejected attempts is not required by this Phase 1 domain specification unless the audit policy for that surface explicitly requires it.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_98d1bf2436af91b4

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (choose policy): ## Core Mutation Authority

Evidence:
- ## Core Mutation Authority

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_3c65d8a820455ea4

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (choose policy): Mutation authority is evaluated at the time the mutation is requested and is scoped to the League, Season, Season Team, Player, or Game named by the affected record.

Evidence:
- Mutation authority is evaluated at the time the mutation is requested and is scoped to the League, Season, Season Team, Player, or Game named by the affected record.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_2347ff3d284afab8

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `scope_change`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (relax requirement, scope change): League Administrators may create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke role assignments; amend frozen Season configuration; and resolve playoff correction conflicts.

Evidence:
- - League Administrators may create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke role assignments; amend frozen Season configuration; and resolve playoff correction conflicts.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_d2d016e14e3a8cff

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (choose policy): Approved Player Management Relationships grant authority to manage the associated Player profile within later interface specifications. They do not grant authority to approve relationships, change rosters, mutate Game lifecycle status, correct authoritative results, amend Season configuration, or resolve playoff conflicts.

Evidence:
- - Approved Player Management Relationships grant authority to manage the associated Player profile within later interface specifications. They do not grant authority to approve relationships, change rosters, mutate Game lifecycle status, correct authoritative results, amend Season configuration, or resolve playoff conflicts.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_4d7a169b05856c47

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (scope change): Team Captain assignments are scoped to one Season Team and are auditable role assignments. In Phase 1 they do not independently authorize core domain mutations unless a later accepted specification grants a specific Team Captain permission.

Evidence:
- - Team Captain assignments are scoped to one Season Team and are auditable role assignments. In Phase 1 they do not independently authorize core domain mutations unless a later accepted specification grants a specific Team Captain permission.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_5e02c6ab62f54659

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (choose policy): Derived standings, Season-Team result statistics, playoff aggregates, and playoff advancement are produced by deterministic recomputation from authoritative inputs. They are not directly edited by any actor.

Evidence:
- - Derived standings, Season-Team result statistics, playoff aggregates, and playoff advancement are produced by deterministic recomputation from authoritative inputs. They are not directly edited by any actor.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_bb050da881095598

- type: `relax_requirement`
- status: `operator_review_recommended`
- triggers: `relax_requirement`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (relax requirement): System-initiated recomputation may update derived projections and may reuse or create persisted random-draw results only as allowed by the standings random-draw rules.

Evidence:
- - System-initiated recomputation may update derived projections and may reuse or create persisted random-draw results only as allowed by the standings random-draw rules.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_ebf9e410b03355f3

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): If a correction would change a playoff participant after downstream Games already have authoritative outcomes, automated destructive propagation is prohibited. The correction must either be rejected before it is recorded or recorded with an explicit League Administrator resolution in the same administrative action. Until that resolution is recorded, affected playoff advancement projections are blocked from further automatic advancement, while existing downstream authoritative Game records remain historically visible and are not silently changed.

Evidence:
- If a correction would change a playoff participant after downstream Games already have authoritative outcomes, automated destructive propagation is prohibited. The correction must either be rejected before it is recorded or recorded with an explicit League Administrator resolution in the same administrative action. Until that resolution is recorded, affected playoff advancement projections are blocked from further automatic advancement, while existing downstream authoritative Game records remain historically visible and are not silently changed.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_adfe7e24ceda396d

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The resolution report must identify the corrected Game, the affected Matchups and participant slots, downstream authoritative Games that create the conflict, the recalculated participant that would have advanced, the participant currently present downstream, and the League Administrator actor and reason. The permitted resolutions are:

Evidence:
- The resolution report must identify the corrected Game, the affected Matchups and participant slots, downstream authoritative Games that create the conflict, the recalculated participant that would have advanced, the participant currently present downstream, and the League Administrator actor and reason. The permitted resolutions are:

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_ef2058ac05f6b76e

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (choose policy): abandon the correction and preserve the prior authoritative result;

Evidence:
- - abandon the correction and preserve the prior authoritative result;

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_e3d1365932d05380

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (choose policy): apply the correction and halt affected downstream advancement until replacement authoritative outcomes are recorded under the corrected bracket participants; or

Evidence:
- - apply the correction and halt affected downstream advancement until replacement authoritative outcomes are recorded under the corrected bracket participants; or

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_1039e8c0a2f9f9e5

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Role Assignment Lifecycle

Should `Role Assignment Lifecycle` adopt this change (choose policy, scope change): A revoked role assignment is terminal for that assignment. Later authority requires a new assignment or reassignment under League Administrator authority.

Evidence:
- - A revoked role assignment is terminal for that assignment. Later authority requires a new assignment or reassignment under League Administrator authority.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_5f9f24ee3e2ad848

- type: `tighten_requirement`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings Lifecycle

Should `Standings Lifecycle` adopt this change (tighten requirement): A random-draw tie context has a stable identity composed of the Season, the frozen Season configuration version, the ranking step or criterion that invoked `random_draw`, the tied Season Teams in canonical identity order before the draw, and the equal preceding criterion values that made the tie unresolved. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result for the same tie context is rejected as a deterministic conflict without performing another draw.

Evidence:
- A random-draw tie context has a stable identity composed of the Season, the frozen Season configuration version, the ranking step or criterion that invoked `random_draw`, the tied Season Teams in canonical identity order before the draw, and the equal preceding criterion values that made the tie unresolved. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result for the same tie context is rejected as a deterministic conflict without performing another draw.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_274d60155ff4d68d

- type: `tighten_requirement`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Playoff Matchup Lifecycle

Should `Playoff Matchup Lifecycle` adopt this change (tighten requirement): Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, an unknown tiebreak policy, or a blocked participant-resolution conflict must not advance automatically and must report the violated rule.

Evidence:
- Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, an unknown tiebreak policy, or a blocked participant-resolution conflict must not advance automatically and must report the violated rule.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_751927cc413ce89d

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (relax requirement, choose policy): 3. Only a League Administrator may approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, assign Team Captain authority, mutate Game lifecycle status, create or change Roster Memberships, create or materially change Player Stat Lines, or resolve playoff correction conflicts.

Evidence:
- 3. Only a League Administrator may approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, assign Team Captain authority, mutate Game lifecycle status, create or change Roster Memberships, create or materially change Player Stat Lines, or resolve playoff correction conflicts.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_728fe2ccd155a4c8

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (choose policy, scope change): 4. An approved Player Management Relationship grants Player-profile management authority only; it does not grant authority over rosters, Game outcomes, standings, playoff advancement, Season configuration, or role assignment.

Evidence:
- 4. An approved Player Management Relationship grants Player-profile management authority only; it does not grant authority over rosters, Game outcomes, standings, playoff advancement, Season configuration, or role assignment.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_929baca54335cbcb

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (choose policy, scope change): 5. Team Captain authority is an auditable scoped role marker in Phase 1 and grants no independent core mutation authority until a later accepted specification defines such permissions.

Evidence:
- 5. Team Captain authority is an auditable scoped role marker in Phase 1 and grants no independent core mutation authority until a later accepted specification defines such permissions.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_3f59aa530e1c9997

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (scope change): 6. Role and management-relationship changes are audited.

Evidence:
- 6. Role and management-relationship changes are audited.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_5350d9cd676ffb78

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization

Should `Authorization` adopt this change (choose policy): 7. Unauthorized mutation attempts and lifecycle transitions not explicitly permitted by the lifecycle specification are rejected without mutating authoritative state.

Evidence:
- 7. Unauthorized mutation attempts and lifecycle transitions not explicitly permitted by the lifecycle specification are rejected without mutating authoritative state.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_1631d54f6cb8351b

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Games and Results

Should `Games and Results` adopt this change (relax requirement, choose policy): 9. `cancelled`, `final`, and `forfeit` Game statuses are terminal lifecycle states, except that authoritative result corrections may modify the score or declared winner of `final` or `forfeit` Games while preserving status.

Evidence:
- 9. `cancelled`, `final`, and `forfeit` Game statuses are terminal lifecycle states, except that authoritative result corrections may modify the score or declared winner of `final` or `forfeit` Games while preserving status.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_33a3ef95971c7458

- type: `tighten_requirement`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings

Should `Standings` adopt this change (tighten requirement): 8. Exactly one persisted random-draw result may exist for a stable tie context, and duplicate attempts for that tie context must reuse the existing result or be rejected without performing another draw.

Evidence:
- 8. Exactly one persisted random-draw result may exist for a stable tie context, and duplicate attempts for that tie context must reuse the existing result or be rejected without performing another draw.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_89c222d2f6d01a99

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Playoffs

Should `Playoffs` adopt this change (tighten requirement, choose policy): 10. A playoff Matchup with incomplete authoritative Game outcomes or an unresolved participant conflict must not advance automatically.

Evidence:
- 10. A playoff Matchup with incomplete authoritative Game outcomes or an unresolved participant conflict must not advance automatically.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_589c0b19c1436af7

- type: `tighten_requirement`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings Configuration

Should `Standings Configuration` adopt this change (tighten requirement): The stable tie-context identity is composed of the Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and the equal preceding criterion values. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context return the existing result. Attempting to create a second result for the same tie context is rejected as a deterministic conflict and must not perform another draw.

Evidence:
- The stable tie-context identity is composed of the Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and the equal preceding criterion values. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context return the existing result. Attempting to create a second result for the same tie context is rejected as a deterministic conflict and must not perform another draw.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_fa4a5c2f87a82db1

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization Configuration

Should `Authorization Configuration` adopt this change (choose policy, scope change): League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, persisted random-draw conflict resolution, and playoff correction conflict resolution. Team Captain authority is a scoped role marker in Phase 1 and does not add independent mutation permissions unless a later accepted specification defines them. Adding roles or changing their authority requires an accepted specification update.

Evidence:
- League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, persisted random-draw conflict resolution, and playoff correction conflict resolution. Team Captain authority is a scoped role marker in Phase 1 and does not add independent mutation permissions unless a later accepted specification defines them. Adding roles or changing their authority requires an accepted specification update.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_98fe0bad87fd75d5

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Courtside Core Domain — Isolated Phase 1.02 Composite

Should `Courtside Core Domain — Isolated Phase 1.02 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.02 Composite

Evidence:
- # Courtside Core Domain — Isolated Phase 1.02 Composite

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_0462ed3015c05d71

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`, `scope_change`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: General Lifecycle Failure Rule

Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): In-scope invariant and configuration validation failures are rejected under the same preserve-state rule. The rejection report must identify the affected entity or configuration surface, the submitted value or attempted mutation, the actor when applicable, the violated invariant or configuration rule, and confirm that existing authoritative records, persisted projections, and configuration versions remain unchanged.

Evidence:
- In-scope invariant and configuration validation failures are rejected under the same preserve-state rule. The rejection report must identify the affected entity or configuration surface, the submitted value or attempted mutation, the actor when applicable, the violated invariant or configuration rule, and confirm that existing authoritative records, persisted projections, and configuration versions remain unchanged.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_d1a2e298829a73d3

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): If a correction would change a playoff participant after downstream Games already have authoritative outcomes, automated destructive propagation is prohibited. The correction must either be rejected before it is recorded or recorded with an explicit League Administrator resolution in the same administrative action. A correction action that cannot resolve every affected downstream participant slot is rejected without mutating authoritative state, and no unresolved participant-resolution conflict state is persisted. Existing downstream authoritative Game records remain historically visible and are not silently changed.

Evidence:
- If a correction would change a playoff participant after downstream Games already have authoritative outcomes, automated destructive propagation is prohibited. The correction must either be rejected before it is recorded or recorded with an explicit League Administrator resolution in the same administrative action. A correction action that cannot resolve every affected downstream participant slot is rejected without mutating authoritative state, and no unresolved participant-resolution conflict state is persisted. Existing downstream authoritative Game records remain historically visible and are not silently changed.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_713b3bb41c4eb557

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The resolution report for an accepted correction must identify the corrected Game, the affected Matchups and participant slots, downstream authoritative Games that create the conflict, the recalculated participant that would have advanced, the participant currently present downstream, and the League Administrator actor and reason. The permitted accepted resolutions are:

Evidence:
- The resolution report for an accepted correction must identify the corrected Game, the affected Matchups and participant slots, downstream authoritative Games that create the conflict, the recalculated participant that would have advanced, the participant currently present downstream, and the League Administrator actor and reason. The permitted accepted resolutions are:

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_0fca561d8be8427a

- type: `relax_requirement`
- status: `operator_review_recommended`
- triggers: `relax_requirement`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Player Management Lifecycle

Should `Player Management Lifecycle` adopt this change (relax requirement): A User Account may create a `requested` relationship for itself and a Player.

Evidence:
- - A User Account may create a `requested` relationship for itself and a Player.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_6acbf05b63785080

- type: `relax_requirement`
- status: `operator_review_recommended`
- triggers: `relax_requirement`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Player Management Lifecycle

Should `Player Management Lifecycle` adopt this change (relax requirement): A League Administrator may create a `requested` relationship on behalf of a User Account and Player, or create and approve the relationship in one audited administrative action.

Evidence:
- - A League Administrator may create a `requested` relationship on behalf of a User Account and Player, or create and approve the relationship in one audited administrative action.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_4502eaeec3bc9713

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Player Management Lifecycle

Should `Player Management Lifecycle` adopt this change (choose policy): Duplicate active `requested` or `approved` relationships for the same User Account and Player are rejected without mutating authoritative state.

Evidence:
- - Duplicate active `requested` or `approved` relationships for the same User Account and Player are rejected without mutating authoritative state.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_1cc5dd899890c4c3

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`, `scope_change`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings Lifecycle

Should `Standings Lifecycle` adopt this change (tighten requirement, choose policy, scope change): A random-draw tie context has a stable identity composed of the Season, the frozen Season configuration version, the ranking step or criterion that invoked `random_draw`, the tied Season Teams in canonical identity order before the draw, and the equal preceding criterion values that made the tie unresolved. Canonical identity order is the ascending order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created, compared by normalized codepoint order. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result for the same tie context is rejected as a deterministic conflict without performing another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

Evidence:
- A random-draw tie context has a stable identity composed of the Season, the frozen Season configuration version, the ranking step or criterion that invoked `random_draw`, the tied Season Teams in canonical identity order before the draw, and the equal preceding criterion values that made the tie unresolved. Canonical identity order is the ascending order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created, compared by normalized codepoint order. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result for the same tie context is rejected as a deterministic conflict without performing another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_259578897028488c

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Playoff Matchup Lifecycle

Should `Playoff Matchup Lifecycle` adopt this change (tighten requirement, choose policy): Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, or an unknown tiebreak policy must not advance automatically and must report the violated rule. An attempted correction that would create an unresolved participant-resolution conflict is rejected before authoritative state changes.

Evidence:
- Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, or an unknown tiebreak policy must not advance automatically and must report the violated rule. An attempted correction that would create an unresolved participant-resolution conflict is rejected before authoritative state changes.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_f6dfe02d56733bc1

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`, `choose_policy`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Games and Results

Should `Games and Results` adopt this change (tighten requirement, choose policy): 10. A playoff correction conflict caused by an authoritative result correction must be resolved in the same administrative action as the correction; otherwise the correction is rejected without mutating authoritative state.

Evidence:
- 10. A playoff correction conflict caused by an authoritative result correction must be resolved in the same administrative action as the correction; otherwise the correction is rejected without mutating authoritative state.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_b494663745cced37

- type: `scope_change`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `scope_change`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings

Should `Standings` adopt this change (tighten requirement, scope change): 8. Exactly one persisted random-draw result may exist for a stable tie context, and duplicate attempts for that tie context must reuse the existing result or be rejected without performing another draw. League Administrators do not replace or override that result in Phase 1.

Evidence:
- 8. Exactly one persisted random-draw result may exist for a stable tie context, and duplicate attempts for that tie context must reuse the existing result or be rejected without performing another draw. League Administrators do not replace or override that result in Phase 1.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_5192111936c3ec16

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Playoffs

Should `Playoffs` adopt this change (tighten requirement, choose policy): 10. A playoff Matchup with incomplete authoritative Game outcomes must not advance automatically, and an attempted correction that would create an unresolved participant conflict is rejected before authoritative state changes.

Evidence:
- 10. A playoff Matchup with incomplete authoritative Game outcomes must not advance automatically, and an attempted correction that would create an unresolved participant conflict is rejected before authoritative state changes.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_459efa1c71a33e2f

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`, `scope_change`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Standings Configuration

Should `Standings Configuration` adopt this change (tighten requirement, choose policy, scope change): The stable tie-context identity is composed of the Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and the equal preceding criterion values. Canonical identity order is the ascending order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created, compared by normalized codepoint order. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context return the existing result. Attempting to create a second result for the same tie context is rejected as a deterministic conflict and must not perform another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

Evidence:
- The stable tie-context identity is composed of the Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and the equal preceding criterion values. Canonical identity order is the ascending order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created, compared by normalized codepoint order. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context return the existing result. Attempting to create a second result for the same tie context is rejected as a deterministic conflict and must not perform another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_2e90b2c3c654e99c

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`, `scope_change`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authorization Configuration

Should `Authorization Configuration` adopt this change (choose policy, scope change): League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, and playoff correction conflict resolution. Persisted random-draw duplicate or conflict attempts are handled only by deterministic reuse or rejection under the stable tie-context rule; League Administrators do not replace or override an existing draw result in Phase 1. Team Captain authority is a scoped role marker in Phase 1 and does not add independent mutation permissions unless a later accepted specification defines them. Adding roles or changing their authority requires an accepted specification update.

Evidence:
- League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, and playoff correction conflict resolution. Persisted random-draw duplicate or conflict attempts are handled only by deterministic reuse or rejection under the stable tie-context rule; League Administrators do not replace or override an existing draw result in Phase 1. Team Captain authority is a scoped role marker in Phase 1 and does not add independent mutation permissions unless a later accepted specification defines them. Adding roles or changing their authority requires an accepted specification update.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.
