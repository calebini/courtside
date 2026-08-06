# Decision Summary

- source_register_path: `/Users/Shared/Agent-Workspace/repos/personal/courtside/whetstone_runs/core-domain-phase1-001/rounds/decision_register.json`
- mode: `end_of_cycle`
- terminal_state: `TARGET_NOT_REACHED`
- decision_count: `148`
- decision_status_counts: `deferred_scope_decision`=42, `operator_review_recommended`=106
- unresolved_human_decision_count: `148`
- summary_method: `mechanical_v1`

## Hotspots

### Largest Clusters

- `by_trigger_type` / `choose_policy`: 112 decisions, 112 human decisions
- `by_round_profile` / `round-27 / vertical`: 58 decisions, 58 human decisions
- `by_trigger_type` / `tighten_requirement`: 52 decisions, 52 human decisions
- `by_trigger_type` / `scope_change`: 49 decisions, 49 human decisions
- `by_trigger_type` / `relax_requirement`: 31 decisions, 31 human decisions

### Human Decision Clusters

- `by_trigger_type` / `choose_policy`: 112 decisions, 112 human decisions
- `by_round_profile` / `round-27 / vertical`: 58 decisions, 58 human decisions
- `by_trigger_type` / `tighten_requirement`: 52 decisions, 52 human decisions
- `by_trigger_type` / `scope_change`: 49 decisions, 49 human decisions
- `by_trigger_type` / `relax_requirement`: 31 decisions, 31 human decisions

## By Section

### Audit Configuration

- decisions: `4`
- human decisions: `4`
- status_counts: `deferred_scope_decision`=3, `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `20`, `24`, `27`
- profiles: `vertical`
- sections: `Audit Configuration`
- decision_ids: `dec_b4a9722339a0e68d`, `dec_8f64646be1cd8e18`, `dec_3ceac5fb3954e5c5`, `dec_8268f7ae6be83018`

Representative decisions:
- `dec_b4a9722339a0e68d`: Should `Audit Configuration` adopt this change (tighten requirement, choose policy): An Audit Record for a playoff correction conflict resolution must include the resolution type, affected participant slots, conflicted downstream authoritative Games, resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff.
- `dec_8f64646be1cd8e18`: Should `Audit Configuration` adopt this change (tighten requirement, choose policy): An Audit Record for a playoff correction conflict resolution must include the resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff.
- `dec_3ceac5fb3954e5c5`: Should `Audit Configuration` adopt this change (choose policy): Audit Records contain actor, timestamp, action, previous value, new value, and reason, with reason optional unless otherwise required. Auditing is mandatory for finalized or forfeited Game-result corrections with a required reason, material Player-stat changes, Roster Membership changes, Player Management Relationship approvals and revocations, League Administrator and Team Captain assignment changes, frozen Season configuration amendments, persisted random-draw tiebreak results, playoff correction conflict resolutions, and scheduling changes unless required scheduling-change history is preserved outside Audit Records.

### Authoritative Result Corrections

- decisions: `13`
- human decisions: `13`
- status_counts: `deferred_scope_decision`=8, `operator_review_recommended`=5
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `relax_requirement`, `tighten_requirement`
- rounds: `4`, `8`, `20`, `24`, `27`
- profiles: `vertical`
- sections: `Authoritative Result Corrections`
- decision_ids: `dec_adfe7e24ceda396d`, `dec_e3d1365932d05380`, `dec_ebf9e410b03355f3`, `dec_ef2058ac05f6b76e`, `dec_713b3bb41c4eb557`, `dec_d1a2e298829a73d3`, `dec_9436dc1608134290`, `dec_a76f9b5b75bc904a`, `dec_516b588d462bd569`, `dec_1e2559ba477ee435`, `dec_92794fba7f147b6f`, `dec_a0aa4c7dac9b3593`, `dec_abc77c2fc002ea5a`

Representative decisions:
- `dec_adfe7e24ceda396d`: Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The resolution report must identify the corrected Game, the affected Matchups and participant slots, downstream authoritative Games that create the conflict, the recalculated participant that would have advanced, the participant currently present downstream, and the League Administrator actor and reason. The permitted resolutions are:
- `dec_e3d1365932d05380`: Should `Authoritative Result Corrections` adopt this change (choose policy): apply the correction and halt affected downstream advancement until replacement authoritative outcomes are recorded under the corrected bracket participants; or
- `dec_ebf9e410b03355f3`: Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): If a correction would change a playoff participant after downstream Games already have authoritative outcomes, automated destructive propagation is prohibited. The correction must either be rejected before it is recorded or recorded with an explicit League Administrator resolution in the same administrative action. Until that resolution is recorded, affected playoff advancement projections are blocked from further automatic advancement, while existing downstream authoritative Game records remain historically visible and are not silently changed.

### Authority and Precedence

- decisions: `4`
- human decisions: `4`
- status_counts: `operator_review_recommended`=4
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`
- trigger_types: `choose_policy`, `scope_change`
- rounds: `12`, `16`, `27`
- profiles: `vertical`
- sections: `Authority and Precedence`
- decision_ids: `dec_74614ad29be05e35`, `dec_569730ddc780404e`, `dec_41b071ad77b05935`, `dec_4688de2322bf9acf`

Representative decisions:
- `dec_74614ad29be05e35`: Should `Authority and Precedence` adopt this change (choose policy): More specific values override less specific values only where this specification permits customization. The first accepted authoritative Season Game outcome freezes all result-affecting values into a single versioned Season snapshot. Later, retried, or concurrent authoritative outcome transitions for that Season reuse the existing snapshot or are rejected under the lifecycle freeze rule when they depend on a different mutable configuration basis.
- `dec_569730ddc780404e`: Should `Authority and Precedence` adopt this change (choose policy, scope change): The result-affecting configuration basis identity used for concurrent or retried first-freeze comparison is the canonical content identity of the values that would be captured in the frozen Season configuration version. It covers standings point values, ordered ranking criteria, eligible Game phase and status rules, standings adjustment enablement, forfeit treatment, playoff Round identities and order, participant slot sources, configured Games per Matchup, advancement rule, aggregate-tiebreak policies, and any later accepted result-affecting field. It excludes timezone, localization, Venue, Media, display text, and other non-result-affecting values. Equal basis identities reuse the existing frozen version. Unequal basis identities are rejected without mutating authoritative state, persisted projections, or configuration versions.
- `dec_41b071ad77b05935`: Should `Authority and Precedence` adopt this change (choose policy): Configuration resolves from normative Courtside defaults to League configuration to Season overrides to frozen Season configuration version. More specific values override less specific values only where permitted. The first accepted authoritative Season Game outcome freezes all result-affecting values into a single versioned Season snapshot. Later, retried, or concurrent authoritative outcome transitions reuse the existing snapshot or are rejected under the lifecycle freeze rule when they depend on a different mutable configuration basis.

### Authorization

- decisions: `14`
- human decisions: `14`
- status_counts: `deferred_scope_decision`=2, `operator_review_recommended`=12
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `4`, `12`, `16`, `27`
- profiles: `vertical`
- sections: `Authorization`
- decision_ids: `dec_3f59aa530e1c9997`, `dec_5350d9cd676ffb78`, `dec_728fe2ccd155a4c8`, `dec_751927cc413ce89d`, `dec_929baca54335cbcb`, `dec_0d2360f616cc1584`, `dec_2100b8f8b24c5dfd`, `dec_216b43e10fb3bf52`, `dec_51ee2970000a365c`, `dec_59f23e80802e9100`, `dec_72579a9b35b52a5b`, `dec_7974eebca254b065`, `dec_81bd72cf13dc8659`, `dec_2f97c94273574cc2`

Representative decisions:
- `dec_3f59aa530e1c9997`: Should `Authorization` adopt this change (scope change): 6. Role and management-relationship changes are audited.
- `dec_5350d9cd676ffb78`: Should `Authorization` adopt this change (choose policy): 7. Unauthorized mutation attempts and lifecycle transitions not explicitly permitted by the lifecycle specification are rejected without mutating authoritative state.
- `dec_728fe2ccd155a4c8`: Should `Authorization` adopt this change (choose policy, scope change): 4. An approved Player Management Relationship grants Player-profile management authority only; it does not grant authority over rosters, Game outcomes, standings, playoff advancement, Season configuration, or role assignment.

### Authorization Configuration

- decisions: `4`
- human decisions: `4`
- status_counts: `operator_review_recommended`=4
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `scope_change`
- rounds: `4`, `8`, `16`, `27`
- profiles: `vertical`
- sections: `Authorization Configuration`
- decision_ids: `dec_fa4a5c2f87a82db1`, `dec_2e90b2c3c654e99c`, `dec_a9fc4e431b1e9aed`, `dec_f30555fee78e6f96`

Representative decisions:
- `dec_fa4a5c2f87a82db1`: Should `Authorization Configuration` adopt this change (choose policy, scope change): League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, persisted random-draw conflict resolution, and playoff correction conflict resolution. Team Captain authority is a scoped role marker in Phase 1 and does not add independent mutation permissions unless a later accepted specification defines them. Adding roles or changing their authority requires an accepted specification update.
- `dec_2e90b2c3c654e99c`: Should `Authorization Configuration` adopt this change (choose policy, scope change): League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, and playoff correction conflict resolution. Persisted random-draw duplicate or conflict attempts are handled only by deterministic reuse or rejection under the stable tie-context rule; League Administrators do not replace or override an existing draw result in Phase 1. Team Captain authority is a scoped role marker in Phase 1 and does not add independent mutation permissions unless a later accepted specification defines them. Adding roles or changing their authority requires an accepted specification update.
- `dec_a9fc4e431b1e9aed`: Should `Authorization Configuration` adopt this change (choose policy, scope change): After the initial League Administrator bootstrap boundary for a League, existing League Administrators assign, reassign, and revoke League Administrator authority for that League. The bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority. League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, and playoff correction conflict resolution. Persisted random-draw duplicate or conflict attempts are handled only by deterministic reuse or rejection under the stable tie-context rule; League Administrators do not replace or override an existing draw result in Phase 1. Team Captain authority is a scoped role marker in Phase 1 and does not add independent mutation permissions unless a later accepted specification defines them. Adding roles or changing their authority requires an accepted specification update.

### Canonical Concepts

- decisions: `11`
- human decisions: `11`
- status_counts: `operator_review_recommended`=11
- actions: `present_at_end`
- decision_types: `choose_policy`, `relax_requirement`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`
- rounds: `27`
- profiles: `vertical`
- sections: `Canonical Concepts`
- decision_ids: `dec_1b1190d519c43c31`, `dec_21c8f8ee70400aae`, `dec_233f440fa0402886`, `dec_73a9a1b358d1a43f`, `dec_7caaab7d32d5f362`, `dec_7d7f27eaf1ca4872`, `dec_993e865475feb19f`, `dec_c23fa46dd589ad5f`, `dec_c7a57eab7a1e7a4a`, `dec_e4cc29e2eea3d908`, `dec_ee02027686c6dbb2`

Representative decisions:
- `dec_1b1190d519c43c31`: Should `Canonical Concepts` adopt this change (relax requirement): Media are optional photo records or YouTube links. The same Media item may be associated with Games, the League Gallery, or both. Association is independent of Media identity.
- `dec_21c8f8ee70400aae`: Should `Canonical Concepts` adopt this change (choose policy): Team Statistics are derived Season-Team performance calculated from authoritative Game results and, where explicitly needed, aggregated Player Stat Lines. The authoritative Game score remains the source for points for, points against, and result-based standings calculations.
- `dec_233f440fa0402886`: Should `Canonical Concepts` adopt this change (choose policy, scope change): A League is the persistent organization that owns seasons, league defaults, supported languages, the league timezone, administrator assignments, venues, and the league gallery. Courtside currently assumes one organizational league boundary; cross-league identity and competition are out of scope.

### Competition Transitions

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `relax_requirement`
- trigger_types: `relax_requirement`
- rounds: `20`
- profiles: `vertical`
- sections: `Competition Transitions`
- decision_ids: `dec_cddefa59eaccf28d`

Representative decisions:
- `dec_cddefa59eaccf28d`: Should `Competition Transitions` adopt this change (relax requirement): A Game may become `forfeit` only from `scheduled`, `postponed`, or `in_progress`, and only with an explicit winning team and an official non-tied score. That official score is the source for standings and aggregate calculations.

### Configuration and Reproducibility

- decisions: `9`
- human decisions: `9`
- status_counts: `deferred_scope_decision`=1, `operator_review_recommended`=8
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `12`, `16`, `20`, `27`
- profiles: `vertical`
- sections: `Configuration and Reproducibility`
- decision_ids: `dec_a6bce6501c4fe7b3`, `dec_b570408d2fccb971`, `dec_ce15ed7a376afce9`, `dec_050796bb6761ba78`, `dec_38d7db1a1edb11db`, `dec_6a08adb38bd15f72`, `dec_95261629f7294b5b`, `dec_b01a5bdacdba2fe8`, `dec_db34c54671a2d83b`

Representative decisions:
- `dec_a6bce6501c4fe7b3`: Should `Configuration and Reproducibility` adopt this change (choose policy): 5. Given the same authoritative outcomes, adjustment records, persisted random draws, and configuration version, standings and playoff advancement are deterministic.
- `dec_b570408d2fccb971`: Should `Configuration and Reproducibility` adopt this change (tighten requirement, choose policy): 3. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution.
- `dec_ce15ed7a376afce9`: Should `Configuration and Reproducibility` adopt this change (choose policy): 1. The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes for the same Season reuse that frozen version.

### Consequences

- decisions: `1`
- human decisions: `1`
- status_counts: `deferred_scope_decision`=1
- actions: `present_at_end`
- decision_types: `tighten_requirement`
- trigger_types: `tighten_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Consequences`
- decision_ids: `dec_cc7b04eceedc3ab9`

Representative decisions:
- `dec_cc7b04eceedc3ab9`: Should `Consequences` adopt this change (tighten requirement): Schema and API work must preserve participation history instead of placing a mutable team reference directly on Player. Derived standings and playoff advancement require reproducible configuration versions and audit-aware recomputation. Statistics representations must preserve missingness and verification separately. Playoff Matchups cannot use conventional games-won best-of logic. Interfaces and contracts may be designed later without reopening these concepts unless new requirements create a genuine domain conflict. No implementation, contract, or public protocol directories are created by this decision alone.

### Context

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`
- rounds: `27`
- profiles: `vertical`
- sections: `Context`
- decision_ids: `dec_78fcaf9f0f408a34`

Representative decisions:
- `dec_78fcaf9f0f408a34`: Should `Context` adopt this change (choose policy): Courtside needs a stable conceptual boundary before schema, API, framework, or deployment decisions. Without explicit domain authority, implementations are likely to collapse User Account and Player identity, lose roster history, treat playoff Games as a separate type, make standings depend on incomplete statistics, or encode one League policy as inflexible implementation rules.

### Core Mutation Authority

- decisions: `10`
- human decisions: `10`
- status_counts: `operator_review_recommended`=10
- actions: `present_at_end`
- decision_types: `choose_policy`, `relax_requirement`, `scope_change`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`
- rounds: `4`, `16`, `27`
- profiles: `vertical`
- sections: `Core Mutation Authority`
- decision_ids: `dec_2347ff3d284afab8`, `dec_3c65d8a820455ea4`, `dec_4d7a169b05856c47`, `dec_5e02c6ab62f54659`, `dec_98d1bf2436af91b4`, `dec_bb050da881095598`, `dec_d2d016e14e3a8cff`, `dec_7f0493aed90b8c71`, `dec_834c1d37698f3552`, `dec_31e785e1443daa6b`

Representative decisions:
- `dec_2347ff3d284afab8`: Should `Core Mutation Authority` adopt this change (relax requirement, scope change): League Administrators may create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke role assignments; amend frozen Season configuration; and resolve playoff correction conflicts.
- `dec_3c65d8a820455ea4`: Should `Core Mutation Authority` adopt this change (choose policy): Mutation authority is evaluated at the time the mutation is requested and is scoped to the League, Season, Season Team, Player, or Game named by the affected record.
- `dec_4d7a169b05856c47`: Should `Core Mutation Authority` adopt this change (scope change): Team Captain assignments are scoped to one Season Team and are auditable role assignments. In Phase 1 they do not independently authorize core domain mutations unless a later accepted specification grants a specific Team Captain permission.

### Courtside Core Domain — Isolated Phase 1.01 Composite

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`
- rounds: `4`
- profiles: `vertical`
- sections: `Courtside Core Domain — Isolated Phase 1.01 Composite`
- decision_ids: `dec_63706f5931ad6c73`

Representative decisions:
- `dec_63706f5931ad6c73`: Should `Courtside Core Domain — Isolated Phase 1.01 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.01 Composite

### Courtside Core Domain — Isolated Phase 1.02 Composite

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`
- rounds: `8`
- profiles: `vertical`
- sections: `Courtside Core Domain — Isolated Phase 1.02 Composite`
- decision_ids: `dec_98fe0bad87fd75d5`

Representative decisions:
- `dec_98fe0bad87fd75d5`: Should `Courtside Core Domain — Isolated Phase 1.02 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.02 Composite

### Courtside Core Domain — Isolated Phase 1.03 Composite

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`
- rounds: `12`
- profiles: `vertical`
- sections: `Courtside Core Domain — Isolated Phase 1.03 Composite`
- decision_ids: `dec_301afd202ce14c37`

Representative decisions:
- `dec_301afd202ce14c37`: Should `Courtside Core Domain — Isolated Phase 1.03 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.03 Composite

### Courtside Core Domain — Isolated Phase 1.04 Composite

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`
- rounds: `16`
- profiles: `vertical`
- sections: `Courtside Core Domain — Isolated Phase 1.04 Composite`
- decision_ids: `dec_1289e4edc3fe5f82`

Representative decisions:
- `dec_1289e4edc3fe5f82`: Should `Courtside Core Domain — Isolated Phase 1.04 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.04 Composite

### Courtside Core Domain — Isolated Phase 1.05 Composite

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`
- rounds: `20`
- profiles: `vertical`
- sections: `Courtside Core Domain — Isolated Phase 1.05 Composite`
- decision_ids: `dec_57ae79b979531725`

Representative decisions:
- `dec_57ae79b979531725`: Should `Courtside Core Domain — Isolated Phase 1.05 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.05 Composite

### Courtside Core Domain — Isolated Phase 1.06 Composite

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`
- rounds: `24`
- profiles: `vertical`
- sections: `Courtside Core Domain — Isolated Phase 1.06 Composite`
- decision_ids: `dec_7702e5cdcee83f8a`

Representative decisions:
- `dec_7702e5cdcee83f8a`: Should `Courtside Core Domain — Isolated Phase 1.06 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.06 Composite

### Courtside Core Domain — Isolated Phase 1.07 Composite

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`
- rounds: `27`
- profiles: `vertical`
- sections: `Courtside Core Domain — Isolated Phase 1.07 Composite`
- decision_ids: `dec_d201dd7c6ac97aa9`

Representative decisions:
- `dec_d201dd7c6ac97aa9`: Should `Courtside Core Domain — Isolated Phase 1.07 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.07 Composite

### Decision

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `relax_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Decision`
- decision_ids: `dec_e3b69a9b03c8dbb0`

Representative decisions:
- `dec_e3b69a9b03c8dbb0`: Should `Decision` adopt this change (relax requirement, choose policy): Adopt the domain defined by overview, lifecycle, invariants, and configuration. The ratified direction is that Season is the competition container while Team and Player identities persist across Seasons; Season Team and Roster Membership preserve Season participation and transfers historically; User Account and Player remain separate and connected through many-to-many approved management relationships; League Administrator authority persists across Seasons; Team Captain authority is scoped to one Season Team; Games use `scheduled`, `postponed`, `cancelled`, `in_progress`, `final`, and `forfeit`; tied authoritative outcomes are prohibited; League Administrators may correct authoritative outcomes with append-only audit and mandatory reason; Player-stat values distinguish unknown from known zero and may be partial and independently provisional or confirmed; standings derive from authoritative regular-season results under customizable versioned configuration; playoffs use fixed aggregate-points brackets with configurable aggregate-tiebreak defaulting to overtime in the final configured Game; result-affecting Season configuration freezes at first final or forfeited Game and changes only by versioned audited League Administrator amendment; the League owns timezone, reusable Venues, English/French language configuration, default language, localizable UI and authored content, and reusable Media identity; and material administrative changes use the minimum audit fields defined in configuration.

### Derived Data Authority

- decisions: `1`
- human decisions: `1`
- status_counts: `deferred_scope_decision`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Derived Data Authority`
- decision_ids: `dec_1d333a5e351e0251`

Representative decisions:
- `dec_1d333a5e351e0251`: Should `Derived Data Authority` adopt this change (tighten requirement, choose policy): Authoritative Game outcomes produce regular-season standings, Season-Team result statistics, playoff aggregate scores, and playoff advancement. Player Stat Lines produce Player game logs and optional detailed Team Statistics. Player-stat availability or completeness must never block an authoritative Game result, standings recomputation, or playoff advancement.

### Game Lifecycle

- decisions: `3`
- human decisions: `3`
- status_counts: `deferred_scope_decision`=1, `operator_review_recommended`=2
- actions: `present_at_end`
- decision_types: `choose_policy`, `tighten_requirement`
- trigger_types: `choose_policy`, `relax_requirement`, `tighten_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Game Lifecycle`
- decision_ids: `dec_bf1befb86a6670c6`, `dec_e2a867e67a37d697`, `dec_e6e6ff3034e7a16a`

Representative decisions:
- `dec_bf1befb86a6670c6`: Should `Game Lifecycle` adopt this change (relax requirement, choose policy): A new Game begins as `scheduled`. A `scheduled` Game may become `postponed`, `cancelled`, `in_progress`, or `forfeit`. A `postponed` Game may return to `scheduled` with a revised scheduled instant, become `cancelled`, or become `forfeit`. A `cancelled` Game has no authoritative competitive outcome and does not affect standings or playoff aggregates. `cancelled` is terminal and replacement competition requires a new or separately scheduled Game.
- `dec_e2a867e67a37d697`: Should `Game Lifecycle` adopt this change (tighten requirement): Every scheduled instant is interpreted in the League configured IANA timezone and stored as an unambiguous instant. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history.
- `dec_e6e6ff3034e7a16a`: Should `Game Lifecycle` adopt this change (relax requirement, choose policy): An `in_progress` Game may become `final` after an authoritative non-tied score is recorded. An `in_progress` Game tied at the end of regulation continues through overtime until one team wins. A Game may become `forfeit` only from `scheduled`, `postponed`, or `in_progress`, and only with an explicit winning team and official non-tied score. `final` and `forfeit` are authoritative terminal outcome statuses and do not return to prior statuses. Detailed Player statistics are not required for `final` or `forfeit`.

### Game and Venue Configuration

- decisions: `1`
- human decisions: `1`
- status_counts: `deferred_scope_decision`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`, `tighten_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Game and Venue Configuration`
- decision_ids: `dec_a6e27170d78207e2`

Representative decisions:
- `dec_a6e27170d78207e2`: Should `Game and Venue Configuration` adopt this change (tighten requirement, scope change): Every Game has scheduled instant, home and away Season Teams, competition phase, optional Venue reference, and optional Game-specific venue instructions. Every Venue has stable League-local identity, name, address, and optional notes. The League timezone supplies scheduling interpretation for administrative entry and default display. Stored scheduled instants must remain unambiguous across daylight-saving transitions.

### Games and Results

- decisions: `4`
- human decisions: `4`
- status_counts: `deferred_scope_decision`=1, `operator_review_recommended`=3
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `4`, `8`, `20`, `27`
- profiles: `vertical`
- sections: `Games and Results`
- decision_ids: `dec_1631d54f6cb8351b`, `dec_f6dfe02d56733bc1`, `dec_3fe36ccbd7d86bf0`, `dec_ddf4666079bc289c`

Representative decisions:
- `dec_1631d54f6cb8351b`: Should `Games and Results` adopt this change (relax requirement, choose policy): 9. `cancelled`, `final`, and `forfeit` Game statuses are terminal lifecycle states, except that authoritative result corrections may modify the score or declared winner of `final` or `forfeit` Games while preserving status.
- `dec_f6dfe02d56733bc1`: Should `Games and Results` adopt this change (tighten requirement, choose policy): 10. A playoff correction conflict caused by an authoritative result correction must be resolved in the same administrative action as the correction; otherwise the correction is rejected without mutating authoritative state.
- `dec_3fe36ccbd7d86bf0`: Should `Games and Results` adopt this change (choose policy): 12. An accepted halted playoff correction resolution makes affected slots or Matchups halted in the current projection, excludes conflicted downstream authoritative Games from current corrected-path advancement calculations while preserving them historically, and resumes only when replacement authoritative outcomes exist under the corrected bracket participants.

### General Lifecycle Failure Rule

- decisions: `4`
- human decisions: `4`
- status_counts: `deferred_scope_decision`=4
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `scope_change`, `tighten_requirement`
- rounds: `4`, `8`, `12`, `27`
- profiles: `vertical`
- sections: `General Lifecycle Failure Rule`
- decision_ids: `dec_21dcea43c59badc0`, `dec_0462ed3015c05d71`, `dec_b43483a0db72b5f3`, `dec_016bff0074ce8689`

Representative decisions:
- `dec_21dcea43c59badc0`: Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, the current state or condition, the requested state or mutation, the actor, and the violated lifecycle rule. Auditing rejected attempts is not required by this Phase 1 domain specification unless the audit policy for that surface explicitly requires it.
- `dec_0462ed3015c05d71`: Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): In-scope invariant and configuration validation failures are rejected under the same preserve-state rule. The rejection report must identify the affected entity or configuration surface, the submitted value or attempted mutation, the actor when applicable, the violated invariant or configuration rule, and confirm that existing authoritative records, persisted projections, and configuration versions remain unchanged.
- `dec_b43483a0db72b5f3`: Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): Authorization failures are rejected under the same preserve-state reporting semantics. The rejection report must identify the actor, affected League, Season, Season Team, Player, or Game scope when applicable, attempted mutation, missing or insufficient authority, violated authority rule, and confirmation that authoritative state and derived projections remain unchanged.

### Identity and Participation

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `relax_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Identity and Participation`
- decision_ids: `dec_bb05508557ae8b78`

Representative decisions:
- `dec_bb05508557ae8b78`: Should `Identity and Participation` adopt this change (relax requirement, choose policy): A User Account and Player are distinct. A Player exists independently of User Accounts and team participation. A Team persists independently of any one Season. Season-specific roster, captain authority, Games, and performance attach to Season Team rather than directly to Team. At most one Season Team connects the same Team and Season. A Player may not have overlapping effective Roster Memberships for different Season Teams in the same Season. Transfers preserve historical membership, Game, and Player Stat Line attribution. A User Account may manage a Player only through an approved Player Management Relationship. Player management is many-to-many. Player Stat Line eligibility is evaluated against the Game competition eligibility anchor, and later scheduling, finalization, forfeiture, or result correction does not change historical attribution.

### Localization Configuration

- decisions: `1`
- human decisions: `1`
- status_counts: `deferred_scope_decision`=1
- actions: `present_at_end`
- decision_types: `tighten_requirement`
- trigger_types: `tighten_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Localization Configuration`
- decision_ids: `dec_9c31880bfb5e6a3a`

Representative decisions:
- `dec_9c31880bfb5e6a3a`: Should `Localization Configuration` adopt this change (tighten requirement): Language selection follows saved supported User Account preference, then League default language. If requested authored-content translation is missing, Courtside renders the League-default variant. UI and authored content must be capable of English and French variants. Proper names are stored and rendered without automatic translation. Concrete storage and editorial workflow are deferred.

### Player Management Lifecycle

- decisions: `4`
- human decisions: `4`
- status_counts: `operator_review_recommended`=4
- actions: `present_at_end`
- decision_types: `choose_policy`, `relax_requirement`
- trigger_types: `choose_policy`, `relax_requirement`
- rounds: `8`, `27`
- profiles: `vertical`
- sections: `Player Management Lifecycle`
- decision_ids: `dec_0fca561d8be8427a`, `dec_4502eaeec3bc9713`, `dec_6acbf05b63785080`, `dec_3e35e95dca57c5be`

Representative decisions:
- `dec_0fca561d8be8427a`: Should `Player Management Lifecycle` adopt this change (relax requirement): A User Account may create a `requested` relationship for itself and a Player.
- `dec_4502eaeec3bc9713`: Should `Player Management Lifecycle` adopt this change (choose policy): Duplicate active `requested` or `approved` relationships for the same User Account and Player are rejected without mutating authoritative state.
- `dec_6acbf05b63785080`: Should `Player Management Lifecycle` adopt this change (relax requirement): A League Administrator may create a `requested` relationship on behalf of a User Account and Player, or create and approve the relationship in one audited administrative action.

### Player Stat Line Lifecycle

- decisions: `2`
- human decisions: `2`
- status_counts: `operator_review_recommended`=2
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `relax_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Player Stat Line Lifecycle`
- decision_ids: `dec_56bd5f6e7c4cb3bf`, `dec_f0d2929ab27dfe8a`

Representative decisions:
- `dec_56bd5f6e7c4cb3bf`: Should `Player Stat Line Lifecycle` adopt this change (choose policy): Each statistical value is either known, including known zero, or unknown because it has not been recorded. Human-readable completeness labels are derived from which expected values are known and are not substitutes for field-level known/unknown state. Adding later details does not change Game-result authority. Material stat changes are audited with actor, timestamp, action, previous value, new value, and optional reason.
- `dec_f0d2929ab27dfe8a`: Should `Player Stat Line Lifecycle` adopt this change (relax requirement, choose policy): Verification and completeness are independent. A Player Stat Line may be created or updated as `provisional` before or after the Game result becomes authoritative. A line becomes `confirmed` when its currently known values have been verified. A confirmed line may remain partial. Updating a confirmed value returns the changed line to `provisional` unless the same authorized action explicitly verifies the replacement. `confirmed` is not terminal; the only permitted post-confirmation mutation is an authorized value update that returns the changed line to `provisional` unless explicitly verified in the same action.

### Player Statistics

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `relax_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Player Statistics`
- decision_ids: `dec_41c00c4f67676ca3`

Representative decisions:
- `dec_41c00c4f67676ca3`: Should `Player Statistics` adopt this change (relax requirement, choose policy): A Player Stat Line belongs to exactly one Game, Player, and Roster Membership establishing eligibility. Unknown and known zero are distinct. Completeness and verification are independent. A Game result may become authoritative while Player Stat Lines are absent, provisional, partial, or unknown. Player-stat completeness never affects standings eligibility or playoff advancement. Team points for, points against, and result-derived Team Statistics use authoritative Game score, not the sum of Player Stat Lines. Corrected confirmed statistics return to provisional unless the replacement is explicitly verified in the same authorized action.

### Playoff Configuration

- decisions: `2`
- human decisions: `2`
- status_counts: `operator_review_recommended`=2
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `12`, `27`
- profiles: `vertical`
- sections: `Playoff Configuration`
- decision_ids: `dec_b7ed569df9de0b5a`, `dec_09a42416211ed2d8`

Representative decisions:
- `dec_b7ed569df9de0b5a`: Should `Playoff Configuration` adopt this change (choose policy): Round structure and policies become part of the frozen result-affecting Season configuration. After dependent authoritative playoff Games exist, amendments to Round structure, configured Games per Matchup, slot sources, advancement rule, or aggregate-tiebreak policy are subject to the frozen configuration amendment legality rule in `lifecycle.md`.
- `dec_09a42416211ed2d8`: Should `Playoff Configuration` adopt this change (tighten requirement, choose policy): Playoff structure is configurable per Round. Each Round defines stable Round identity and display order, fixed input slots from seeds or named prior-Matchup winners, number of Games in each Matchup, `aggregate_points` as advancement rule, and aggregate-tiebreak policy. Example Game counts are illustrative only. Every Season must provide actual Round list and Game count for each Round. `overtime` is the normative default aggregate-tiebreak policy and continues the final configured Game after regulation until the Matchup aggregate is no longer tied. Unknown policies are rejected rather than silently falling back. Round structure and policies are result-affecting frozen configuration and are subject to frozen amendment legality after dependent authoritative playoff Games exist.

### Playoff Matchup Lifecycle

- decisions: `3`
- human decisions: `3`
- status_counts: `deferred_scope_decision`=3
- actions: `present_at_end`
- decision_types: `choose_policy`, `tighten_requirement`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `4`, `8`, `27`
- profiles: `vertical`
- sections: `Playoff Matchup Lifecycle`
- decision_ids: `dec_274d60155ff4d68d`, `dec_259578897028488c`, `dec_edad99bdd70c5c97`

Representative decisions:
- `dec_274d60155ff4d68d`: Should `Playoff Matchup Lifecycle` adopt this change (tighten requirement): Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, an unknown tiebreak policy, or a blocked participant-resolution conflict must not advance automatically and must report the violated rule.
- `dec_259578897028488c`: Should `Playoff Matchup Lifecycle` adopt this change (tighten requirement, choose policy): Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, or an unknown tiebreak policy must not advance automatically and must report the violated rule. An attempted correction that would create an unresolved participant-resolution conflict is rejected before authoritative state changes.
- `dec_edad99bdd70c5c97`: Should `Playoff Matchup Lifecycle` adopt this change (tighten requirement, choose policy): Initial fixed-bracket Matchup slots resolve from configured Season seeds. Later Matchup slots resolve from winners of named prior Matchups. A Matchup contains the number of Games configured for its Round, and every configured Game must reach `final` or `forfeit` before normal advancement. The Matchup aggregate is the sum of authoritative scores. The team with greater aggregate advances through the fixed bracket. If aggregate scores are tied at the end of regulation in the final configured Game, that Game continues into aggregate-tiebreak overtime until the aggregate tie is broken, even when the regulation score of that individual Game was not tied. Overtime points remain part of the final Game score and therefore the Matchup aggregate. Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, or unknown tiebreak policy must not advance automatically and must report the violated rule.

### Playoffs

- decisions: `5`
- human decisions: `5`
- status_counts: `deferred_scope_decision`=3, `operator_review_recommended`=2
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `4`, `8`, `20`, `24`, `27`
- profiles: `vertical`
- sections: `Playoffs`
- decision_ids: `dec_89c222d2f6d01a99`, `dec_5192111936c3ec16`, `dec_1d890fe73d53f25f`, `dec_1ed80b2032539eb6`, `dec_0b488265a1c8a003`

Representative decisions:
- `dec_89c222d2f6d01a99`: Should `Playoffs` adopt this change (tighten requirement, choose policy): 10. A playoff Matchup with incomplete authoritative Game outcomes or an unresolved participant conflict must not advance automatically.
- `dec_5192111936c3ec16`: Should `Playoffs` adopt this change (tighten requirement, choose policy): 10. A playoff Matchup with incomplete authoritative Game outcomes must not advance automatically, and an attempted correction that would create an unresolved participant conflict is rejected before authoritative state changes.
- `dec_1d890fe73d53f25f`: Should `Playoffs` adopt this change (choose policy): 11. Accepted correction resolutions that halt advancement are deterministic by their resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy the resume condition.

### Role Assignment

- decisions: `3`
- human decisions: `3`
- status_counts: `operator_review_recommended`=3
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `scope_change`
- rounds: `4`, `16`
- profiles: `vertical`
- sections: `Role Assignment`
- decision_ids: `dec_592757927bd6b275`, `dec_61623aefa2b99397`, `dec_b7a3417059b45745`

Representative decisions:
- `dec_592757927bd6b275`: Should `Role Assignment` adopt this change (choose policy, scope change): For Phase 1, Team Captain is a scoped domain authority marker. It does not by itself grant independent authority over Game outcomes, rosters, Player Stat Lines, Player Management approvals, Season configuration amendments, or playoff conflict resolution unless a later accepted specification grants that authority.
- `dec_61623aefa2b99397`: Should `Role Assignment` adopt this change (choose policy, scope change): the initial League Administrator bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority; and
- `dec_b7a3417059b45745`: Should `Role Assignment` adopt this change (choose policy): after the initial League Administrator bootstrap boundary for a League, an existing League Administrator assigns, reassigns, and revokes League Administrator assignments for that League;

### Role Assignment Lifecycle

- decisions: `4`
- human decisions: `4`
- status_counts: `operator_review_recommended`=4
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `scope_change`
- rounds: `4`, `16`, `27`
- profiles: `vertical`
- sections: `Role Assignment Lifecycle`
- decision_ids: `dec_1039e8c0a2f9f9e5`, `dec_493d6f1cb3f0d122`, `dec_df864f80e7c88266`, `dec_ada3293270ea9636`

Representative decisions:
- `dec_1039e8c0a2f9f9e5`: Should `Role Assignment Lifecycle` adopt this change (choose policy, scope change): A revoked role assignment is terminal for that assignment. Later authority requires a new assignment or reassignment under League Administrator authority.
- `dec_493d6f1cb3f0d122`: Should `Role Assignment Lifecycle` adopt this change (choose policy, scope change): The initial League Administrator bootstrap boundary is outside Phase 1 domain mutation semantics and cannot be inferred from ordinary role-assignment authority.
- `dec_df864f80e7c88266`: Should `Role Assignment Lifecycle` adopt this change (choose policy): After the initial League Administrator bootstrap boundary for a League, League Administrators assign, reassign, and revoke League Administrator assignments for that League.

### Roster Membership Lifecycle

- decisions: `3`
- human decisions: `3`
- status_counts: `deferred_scope_decision`=1, `operator_review_recommended`=2
- actions: `present_at_end`
- decision_types: `choose_policy`, `tighten_requirement`
- trigger_types: `choose_policy`, `relax_requirement`, `tighten_requirement`
- rounds: `20`, `27`
- profiles: `vertical`
- sections: `Roster Membership Lifecycle`
- decision_ids: `dec_1192d9a364be600d`, `dec_3113aced1852e6de`, `dec_66791f2b4117234a`

Representative decisions:
- `dec_1192d9a364be600d`: Should `Roster Membership Lifecycle` adopt this change (relax requirement, choose policy): A Game evaluates roster eligibility at its competition eligibility anchor. For a Game that enters `in_progress`, the anchor is the first accepted start instant for that Game. For a Game that becomes `forfeit` from `scheduled` or `postponed` without entering `in_progress`, the anchor is the official forfeit decision instant recorded with the forfeiture. A cancelled Game has no competition eligibility anchor for Player Stat Line attribution. Rescheduling or postponement before the anchor may change when the Game is expected to occur, but it does not create Player Stat Line eligibility until the anchor is established. Finalization and later authoritative result corrections do not change the anchor or rewrite existing Player Stat Line attribution. A Player Stat Line is valid only when its referenced Roster Membership was effective for one of the Game's participating Season Teams at the competition eligibility anchor.
- `dec_3113aced1852e6de`: Should `Roster Membership Lifecycle` adopt this change (tighten requirement): A Roster Membership has an effective start and may have an effective end. A Player becomes eligible for a Season Team when a membership becomes effective. A Player may not have overlapping effective memberships for different Season Teams in the same Season. A transfer ends the prior membership before the new membership begins. Ending or transferring a membership does not rewrite eligibility, attribution, or Player Stat Lines for Games played while the prior membership was effective. A Player Stat Line must reference the membership that established eligibility for that Game.
- `dec_66791f2b4117234a`: Should `Roster Membership Lifecycle` adopt this change (relax requirement, choose policy): A Game evaluates roster eligibility at its competition eligibility anchor. For a Game that enters `in_progress`, the anchor is the first accepted start instant. For a Game that becomes `forfeit` from `scheduled` or `postponed` without entering `in_progress`, the anchor is the official forfeit decision instant. A cancelled Game has no competition eligibility anchor for Player Stat Line attribution. Rescheduling or postponement before the anchor may change expected timing but does not create Player Stat Line eligibility. Finalization and later authoritative result corrections do not change the anchor or rewrite attribution. A closed membership interval is terminal; later participation requires a new non-overlapping interval.

### Scheduling Transitions

- decisions: `1`
- human decisions: `1`
- status_counts: `deferred_scope_decision`=1
- actions: `present_at_end`
- decision_types: `tighten_requirement`
- trigger_types: `tighten_requirement`
- rounds: `12`
- profiles: `vertical`
- sections: `Scheduling Transitions`
- decision_ids: `dec_5c2a62f2fd7c92bc`

Representative decisions:
- `dec_5c2a62f2fd7c92bc`: Should `Scheduling Transitions` adopt this change (tighten requirement): Every scheduled instant is interpreted in the League's configured IANA timezone and stored as an unambiguous instant. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history, but it must be available to explain rescheduling, postponement, cancellation, and start transitions.

### Scope

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`
- rounds: `27`
- profiles: `vertical`
- sections: `Scope`
- decision_ids: `dec_6a92420f5c855dd5`

Representative decisions:
- `dec_6a92420f5c855dd5`: Should `Scope` adopt this change (choose policy): Courtside covers persistent league, team, player, and user-account identity; season-specific team participation, rosters, schedules, results, standings, and playoffs; provisional, partial, confirmed, and corrected player game statistics; configurable score-based standings and round-specific playoff series; league-scoped administration and season-team captain authority; simple venues and reusable media associations; English and French user-interface and authored-content localization; and simple audit records for material administrative changes.

### Season Configuration Lifecycle

- decisions: `8`
- human decisions: `8`
- status_counts: `deferred_scope_decision`=1, `operator_review_recommended`=7
- actions: `present_at_end`
- decision_types: `choose_policy`, `relax_requirement`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `12`, `16`, `27`
- profiles: `vertical`
- sections: `Season Configuration Lifecycle`
- decision_ids: `dec_08d324d71c332ba0`, `dec_57aa1f55221f8a3d`, `dec_5bc5102579e48f8f`, `dec_f7d82017388c166c`, `dec_54afa060aa790ad0`, `dec_0c282d54a399f7fa`, `dec_17ad71b967d04589`, `dec_bf806ac6866e705d`

Representative decisions:
- `dec_08d324d71c332ba0`: Should `Season Configuration Lifecycle` adopt this change (tighten requirement, choose policy): 4. If concurrent first-freeze attempts occur, exactly one snapshot creation is accepted. A competing attempt must reuse the created snapshot when it depends on the same result-affecting configuration basis, or be rejected without mutating authoritative state when it depends on a different mutable configuration basis.
- `dec_57aa1f55221f8a3d`: Should `Season Configuration Lifecycle` adopt this change (relax requirement): 6. A League Administrator may amend frozen configuration only by creating a new version and an Audit Record.
- `dec_5bc5102579e48f8f`: Should `Season Configuration Lifecycle` adopt this change (choose policy): After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same action can apply the amendment through the playoff conflict-resolution semantics already required for authoritative result corrections. An amendment action that would change participant slots, Matchup completion, aggregate outcome, or downstream advancement without either preserving the existing authoritative path as an audited administrative exception or halting affected downstream advancement until replacement authoritative outcomes are recorded is rejected without mutating authoritative state.

### Standing Calculations

- decisions: `1`
- human decisions: `1`
- status_counts: `deferred_scope_decision`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Standing Calculations`
- decision_ids: `dec_82954f5240e51c94`

Representative decisions:
- `dec_82954f5240e51c94`: Should `Standing Calculations` adopt this change (tighten requirement, choose policy): For each Season Team under default rules: wins are eligible authoritative Games won; losses are eligible authoritative Games lost; games played equals wins plus losses; league points equal configured win and loss points; points for and against are sums of official eligible Game scores; point differential is points for minus points against; points scored is points for. A forfeit contributes its explicit official score. If standings adjustments are enabled later, each adjustment must be an explicit audited record rather than direct edit to derived standings.

### Standings

- decisions: `3`
- human decisions: `3`
- status_counts: `deferred_scope_decision`=2, `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`, `tighten_requirement`
- trigger_types: `choose_policy`, `scope_change`, `tighten_requirement`
- rounds: `4`, `8`, `27`
- profiles: `vertical`
- sections: `Standings`
- decision_ids: `dec_33a3ef95971c7458`, `dec_b494663745cced37`, `dec_9fdb024ce3ccdb13`

Representative decisions:
- `dec_33a3ef95971c7458`: Should `Standings` adopt this change (tighten requirement): 8. Exactly one persisted random-draw result may exist for a stable tie context, and duplicate attempts for that tie context must reuse the existing result or be rejected without performing another draw.
- `dec_b494663745cced37`: Should `Standings` adopt this change (tighten requirement, scope change): 8. Exactly one persisted random-draw result may exist for a stable tie context, and duplicate attempts for that tie context must reuse the existing result or be rejected without performing another draw. League Administrators do not replace or override that result in Phase 1.
- `dec_9fdb024ce3ccdb13`: Should `Standings` adopt this change (tighten requirement, choose policy): Standings are derived and cannot be directly edited. Only eligible authoritative regular-season Game outcomes and explicit configuration-permitted adjustment records may influence standings. Under defaults, games played equals wins plus losses, league points equal wins times two, and point differential equals points for minus points against. Default descending ranking order is league points, point differential, points scored, then random draw. A loss awards zero League Points. Random draw is used only when all earlier criteria remain tied. A random-draw result is persisted and audited and must not change because standings are viewed or recomputed from unchanged inputs. Exactly one persisted random-draw result may exist for a stable tie context, and duplicates reuse the existing result or are rejected without another draw. A standings projection identifies the frozen Season configuration version used. Playoff Games do not affect regular-season standings.

### Standings Configuration

- decisions: `5`
- human decisions: `5`
- status_counts: `deferred_scope_decision`=2, `operator_review_recommended`=3
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`, `tighten_requirement`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `4`, `8`, `12`, `27`
- profiles: `vertical`
- sections: `Standings Configuration`
- decision_ids: `dec_589c0b19c1436af7`, `dec_459efa1c71a33e2f`, `dec_233fe79790aea2a8`, `dec_bc7ac21acf321e16`, `dec_c1687c53e914cf68`

Representative decisions:
- `dec_589c0b19c1436af7`: Should `Standings Configuration` adopt this change (tighten requirement): The stable tie-context identity is composed of the Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and the equal preceding criterion values. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context return the existing result. Attempting to create a second result for the same tie context is rejected as a deterministic conflict and must not perform another draw.
- `dec_459efa1c71a33e2f`: Should `Standings Configuration` adopt this change (tighten requirement, choose policy, scope change): The stable tie-context identity is composed of the Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and the equal preceding criterion values. Canonical identity order is the ascending order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created, compared by normalized codepoint order. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context return the existing result. Attempting to create a second result for the same tie context is rejected as a deterministic conflict and must not perform another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.
- `dec_233fe79790aea2a8`: Should `Standings Configuration` adopt this change (tighten requirement, choose policy, scope change): The stable tie-context identity is composed of the Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and the equal preceding criterion values. Canonical identity order is the ascending byte order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created. A canonical domain identity used for this ordering must be an ASCII-only opaque identifier, is case-sensitive, and is compared byte-for-byte without locale collation, Unicode normalization, or display-name transformation. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context return the existing result. Attempting to create a second result for the same tie context is rejected as a deterministic conflict and must not perform another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

### Standings Lifecycle

- decisions: `5`
- human decisions: `5`
- status_counts: `deferred_scope_decision`=3, `operator_review_recommended`=2
- actions: `present_at_end`
- decision_types: `choose_policy`, `tighten_requirement`
- trigger_types: `choose_policy`, `scope_change`, `tighten_requirement`
- rounds: `4`, `8`, `12`, `27`
- profiles: `vertical`
- sections: `Standings Lifecycle`
- decision_ids: `dec_5f9f24ee3e2ad848`, `dec_1cc5dd899890c4c3`, `dec_d12db48235ffc659`, `dec_163d4c13c1b24928`, `dec_b7d1799ce16d3307`

Representative decisions:
- `dec_5f9f24ee3e2ad848`: Should `Standings Lifecycle` adopt this change (tighten requirement): A random-draw tie context has a stable identity composed of the Season, the frozen Season configuration version, the ranking step or criterion that invoked `random_draw`, the tied Season Teams in canonical identity order before the draw, and the equal preceding criterion values that made the tie unresolved. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result for the same tie context is rejected as a deterministic conflict without performing another draw.
- `dec_1cc5dd899890c4c3`: Should `Standings Lifecycle` adopt this change (tighten requirement, choose policy, scope change): A random-draw tie context has a stable identity composed of the Season, the frozen Season configuration version, the ranking step or criterion that invoked `random_draw`, the tied Season Teams in canonical identity order before the draw, and the equal preceding criterion values that made the tie unresolved. Canonical identity order is the ascending order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created, compared by normalized codepoint order. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result for the same tie context is rejected as a deterministic conflict without performing another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.
- `dec_d12db48235ffc659`: Should `Standings Lifecycle` adopt this change (tighten requirement, choose policy, scope change): A random-draw tie context has a stable identity composed of the Season, the frozen Season configuration version, the ranking step or criterion that invoked `random_draw`, the tied Season Teams in canonical identity order before the draw, and the equal preceding criterion values that made the tie unresolved. Canonical identity order is the ascending byte order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created. A canonical domain identity used for this ordering must be an ASCII-only opaque identifier, is case-sensitive, and is compared byte-for-byte without locale collation, Unicode normalization, or display-name transformation. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result for the same tie context is rejected as a deterministic conflict without performing another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

### Statistics Configuration

- decisions: `1`
- human decisions: `1`
- status_counts: `deferred_scope_decision`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Statistics Configuration`
- decision_ids: `dec_f7a1fd44aba54ee8`

Representative decisions:
- `dec_f7a1fd44aba54ee8`: Should `Statistics Configuration` adopt this change (tighten requirement, choose policy): The concrete statistic vocabulary is deferred until the initial scorekeeping surface is specified. Any later vocabulary must preserve field-level known versus unknown state, known zero as valid value, line-level provisional or confirmed verification, confirmed partial lines, and independence between Player-stat completeness and Game-result authority. Points may be recorded before other statistics and must not imply unrecorded fields are zero.

### Venues, Media, and Audit

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `relax_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Venues, Media, and Audit`
- decision_ids: `dec_22f7ff6d82c3ed3f`

Representative decisions:
- `dec_22f7ff6d82c3ed3f`: Should `Venues, Media, and Audit` adopt this change (relax requirement, choose policy): A Venue is reusable and League-owned; a Game may reference at most one Venue. A Media item may be associated with a Game, League Gallery, or both without duplicating Media identity. Every material Audit Record contains actor, timestamp, action, previous value, and new value. Audit reasons are optional except for authoritative Game-result corrections, where a reason is mandatory. Audit history is append-only. Required rejection reports identify entity, current state or condition, requested mutation, actor, violated rule, and state-preservation outcome. Accepted playoff correction resolution reports identify halted slots or Matchups, conflicted downstream Games retained as historical records, corrected-path records excluded from current advancement, resume condition, and canonicalized resolution identity used for deterministic retries.

## By Round/Profile

### round-12 / vertical

- decisions: `15`
- human decisions: `15`
- status_counts: `deferred_scope_decision`=5, `operator_review_recommended`=10
- actions: `present_at_end`
- decision_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `12`
- profiles: `vertical`
- sections: `Authority and Precedence`, `Authorization`, `Configuration and Reproducibility`, `Courtside Core Domain — Isolated Phase 1.03 Composite`, `General Lifecycle Failure Rule`, `Playoff Configuration`, `Scheduling Transitions`, `Season Configuration Lifecycle`, `Standings Configuration`, `Standings Lifecycle`
- decision_ids: `dec_08d324d71c332ba0`, `dec_0d2360f616cc1584`, `dec_233fe79790aea2a8`, `dec_301afd202ce14c37`, `dec_57aa1f55221f8a3d`, `dec_5bc5102579e48f8f`, `dec_5c2a62f2fd7c92bc`, `dec_74614ad29be05e35`, `dec_a6bce6501c4fe7b3`, `dec_b43483a0db72b5f3`, `dec_b570408d2fccb971`, `dec_b7ed569df9de0b5a`, `dec_ce15ed7a376afce9`, `dec_d12db48235ffc659`, `dec_f7d82017388c166c`

Representative decisions:
- `dec_08d324d71c332ba0`: Should `Season Configuration Lifecycle` adopt this change (tighten requirement, choose policy): 4. If concurrent first-freeze attempts occur, exactly one snapshot creation is accepted. A competing attempt must reuse the created snapshot when it depends on the same result-affecting configuration basis, or be rejected without mutating authoritative state when it depends on a different mutable configuration basis.
- `dec_0d2360f616cc1584`: Should `Authorization` adopt this change (tighten requirement, choose policy): 7. Unauthorized mutation attempts and lifecycle transitions not explicitly permitted by the lifecycle specification are rejected without mutating authoritative state and must produce the required rejection report.
- `dec_233fe79790aea2a8`: Should `Standings Configuration` adopt this change (tighten requirement, choose policy, scope change): The stable tie-context identity is composed of the Season, frozen Season configuration version, ranking step or criterion, tied Season Team identities in canonical order, and the equal preceding criterion values. Canonical identity order is the ascending byte order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created. A canonical domain identity used for this ordering must be an ASCII-only opaque identifier, is case-sensitive, and is compared byte-for-byte without locale collation, Unicode normalization, or display-name transformation. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context return the existing result. Attempting to create a second result for the same tie context is rejected as a deterministic conflict and must not perform another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

### round-16 / vertical

- decisions: `21`
- human decisions: `21`
- status_counts: `deferred_scope_decision`=2, `operator_review_recommended`=19
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `16`
- profiles: `vertical`
- sections: `Authority and Precedence`, `Authorization`, `Authorization Configuration`, `Configuration and Reproducibility`, `Core Mutation Authority`, `Courtside Core Domain — Isolated Phase 1.04 Composite`, `Role Assignment`, `Role Assignment Lifecycle`, `Season Configuration Lifecycle`
- decision_ids: `dec_050796bb6761ba78`, `dec_1289e4edc3fe5f82`, `dec_2100b8f8b24c5dfd`, `dec_216b43e10fb3bf52`, `dec_38d7db1a1edb11db`, `dec_493d6f1cb3f0d122`, `dec_51ee2970000a365c`, `dec_54afa060aa790ad0`, `dec_569730ddc780404e`, `dec_59f23e80802e9100`, `dec_61623aefa2b99397`, `dec_6a08adb38bd15f72`, `dec_72579a9b35b52a5b`, `dec_7974eebca254b065`, `dec_7f0493aed90b8c71`, `dec_81bd72cf13dc8659`, `dec_834c1d37698f3552`, `dec_95261629f7294b5b`, `dec_a9fc4e431b1e9aed`, `dec_b7a3417059b45745`, `dec_df864f80e7c88266`

Representative decisions:
- `dec_050796bb6761ba78`: Should `Configuration and Reproducibility` adopt this change (tighten requirement, choose policy): 4. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution.
- `dec_1289e4edc3fe5f82`: Should `Courtside Core Domain — Isolated Phase 1.04 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.04 Composite
- `dec_2100b8f8b24c5dfd`: Should `Authorization` adopt this change (relax requirement, choose policy): 4. Only a League Administrator may approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, assign, reassign, or revoke League Administrator authority after bootstrap, assign, reassign, or revoke Team Captain authority, mutate Game lifecycle status, create or change Roster Memberships, create or materially change Player Stat Lines, or resolve playoff correction conflicts.

### round-20 / vertical

- decisions: `9`
- human decisions: `9`
- status_counts: `deferred_scope_decision`=2, `operator_review_recommended`=7
- actions: `present_at_end`
- decision_types: `choose_policy`, `relax_requirement`, `scope_change`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `20`
- profiles: `vertical`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Competition Transitions`, `Configuration and Reproducibility`, `Courtside Core Domain — Isolated Phase 1.05 Composite`, `Games and Results`, `Playoffs`, `Roster Membership Lifecycle`
- decision_ids: `dec_1192d9a364be600d`, `dec_1d890fe73d53f25f`, `dec_3fe36ccbd7d86bf0`, `dec_57ae79b979531725`, `dec_9436dc1608134290`, `dec_a76f9b5b75bc904a`, `dec_b01a5bdacdba2fe8`, `dec_b4a9722339a0e68d`, `dec_cddefa59eaccf28d`

Representative decisions:
- `dec_1192d9a364be600d`: Should `Roster Membership Lifecycle` adopt this change (relax requirement, choose policy): A Game evaluates roster eligibility at its competition eligibility anchor. For a Game that enters `in_progress`, the anchor is the first accepted start instant for that Game. For a Game that becomes `forfeit` from `scheduled` or `postponed` without entering `in_progress`, the anchor is the official forfeit decision instant recorded with the forfeiture. A cancelled Game has no competition eligibility anchor for Player Stat Line attribution. Rescheduling or postponement before the anchor may change when the Game is expected to occur, but it does not create Player Stat Line eligibility until the anchor is established. Finalization and later authoritative result corrections do not change the anchor or rewrite existing Player Stat Line attribution. A Player Stat Line is valid only when its referenced Roster Membership was effective for one of the Game's participating Season Teams at the competition eligibility anchor.
- `dec_1d890fe73d53f25f`: Should `Playoffs` adopt this change (choose policy): 11. Accepted correction resolutions that halt advancement are deterministic by their resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy the resume condition.
- `dec_3fe36ccbd7d86bf0`: Should `Games and Results` adopt this change (choose policy): 12. An accepted halted playoff correction resolution makes affected slots or Matchups halted in the current projection, excludes conflicted downstream authoritative Games from current corrected-path advancement calculations while preserving them historically, and resumes only when replacement authoritative outcomes exist under the corrected bracket participants.

### round-24 / vertical

- decisions: `4`
- human decisions: `4`
- status_counts: `deferred_scope_decision`=2, `operator_review_recommended`=2
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`
- trigger_types: `choose_policy`, `scope_change`, `tighten_requirement`
- rounds: `24`
- profiles: `vertical`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Courtside Core Domain — Isolated Phase 1.06 Composite`, `Playoffs`
- decision_ids: `dec_1ed80b2032539eb6`, `dec_516b588d462bd569`, `dec_7702e5cdcee83f8a`, `dec_8f64646be1cd8e18`

Representative decisions:
- `dec_1ed80b2032539eb6`: Should `Playoffs` adopt this change (choose policy): 11. Accepted correction resolutions that halt advancement are deterministic by their canonicalized resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy the resume condition.
- `dec_516b588d462bd569`: Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted correction resolution is composed of the corrected Game, the corrected authoritative value, the affected participant slots, the downstream authoritative Games that create the conflict, and the chosen resolution type. Affected participant slots are canonicalized by their fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within the fixed bracket order. Identity equality is based on that canonicalized content, not on traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, or concurrent recomputations for the same resolution identity must return the same projection effect and resolution report. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.
- `dec_7702e5cdcee83f8a`: Should `Courtside Core Domain — Isolated Phase 1.06 Composite` adopt this change (scope change): # Courtside Core Domain — Isolated Phase 1.06 Composite

### round-27 / vertical

- decisions: `58`
- human decisions: `58`
- status_counts: `deferred_scope_decision`=18, `operator_review_recommended`=40
- actions: `present_at_end`
- decision_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `27`
- profiles: `vertical`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Authority and Precedence`, `Authorization`, `Authorization Configuration`, `Canonical Concepts`, `Configuration and Reproducibility`, `Consequences`, `Context`, `Core Mutation Authority`, `Courtside Core Domain — Isolated Phase 1.07 Composite`, `Decision`, `Derived Data Authority`, `Game Lifecycle`, `Game and Venue Configuration`, `Games and Results`, `General Lifecycle Failure Rule`, `Identity and Participation`, `Localization Configuration`, `Player Management Lifecycle`, `Player Stat Line Lifecycle`, `Player Statistics`, `Playoff Configuration`, `Playoff Matchup Lifecycle`, `Playoffs`, `Role Assignment Lifecycle`, `Roster Membership Lifecycle`, `Scope`, `Season Configuration Lifecycle`, `Standing Calculations`, `Standings`, `Standings Configuration`, `Standings Lifecycle`, `Statistics Configuration`, `Venues, Media, and Audit`
- decision_ids: `dec_016bff0074ce8689`, `dec_09a42416211ed2d8`, `dec_0b488265a1c8a003`, `dec_0c282d54a399f7fa`, `dec_163d4c13c1b24928`, `dec_17ad71b967d04589`, `dec_1b1190d519c43c31`, `dec_1d333a5e351e0251`, `dec_1e2559ba477ee435`, `dec_21c8f8ee70400aae`, `dec_22f7ff6d82c3ed3f`, `dec_233f440fa0402886`, `dec_2f97c94273574cc2`, `dec_3113aced1852e6de`, `dec_31e785e1443daa6b`, `dec_3ceac5fb3954e5c5`, `dec_3e35e95dca57c5be`, `dec_41b071ad77b05935`, `dec_41c00c4f67676ca3`, `dec_4688de2322bf9acf`, `dec_56bd5f6e7c4cb3bf`, `dec_66791f2b4117234a`, `dec_6a92420f5c855dd5`, `dec_73a9a1b358d1a43f`, `dec_78fcaf9f0f408a34`, `dec_7caaab7d32d5f362`, `dec_7d7f27eaf1ca4872`, `dec_8268f7ae6be83018`, `dec_82954f5240e51c94`, `dec_92794fba7f147b6f`, `dec_993e865475feb19f`, `dec_9c31880bfb5e6a3a`, `dec_9fdb024ce3ccdb13`, `dec_a0aa4c7dac9b3593`, `dec_a6e27170d78207e2`, `dec_abc77c2fc002ea5a`, `dec_ada3293270ea9636`, `dec_b7d1799ce16d3307`, `dec_bb05508557ae8b78`, `dec_bc7ac21acf321e16`, `dec_bf1befb86a6670c6`, `dec_bf806ac6866e705d`, `dec_c1687c53e914cf68`, `dec_c23fa46dd589ad5f`, `dec_c7a57eab7a1e7a4a`, `dec_cc7b04eceedc3ab9`, `dec_d201dd7c6ac97aa9`, `dec_db34c54671a2d83b`, `dec_ddf4666079bc289c`, `dec_e2a867e67a37d697`, `dec_e3b69a9b03c8dbb0`, `dec_e4cc29e2eea3d908`, `dec_e6e6ff3034e7a16a`, `dec_edad99bdd70c5c97`, `dec_ee02027686c6dbb2`, `dec_f0d2929ab27dfe8a`, `dec_f30555fee78e6f96`, `dec_f7a1fd44aba54ee8`

Representative decisions:
- `dec_016bff0074ce8689`: Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, current state or condition, requested state or mutation, actor, and violated lifecycle rule. In-scope invariant, configuration validation, and authorization failures follow the same preserve-state rule and must identify the affected scope, attempted mutation, violated rule, and confirmation that authoritative records, persisted projections, and configuration versions remain unchanged. Auditing rejected attempts is not required unless the audit policy for that surface explicitly requires it.
- `dec_09a42416211ed2d8`: Should `Playoff Configuration` adopt this change (tighten requirement, choose policy): Playoff structure is configurable per Round. Each Round defines stable Round identity and display order, fixed input slots from seeds or named prior-Matchup winners, number of Games in each Matchup, `aggregate_points` as advancement rule, and aggregate-tiebreak policy. Example Game counts are illustrative only. Every Season must provide actual Round list and Game count for each Round. `overtime` is the normative default aggregate-tiebreak policy and continues the final configured Game after regulation until the Matchup aggregate is no longer tied. Unknown policies are rejected rather than silently falling back. Round structure and policies are result-affecting frozen configuration and are subject to frozen amendment legality after dependent authoritative playoff Games exist.
- `dec_0b488265a1c8a003`: Should `Playoffs` adopt this change (tighten requirement, choose policy): A Playoff Bracket uses a fixed advancement graph and does not reseed. Initial Matchup participants resolve from seeds; later participants resolve from winners of fixed prior Matchups. A Matchup contains the Round-configured number of ordinary Games. Every configured Matchup Game is played to an authoritative outcome; early series termination based on Games won is prohibited. Advancement is determined by aggregate authoritative points, not Games won. The aggregate winner is the participating team with greater sum of authoritative Game points after configured Games and any aggregate-tiebreak overtime. Default aggregate-tiebreak overtime continues the final configured Game until the aggregate tie is broken. Aggregate-tiebreak points are part of the authoritative final Game score. A Matchup advances only from authoritative Game scores. A Matchup with incomplete outcomes must not advance automatically, and an attempted correction creating unresolved participant conflict is rejected before authoritative state changes. Accepted correction resolutions that halt advancement are deterministic by canonicalized resolution identity; retries and replays return the same halted projection and report until replacement authoritative outcomes satisfy resume conditions.

### round-4 / vertical

- decisions: `27`
- human decisions: `27`
- status_counts: `deferred_scope_decision`=5, `operator_review_recommended`=22
- actions: `present_at_end`
- decision_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `4`
- profiles: `vertical`
- sections: `Authoritative Result Corrections`, `Authorization`, `Authorization Configuration`, `Core Mutation Authority`, `Courtside Core Domain — Isolated Phase 1.01 Composite`, `Games and Results`, `General Lifecycle Failure Rule`, `Playoff Matchup Lifecycle`, `Playoffs`, `Role Assignment`, `Role Assignment Lifecycle`, `Standings`, `Standings Configuration`, `Standings Lifecycle`
- decision_ids: `dec_1039e8c0a2f9f9e5`, `dec_1631d54f6cb8351b`, `dec_21dcea43c59badc0`, `dec_2347ff3d284afab8`, `dec_274d60155ff4d68d`, `dec_33a3ef95971c7458`, `dec_3c65d8a820455ea4`, `dec_3f59aa530e1c9997`, `dec_4d7a169b05856c47`, `dec_5350d9cd676ffb78`, `dec_589c0b19c1436af7`, `dec_592757927bd6b275`, `dec_5e02c6ab62f54659`, `dec_5f9f24ee3e2ad848`, `dec_63706f5931ad6c73`, `dec_728fe2ccd155a4c8`, `dec_751927cc413ce89d`, `dec_89c222d2f6d01a99`, `dec_929baca54335cbcb`, `dec_98d1bf2436af91b4`, `dec_adfe7e24ceda396d`, `dec_bb050da881095598`, `dec_d2d016e14e3a8cff`, `dec_e3d1365932d05380`, `dec_ebf9e410b03355f3`, `dec_ef2058ac05f6b76e`, `dec_fa4a5c2f87a82db1`

Representative decisions:
- `dec_1039e8c0a2f9f9e5`: Should `Role Assignment Lifecycle` adopt this change (choose policy, scope change): A revoked role assignment is terminal for that assignment. Later authority requires a new assignment or reassignment under League Administrator authority.
- `dec_1631d54f6cb8351b`: Should `Games and Results` adopt this change (relax requirement, choose policy): 9. `cancelled`, `final`, and `forfeit` Game statuses are terminal lifecycle states, except that authoritative result corrections may modify the score or declared winner of `final` or `forfeit` Games while preserving status.
- `dec_21dcea43c59badc0`: Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, the current state or condition, the requested state or mutation, the actor, and the violated lifecycle rule. Auditing rejected attempts is not required by this Phase 1 domain specification unless the audit policy for that surface explicitly requires it.

### round-8 / vertical

- decisions: `14`
- human decisions: `14`
- status_counts: `deferred_scope_decision`=8, `operator_review_recommended`=6
- actions: `present_at_end`
- decision_types: `choose_policy`, `relax_requirement`, `scope_change`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `8`
- profiles: `vertical`
- sections: `Authoritative Result Corrections`, `Authorization Configuration`, `Courtside Core Domain — Isolated Phase 1.02 Composite`, `Games and Results`, `General Lifecycle Failure Rule`, `Player Management Lifecycle`, `Playoff Matchup Lifecycle`, `Playoffs`, `Standings`, `Standings Configuration`, `Standings Lifecycle`
- decision_ids: `dec_0462ed3015c05d71`, `dec_0fca561d8be8427a`, `dec_1cc5dd899890c4c3`, `dec_259578897028488c`, `dec_2e90b2c3c654e99c`, `dec_4502eaeec3bc9713`, `dec_459efa1c71a33e2f`, `dec_5192111936c3ec16`, `dec_6acbf05b63785080`, `dec_713b3bb41c4eb557`, `dec_98fe0bad87fd75d5`, `dec_b494663745cced37`, `dec_d1a2e298829a73d3`, `dec_f6dfe02d56733bc1`

Representative decisions:
- `dec_0462ed3015c05d71`: Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): In-scope invariant and configuration validation failures are rejected under the same preserve-state rule. The rejection report must identify the affected entity or configuration surface, the submitted value or attempted mutation, the actor when applicable, the violated invariant or configuration rule, and confirm that existing authoritative records, persisted projections, and configuration versions remain unchanged.
- `dec_0fca561d8be8427a`: Should `Player Management Lifecycle` adopt this change (relax requirement): A User Account may create a `requested` relationship for itself and a Player.
- `dec_1cc5dd899890c4c3`: Should `Standings Lifecycle` adopt this change (tighten requirement, choose policy, scope change): A random-draw tie context has a stable identity composed of the Season, the frozen Season configuration version, the ranking step or criterion that invoked `random_draw`, the tied Season Teams in canonical identity order before the draw, and the equal preceding criterion values that made the tie unresolved. Canonical identity order is the ascending order of each Season Team's immutable canonical domain identity as assigned when the Season Team is created, compared by normalized codepoint order. It must not depend on display name, Team name, creation timestamp, storage order, locale collation, or mutable seed position. Exactly one persisted draw result may exist for a tie context. Retries, replays, concurrent recalculations, or duplicate requests for the same tie context must return the existing result. Attempting to create another draw result for the same tie context is rejected as a deterministic conflict without performing another draw. League Administrators do not override or replace the persisted draw for that tie context in Phase 1.

## By Trigger Type

### choose_policy

- decisions: `112`
- human decisions: `112`
- status_counts: `deferred_scope_decision`=34, `operator_review_recommended`=78
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `4`, `8`, `12`, `16`, `20`, `24`, `27`
- profiles: `vertical`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Authority and Precedence`, `Authorization`, `Authorization Configuration`, `Canonical Concepts`, `Configuration and Reproducibility`, `Context`, `Core Mutation Authority`, `Decision`, `Derived Data Authority`, `Game Lifecycle`, `Games and Results`, `General Lifecycle Failure Rule`, `Identity and Participation`, `Player Management Lifecycle`, `Player Stat Line Lifecycle`, `Player Statistics`, `Playoff Configuration`, `Playoff Matchup Lifecycle`, `Playoffs`, `Role Assignment`, `Role Assignment Lifecycle`, `Roster Membership Lifecycle`, `Scope`, `Season Configuration Lifecycle`, `Standing Calculations`, `Standings`, `Standings Configuration`, `Standings Lifecycle`, `Statistics Configuration`, `Venues, Media, and Audit`
- decision_ids: `dec_1039e8c0a2f9f9e5`, `dec_1631d54f6cb8351b`, `dec_21dcea43c59badc0`, `dec_3c65d8a820455ea4`, `dec_5350d9cd676ffb78`, `dec_592757927bd6b275`, `dec_5e02c6ab62f54659`, `dec_728fe2ccd155a4c8`, `dec_751927cc413ce89d`, `dec_89c222d2f6d01a99`, `dec_929baca54335cbcb`, `dec_98d1bf2436af91b4`, `dec_adfe7e24ceda396d`, `dec_d2d016e14e3a8cff`, `dec_e3d1365932d05380`, `dec_ebf9e410b03355f3`, `dec_ef2058ac05f6b76e`, `dec_fa4a5c2f87a82db1`, `dec_0462ed3015c05d71`, `dec_1cc5dd899890c4c3`, `dec_259578897028488c`, `dec_2e90b2c3c654e99c`, `dec_4502eaeec3bc9713`, `dec_459efa1c71a33e2f`, `dec_5192111936c3ec16`, `dec_713b3bb41c4eb557`, `dec_d1a2e298829a73d3`, `dec_f6dfe02d56733bc1`, `dec_08d324d71c332ba0`, `dec_0d2360f616cc1584`, `dec_233fe79790aea2a8`, `dec_5bc5102579e48f8f`, `dec_74614ad29be05e35`, `dec_a6bce6501c4fe7b3`, `dec_b43483a0db72b5f3`, `dec_b570408d2fccb971`, `dec_b7ed569df9de0b5a`, `dec_ce15ed7a376afce9`, `dec_d12db48235ffc659`, `dec_f7d82017388c166c`, `dec_050796bb6761ba78`, `dec_2100b8f8b24c5dfd`, `dec_216b43e10fb3bf52`, `dec_38d7db1a1edb11db`, `dec_493d6f1cb3f0d122`, `dec_51ee2970000a365c`, `dec_54afa060aa790ad0`, `dec_569730ddc780404e`, `dec_59f23e80802e9100`, `dec_61623aefa2b99397`, `dec_6a08adb38bd15f72`, `dec_7974eebca254b065`, `dec_81bd72cf13dc8659`, `dec_834c1d37698f3552`, `dec_95261629f7294b5b`, `dec_a9fc4e431b1e9aed`, `dec_b7a3417059b45745`, `dec_df864f80e7c88266`, `dec_1192d9a364be600d`, `dec_1d890fe73d53f25f`, `dec_3fe36ccbd7d86bf0`, `dec_9436dc1608134290`, `dec_a76f9b5b75bc904a`, `dec_b01a5bdacdba2fe8`, `dec_b4a9722339a0e68d`, `dec_1ed80b2032539eb6`, `dec_516b588d462bd569`, `dec_8f64646be1cd8e18`, `dec_016bff0074ce8689`, `dec_09a42416211ed2d8`, `dec_0b488265a1c8a003`, `dec_0c282d54a399f7fa`, `dec_163d4c13c1b24928`, `dec_17ad71b967d04589`, `dec_1d333a5e351e0251`, `dec_1e2559ba477ee435`, `dec_21c8f8ee70400aae`, `dec_22f7ff6d82c3ed3f`, `dec_233f440fa0402886`, `dec_2f97c94273574cc2`, `dec_31e785e1443daa6b`, `dec_3ceac5fb3954e5c5`, `dec_3e35e95dca57c5be`, `dec_41b071ad77b05935`, `dec_41c00c4f67676ca3`, `dec_56bd5f6e7c4cb3bf`, `dec_66791f2b4117234a`, `dec_6a92420f5c855dd5`, `dec_78fcaf9f0f408a34`, `dec_7caaab7d32d5f362`, `dec_8268f7ae6be83018`, `dec_82954f5240e51c94`, `dec_92794fba7f147b6f`, `dec_993e865475feb19f`, `dec_9fdb024ce3ccdb13`, `dec_a0aa4c7dac9b3593`, `dec_abc77c2fc002ea5a`, `dec_ada3293270ea9636`, `dec_b7d1799ce16d3307`, `dec_bb05508557ae8b78`, `dec_bf1befb86a6670c6`, `dec_bf806ac6866e705d`, `dec_c1687c53e914cf68`, `dec_db34c54671a2d83b`, `dec_ddf4666079bc289c`, `dec_e3b69a9b03c8dbb0`, `dec_e4cc29e2eea3d908`, `dec_e6e6ff3034e7a16a`, `dec_edad99bdd70c5c97`, `dec_f0d2929ab27dfe8a`, `dec_f30555fee78e6f96`, `dec_f7a1fd44aba54ee8`

Representative decisions:
- `dec_1039e8c0a2f9f9e5`: Should `Role Assignment Lifecycle` adopt this change (choose policy, scope change): A revoked role assignment is terminal for that assignment. Later authority requires a new assignment or reassignment under League Administrator authority.
- `dec_1631d54f6cb8351b`: Should `Games and Results` adopt this change (relax requirement, choose policy): 9. `cancelled`, `final`, and `forfeit` Game statuses are terminal lifecycle states, except that authoritative result corrections may modify the score or declared winner of `final` or `forfeit` Games while preserving status.
- `dec_21dcea43c59badc0`: Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, the current state or condition, the requested state or mutation, the actor, and the violated lifecycle rule. Auditing rejected attempts is not required by this Phase 1 domain specification unless the audit policy for that surface explicitly requires it.

### relax_requirement

- decisions: `31`
- human decisions: `31`
- status_counts: `operator_review_recommended`=31
- actions: `present_at_end`
- decision_types: `choose_policy`, `relax_requirement`, `scope_change`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`
- rounds: `4`, `8`, `12`, `16`, `20`, `27`
- profiles: `vertical`
- sections: `Authoritative Result Corrections`, `Authorization`, `Canonical Concepts`, `Competition Transitions`, `Core Mutation Authority`, `Decision`, `Game Lifecycle`, `Games and Results`, `Identity and Participation`, `Player Management Lifecycle`, `Player Stat Line Lifecycle`, `Player Statistics`, `Roster Membership Lifecycle`, `Season Configuration Lifecycle`, `Standings Configuration`, `Venues, Media, and Audit`
- decision_ids: `dec_1631d54f6cb8351b`, `dec_2347ff3d284afab8`, `dec_751927cc413ce89d`, `dec_bb050da881095598`, `dec_0fca561d8be8427a`, `dec_6acbf05b63785080`, `dec_57aa1f55221f8a3d`, `dec_2100b8f8b24c5dfd`, `dec_7f0493aed90b8c71`, `dec_1192d9a364be600d`, `dec_cddefa59eaccf28d`, `dec_0c282d54a399f7fa`, `dec_1b1190d519c43c31`, `dec_22f7ff6d82c3ed3f`, `dec_2f97c94273574cc2`, `dec_31e785e1443daa6b`, `dec_3e35e95dca57c5be`, `dec_41c00c4f67676ca3`, `dec_66791f2b4117234a`, `dec_73a9a1b358d1a43f`, `dec_7d7f27eaf1ca4872`, `dec_a0aa4c7dac9b3593`, `dec_bb05508557ae8b78`, `dec_bc7ac21acf321e16`, `dec_bf1befb86a6670c6`, `dec_c23fa46dd589ad5f`, `dec_c7a57eab7a1e7a4a`, `dec_e3b69a9b03c8dbb0`, `dec_e6e6ff3034e7a16a`, `dec_ee02027686c6dbb2`, `dec_f0d2929ab27dfe8a`

Representative decisions:
- `dec_1631d54f6cb8351b`: Should `Games and Results` adopt this change (relax requirement, choose policy): 9. `cancelled`, `final`, and `forfeit` Game statuses are terminal lifecycle states, except that authoritative result corrections may modify the score or declared winner of `final` or `forfeit` Games while preserving status.
- `dec_2347ff3d284afab8`: Should `Core Mutation Authority` adopt this change (relax requirement, scope change): League Administrators may create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke role assignments; amend frozen Season configuration; and resolve playoff correction conflicts.
- `dec_751927cc413ce89d`: Should `Authorization` adopt this change (relax requirement, choose policy): 3. Only a League Administrator may approve Player Management Relationships, correct authoritative Game results, amend frozen Season configuration, assign Team Captain authority, mutate Game lifecycle status, create or change Roster Memberships, create or materially change Player Stat Lines, or resolve playoff correction conflicts.

### scope_change

- decisions: `49`
- human decisions: `49`
- status_counts: `deferred_scope_decision`=13, `operator_review_recommended`=36
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `4`, `8`, `12`, `16`, `20`, `24`, `27`
- profiles: `vertical`
- sections: `Authority and Precedence`, `Authorization`, `Authorization Configuration`, `Canonical Concepts`, `Core Mutation Authority`, `Courtside Core Domain — Isolated Phase 1.01 Composite`, `Courtside Core Domain — Isolated Phase 1.02 Composite`, `Courtside Core Domain — Isolated Phase 1.03 Composite`, `Courtside Core Domain — Isolated Phase 1.04 Composite`, `Courtside Core Domain — Isolated Phase 1.05 Composite`, `Courtside Core Domain — Isolated Phase 1.06 Composite`, `Courtside Core Domain — Isolated Phase 1.07 Composite`, `Game and Venue Configuration`, `Games and Results`, `General Lifecycle Failure Rule`, `Role Assignment`, `Role Assignment Lifecycle`, `Season Configuration Lifecycle`, `Standings`, `Standings Configuration`, `Standings Lifecycle`
- decision_ids: `dec_1039e8c0a2f9f9e5`, `dec_21dcea43c59badc0`, `dec_2347ff3d284afab8`, `dec_3f59aa530e1c9997`, `dec_4d7a169b05856c47`, `dec_592757927bd6b275`, `dec_63706f5931ad6c73`, `dec_728fe2ccd155a4c8`, `dec_929baca54335cbcb`, `dec_fa4a5c2f87a82db1`, `dec_0462ed3015c05d71`, `dec_1cc5dd899890c4c3`, `dec_2e90b2c3c654e99c`, `dec_459efa1c71a33e2f`, `dec_98fe0bad87fd75d5`, `dec_b494663745cced37`, `dec_233fe79790aea2a8`, `dec_301afd202ce14c37`, `dec_b43483a0db72b5f3`, `dec_d12db48235ffc659`, `dec_1289e4edc3fe5f82`, `dec_216b43e10fb3bf52`, `dec_493d6f1cb3f0d122`, `dec_54afa060aa790ad0`, `dec_569730ddc780404e`, `dec_61623aefa2b99397`, `dec_72579a9b35b52a5b`, `dec_7974eebca254b065`, `dec_7f0493aed90b8c71`, `dec_81bd72cf13dc8659`, `dec_834c1d37698f3552`, `dec_a9fc4e431b1e9aed`, `dec_57ae79b979531725`, `dec_7702e5cdcee83f8a`, `dec_016bff0074ce8689`, `dec_233f440fa0402886`, `dec_2f97c94273574cc2`, `dec_31e785e1443daa6b`, `dec_4688de2322bf9acf`, `dec_7caaab7d32d5f362`, `dec_a6e27170d78207e2`, `dec_ada3293270ea9636`, `dec_b7d1799ce16d3307`, `dec_bc7ac21acf321e16`, `dec_bf806ac6866e705d`, `dec_d201dd7c6ac97aa9`, `dec_ddf4666079bc289c`, `dec_e4cc29e2eea3d908`, `dec_f30555fee78e6f96`

Representative decisions:
- `dec_1039e8c0a2f9f9e5`: Should `Role Assignment Lifecycle` adopt this change (choose policy, scope change): A revoked role assignment is terminal for that assignment. Later authority requires a new assignment or reassignment under League Administrator authority.
- `dec_21dcea43c59badc0`: Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, the current state or condition, the requested state or mutation, the actor, and the violated lifecycle rule. Auditing rejected attempts is not required by this Phase 1 domain specification unless the audit policy for that surface explicitly requires it.
- `dec_2347ff3d284afab8`: Should `Core Mutation Authority` adopt this change (relax requirement, scope change): League Administrators may create, schedule, reschedule, postpone, cancel, start, finalize, forfeit, and correct Games; create, end, and transfer Roster Memberships; create, update, confirm, and correct Player Stat Lines; approve and revoke Player Management Relationships; assign, reassign, and revoke role assignments; amend frozen Season configuration; and resolve playoff correction conflicts.

### tighten_requirement

- decisions: `52`
- human decisions: `52`
- status_counts: `deferred_scope_decision`=42, `operator_review_recommended`=10
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`, `tighten_requirement`
- trigger_types: `choose_policy`, `scope_change`, `tighten_requirement`
- rounds: `4`, `8`, `12`, `16`, `20`, `24`, `27`
- profiles: `vertical`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Authorization`, `Configuration and Reproducibility`, `Consequences`, `Derived Data Authority`, `Game Lifecycle`, `Game and Venue Configuration`, `Games and Results`, `General Lifecycle Failure Rule`, `Localization Configuration`, `Playoff Configuration`, `Playoff Matchup Lifecycle`, `Playoffs`, `Roster Membership Lifecycle`, `Scheduling Transitions`, `Season Configuration Lifecycle`, `Standing Calculations`, `Standings`, `Standings Configuration`, `Standings Lifecycle`, `Statistics Configuration`
- decision_ids: `dec_21dcea43c59badc0`, `dec_274d60155ff4d68d`, `dec_33a3ef95971c7458`, `dec_589c0b19c1436af7`, `dec_5f9f24ee3e2ad848`, `dec_89c222d2f6d01a99`, `dec_adfe7e24ceda396d`, `dec_ebf9e410b03355f3`, `dec_0462ed3015c05d71`, `dec_1cc5dd899890c4c3`, `dec_259578897028488c`, `dec_459efa1c71a33e2f`, `dec_5192111936c3ec16`, `dec_713b3bb41c4eb557`, `dec_b494663745cced37`, `dec_d1a2e298829a73d3`, `dec_f6dfe02d56733bc1`, `dec_08d324d71c332ba0`, `dec_0d2360f616cc1584`, `dec_233fe79790aea2a8`, `dec_5c2a62f2fd7c92bc`, `dec_b43483a0db72b5f3`, `dec_b570408d2fccb971`, `dec_d12db48235ffc659`, `dec_f7d82017388c166c`, `dec_050796bb6761ba78`, `dec_54afa060aa790ad0`, `dec_59f23e80802e9100`, `dec_9436dc1608134290`, `dec_a76f9b5b75bc904a`, `dec_b4a9722339a0e68d`, `dec_516b588d462bd569`, `dec_8f64646be1cd8e18`, `dec_016bff0074ce8689`, `dec_09a42416211ed2d8`, `dec_0b488265a1c8a003`, `dec_1d333a5e351e0251`, `dec_3113aced1852e6de`, `dec_8268f7ae6be83018`, `dec_82954f5240e51c94`, `dec_92794fba7f147b6f`, `dec_9c31880bfb5e6a3a`, `dec_9fdb024ce3ccdb13`, `dec_a6e27170d78207e2`, `dec_abc77c2fc002ea5a`, `dec_b7d1799ce16d3307`, `dec_cc7b04eceedc3ab9`, `dec_db34c54671a2d83b`, `dec_ddf4666079bc289c`, `dec_e2a867e67a37d697`, `dec_edad99bdd70c5c97`, `dec_f7a1fd44aba54ee8`

Representative decisions:
- `dec_21dcea43c59badc0`: Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, the current state or condition, the requested state or mutation, the actor, and the violated lifecycle rule. Auditing rejected attempts is not required by this Phase 1 domain specification unless the audit policy for that surface explicitly requires it.
- `dec_274d60155ff4d68d`: Should `Playoff Matchup Lifecycle` adopt this change (tighten requirement): Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, an unknown tiebreak policy, or a blocked participant-resolution conflict must not advance automatically and must report the violated rule.
- `dec_33a3ef95971c7458`: Should `Standings` adopt this change (tighten requirement): 8. Exactly one persisted random-draw result may exist for a stable tie context, and duplicate attempts for that tie context must reuse the existing result or be rejected without performing another draw.
