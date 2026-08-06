# Decision Summary

- source_register_path: `/Users/Shared/Agent-Workspace/repos/personal/courtside/whetstone_runs/core-domain-phase1-002/rounds/decision_register.json`
- mode: `end_of_cycle`
- terminal_state: `PHASE_1_STABLE`
- decision_count: `15`
- decision_status_counts: `deferred_scope_decision`=5, `operator_review_recommended`=10
- unresolved_human_decision_count: `15`
- summary_method: `mechanical_v1`

## Hotspots

### Largest Clusters

- `by_trigger_type` / `choose_policy`: 9 decisions, 9 human decisions
- `by_trigger_type` / `tighten_requirement`: 8 decisions, 8 human decisions
- `by_round_profile` / `round-8 / vertical`: 6 decisions, 6 human decisions
- `by_round_profile` / `round-19 / vertical`: 5 decisions, 5 human decisions
- `by_trigger_type` / `scope_change`: 5 decisions, 5 human decisions

### Human Decision Clusters

- `by_trigger_type` / `choose_policy`: 9 decisions, 9 human decisions
- `by_trigger_type` / `tighten_requirement`: 8 decisions, 8 human decisions
- `by_round_profile` / `round-8 / vertical`: 6 decisions, 6 human decisions
- `by_round_profile` / `round-19 / vertical`: 5 decisions, 5 human decisions
- `by_trigger_type` / `scope_change`: 5 decisions, 5 human decisions

## By Section

### Audit Configuration

- decisions: `3`
- human decisions: `3`
- status_counts: `operator_review_recommended`=3
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `8`, `19`
- profiles: `vertical`
- sections: `Audit Configuration`
- decision_ids: `dec_7640465f98dfb83e`, `dec_01658c6e6caf46c5`, `dec_873809464fe1c201`

Representative decisions:
- `dec_7640465f98dfb83e`: Should `Audit Configuration` adopt this change (tighten requirement, choose policy): An Audit Record for a playoff correction conflict resolution must include resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. An Audit Record for a playoff-configuration amendment resolution must include the prior frozen configuration version, amended configuration version, changed playoff result-affecting fields, resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized amendment-resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The canonicalized resolution identity is also the idempotency key for authoritative correction-resolution audit persistence: once accepted, duplicate submissions, retries, replays, and concurrent recomputations reuse the existing Audit Record identity and do not append another material Audit Record for the same accepted resolution. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff, including whether the request created a new accepted resolution or returned the prior acceptance.
- `dec_01658c6e6caf46c5`: Should `Audit Configuration` adopt this change (tighten requirement, choose policy): An Audit Record for a playoff correction conflict resolution must include resolution type, prior authoritative result value, prior authoritative result audit or version identity being corrected, corrected authoritative value, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. An Audit Record for a playoff-configuration amendment resolution must include the prior frozen configuration version, amended configuration version, changed playoff result-affecting fields, resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized amendment-resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The canonicalized resolution identity is also the idempotency key for authoritative correction-resolution audit persistence: once accepted, duplicate submissions, retries, replays, and concurrent recomputations reuse the existing Audit Record identity and do not append another material Audit Record for the same accepted resolution. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff, including whether the request created a new accepted resolution or returned the prior acceptance.
- `dec_873809464fe1c201`: Should `Audit Configuration` adopt this change (choose policy): Audit Records contain actor, timestamp, action, previous value, new value, and reason, with reason optional unless otherwise required. Auditing is mandatory for finalized or forfeited Game-result corrections with a required reason, accepted Player `display_name` and `profile_photo` updates, material Player-stat changes, Roster Membership changes, Player Management Relationship approvals and revocations, League Administrator and Team Captain assignment changes, frozen Season configuration amendments, persisted random-draw tiebreak results, playoff correction conflict resolutions, and scheduling changes unless required scheduling-change history is preserved outside Audit Records.

### Authoritative Result Corrections

- decisions: `2`
- human decisions: `2`
- status_counts: `deferred_scope_decision`=1, `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `8`, `19`
- profiles: `vertical`
- sections: `Authoritative Result Corrections`
- decision_ids: `dec_0d822e97cf6efa6c`, `dec_3f8a489b93312f3e`

Representative decisions:
- `dec_0d822e97cf6efa6c`: Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted playoff-configuration amendment resolution is composed of the prior frozen configuration version, amended configuration version, canonical identity of the changed playoff result-affecting fields, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots and downstream authoritative Games are canonicalized by the same rules used for authoritative result-correction resolutions. Retries, replays, duplicate submissions, or concurrent recomputations for the same amendment-resolution identity must return the same amended configuration version, projection effect, amendment/resolution artifact identity, Audit Record identity, and resolution report. After an amendment-resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted amendment and resolution rather than appending another material Audit Record or creating a competing amended version. An amendment attempt that cannot produce this identity or resolve every affected conflict in the same action is rejected without mutation.
- `dec_3f8a489b93312f3e`: Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted correction resolution is composed of the corrected Game, the prior authoritative result value, the prior authoritative result audit or version identity being corrected, the corrected authoritative value, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots are canonicalized by fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within fixed bracket order. Identity equality is based on canonicalized content, not traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, duplicate submissions, or concurrent recomputations for the same material correction action must return the same projection effect, correction/resolution artifact identity, Audit Record identity, and resolution report. A later correction of the same Game back to a previously used authoritative value is a distinct resolution identity when it corrects a different prior authoritative result value or prior result audit or version identity. After a resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted correction and resolution rather than appending another material Audit Record or creating a competing acceptance. If an implementation records non-authoritative retry-attempt telemetry, that telemetry is separate from the authoritative append-only Audit Record surface and does not affect projection identity, audit identity, or resolution status. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

### Configuration and Reproducibility

- decisions: `1`
- human decisions: `1`
- status_counts: `deferred_scope_decision`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `8`
- profiles: `vertical`
- sections: `Configuration and Reproducibility`
- decision_ids: `dec_4793973379375570`

Representative decisions:
- `dec_4793973379375570`: Should `Configuration and Reproducibility` adopt this change (tighten requirement, choose policy): The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes reuse that frozen version. Concurrent or retried first-freeze attempts compare canonical result-affecting configuration basis identity; equal identities reuse existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions. Later amendments require League Administrator authority and an Audit Record. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution. A playoff-configuration amendment after dependent authoritative playoff Games must use an amendment-specific resolution report and deterministic identity; it is not identified as a corrected Game-result value. Historical versions remain available. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic. Configuration cannot enable tied final Games. Unknown playoff policies, ranking criteria, or lifecycle transitions are rejected rather than silently interpreted.

### Core Mutation Authority

- decisions: `2`
- human decisions: `2`
- status_counts: `deferred_scope_decision`=2
- actions: `present_at_end`
- decision_types: `scope_change`, `tighten_requirement`
- trigger_types: `scope_change`, `tighten_requirement`
- rounds: `4`, `19`
- profiles: `vertical`
- sections: `Core Mutation Authority`
- decision_ids: `dec_eb288bc65d9dd4d9`, `dec_c802fb9e2132d641`

Representative decisions:
- `dec_eb288bc65d9dd4d9`: Should `Core Mutation Authority` adopt this change (tighten requirement): For the approved Player profile surface, `display_name` is the required League-visible Player name used for ordinary display and administrative identification. An accepted `display_name` update replaces the prior value, must preserve a non-empty language-neutral proper name value, and must reject unsupported or blank values without mutation. `profile_photo` is an optional Player profile-photo reference distinct from the reusable Media items associated with Games or the League Gallery. It may be set, replaced, or cleared by an actor authorized for the linked Player profile. An accepted `profile_photo` update stores a stable reference to a supported uploaded or externally hosted photo identity without implying any Game or Gallery Media association; unsupported reference forms, non-photo references, or values that cannot be retained as a stable Player profile-photo identity are rejected without mutation. Accepted updates to either field preserve the prior and new value in audit or equivalent profile-change history with actor, timestamp, action, and optional reason.
- `dec_c802fb9e2132d641`: Should `Core Mutation Authority` adopt this change (tighten requirement, scope change): For the approved Player profile surface, `display_name` is the required League-visible Player name used for ordinary display and administrative identification. An accepted `display_name` update replaces the prior value, must preserve a non-empty language-neutral proper name value, and must reject unsupported or blank values without mutation. `profile_photo` is an optional Player profile-photo reference distinct from the reusable Media items associated with Games or the League Gallery. It may be set, replaced, or cleared by an actor authorized for the linked Player profile. An accepted `profile_photo` update stores a stable reference to a supported uploaded or externally hosted photo identity without implying any Game or Gallery Media association; unsupported reference forms, non-photo references, or values that cannot be retained as a stable Player profile-photo identity are rejected without mutation. Accepted updates to either field write an Audit Record preserving the prior and new value with actor, timestamp, action, and optional reason. The Audit Record is the required operational artifact for inspecting accepted Player profile field changes; no separate profile-change history substitutes for that mandatory audit surface in Phase 1.

### Courtside Core Domain — Phase 1.01 Follow-up Candidate

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`
- rounds: `4`
- profiles: `vertical`
- sections: `Courtside Core Domain — Phase 1.01 Follow-up Candidate`
- decision_ids: `dec_aa501cdd2297e2c2`

Representative decisions:
- `dec_aa501cdd2297e2c2`: Should `Courtside Core Domain — Phase 1.01 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.01 Follow-up Candidate

### Courtside Core Domain — Phase 1.02 Follow-up Candidate

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`
- rounds: `8`
- profiles: `vertical`
- sections: `Courtside Core Domain — Phase 1.02 Follow-up Candidate`
- decision_ids: `dec_45c7934ec257bede`

Representative decisions:
- `dec_45c7934ec257bede`: Should `Courtside Core Domain — Phase 1.02 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.02 Follow-up Candidate

### Courtside Core Domain — Phase 1.03 Follow-up Candidate

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`
- rounds: `12`
- profiles: `vertical`
- sections: `Courtside Core Domain — Phase 1.03 Follow-up Candidate`
- decision_ids: `dec_c8be2d3af12d74d2`

Representative decisions:
- `dec_c8be2d3af12d74d2`: Should `Courtside Core Domain — Phase 1.03 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.03 Follow-up Candidate

### Courtside Core Domain — Phase 1.04 Follow-up Candidate

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`
- rounds: `19`
- profiles: `vertical`
- sections: `Courtside Core Domain — Phase 1.04 Follow-up Candidate`
- decision_ids: `dec_6a71ba153b5a65e3`

Representative decisions:
- `dec_6a71ba153b5a65e3`: Should `Courtside Core Domain — Phase 1.04 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.04 Follow-up Candidate

### Game Lifecycle

- decisions: `1`
- human decisions: `1`
- status_counts: `deferred_scope_decision`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `tighten_requirement`
- rounds: `12`
- profiles: `vertical`
- sections: `Game Lifecycle`
- decision_ids: `dec_e5174d42f4a07d79`

Representative decisions:
- `dec_e5174d42f4a07d79`: Should `Game Lifecycle` adopt this change (tighten requirement, choose policy): Every scheduled instant is interpreted in the League configured IANA timezone and stored as an unambiguous instant. Administrative scheduled-instant entry, including initial scheduling and rescheduling, must identify exactly one instant in the League configured IANA timezone before the Game is mutated. A local scheduled value that is ambiguous during a daylight-saving overlap, nonexistent during a daylight-saving gap, or otherwise cannot identify one unambiguous instant is rejected without mutation unless the administrative input supplies enough offset or disambiguation information to identify exactly one instant. The rejection report must identify the Game, attempted scheduled value, League timezone, actor, violated scheduling rule, and confirmation that authoritative Game state and schedule history remain unchanged. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history.

### Season Configuration Lifecycle

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`
- rounds: `8`
- profiles: `vertical`
- sections: `Season Configuration Lifecycle`
- decision_ids: `dec_37d6dc1362febf6d`

Representative decisions:
- `dec_37d6dc1362febf6d`: Should `Season Configuration Lifecycle` adopt this change (choose policy): After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same administrative action applies an amendment-specific playoff conflict resolution. The permitted amendment resolutions are the same operator choices as authoritative result corrections: halt affected downstream advancement until replacement authoritative outcomes exist under the amended bracket participants and fixed slot sources, or explicitly affirm the existing downstream participant path as an audited administrative exception. The amendment action is rejected without mutating authoritative state, persisted projections, or configuration versions unless it identifies the amended configuration version, changed result-affecting playoff fields, affected Matchups and participant slots, conflicted downstream authoritative Games, chosen resolution type, actor, and reason; resolves every affected conflict in the same action; and writes the required Audit Record and resolution report.

### Venues, Media, and Audit

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `relax_requirement`
- rounds: `8`
- profiles: `vertical`
- sections: `Venues, Media, and Audit`
- decision_ids: `dec_746373b1f5a0b5d4`

Representative decisions:
- `dec_746373b1f5a0b5d4`: Should `Venues, Media, and Audit` adopt this change (relax requirement, choose policy): A Venue is reusable and League-owned; a Game may reference at most one Venue. A Media item may be associated with a Game, League Gallery, or both without duplicating Media identity. Every material Audit Record contains actor, timestamp, action, previous value, and new value. Audit reasons are optional except for authoritative Game-result corrections, where a reason is mandatory. Audit history is append-only. Required rejection reports identify entity, current state or condition, requested mutation, actor, violated rule, and state-preservation outcome. Accepted playoff correction resolution reports identify halted slots or Matchups, conflicted downstream Games retained as historical records, corrected-path records excluded from current advancement, resume condition, and canonicalized resolution identity used for deterministic retries. Accepted playoff-configuration amendment resolution reports identify the prior and amended configuration versions, changed playoff result-affecting fields, halted or affirmed slots or Matchups, conflicted downstream Games retained as historical records, current advancement effect, resume condition when halted, and canonicalized amendment-resolution identity used for deterministic retries.

## By Round/Profile

### round-12 / vertical

- decisions: `2`
- human decisions: `2`
- status_counts: `deferred_scope_decision`=1, `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`
- trigger_types: `choose_policy`, `scope_change`, `tighten_requirement`
- rounds: `12`
- profiles: `vertical`
- sections: `Courtside Core Domain — Phase 1.03 Follow-up Candidate`, `Game Lifecycle`
- decision_ids: `dec_c8be2d3af12d74d2`, `dec_e5174d42f4a07d79`

Representative decisions:
- `dec_c8be2d3af12d74d2`: Should `Courtside Core Domain — Phase 1.03 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.03 Follow-up Candidate
- `dec_e5174d42f4a07d79`: Should `Game Lifecycle` adopt this change (tighten requirement, choose policy): Every scheduled instant is interpreted in the League configured IANA timezone and stored as an unambiguous instant. Administrative scheduled-instant entry, including initial scheduling and rescheduling, must identify exactly one instant in the League configured IANA timezone before the Game is mutated. A local scheduled value that is ambiguous during a daylight-saving overlap, nonexistent during a daylight-saving gap, or otherwise cannot identify one unambiguous instant is rejected without mutation unless the administrative input supplies enough offset or disambiguation information to identify exactly one instant. The rejection report must identify the Game, attempted scheduled value, League timezone, actor, violated scheduling rule, and confirmation that authoritative Game state and schedule history remain unchanged. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history.

### round-19 / vertical

- decisions: `5`
- human decisions: `5`
- status_counts: `deferred_scope_decision`=1, `operator_review_recommended`=4
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`
- trigger_types: `choose_policy`, `scope_change`, `tighten_requirement`
- rounds: `19`
- profiles: `vertical`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Core Mutation Authority`, `Courtside Core Domain — Phase 1.04 Follow-up Candidate`
- decision_ids: `dec_01658c6e6caf46c5`, `dec_3f8a489b93312f3e`, `dec_6a71ba153b5a65e3`, `dec_873809464fe1c201`, `dec_c802fb9e2132d641`

Representative decisions:
- `dec_01658c6e6caf46c5`: Should `Audit Configuration` adopt this change (tighten requirement, choose policy): An Audit Record for a playoff correction conflict resolution must include resolution type, prior authoritative result value, prior authoritative result audit or version identity being corrected, corrected authoritative value, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. An Audit Record for a playoff-configuration amendment resolution must include the prior frozen configuration version, amended configuration version, changed playoff result-affecting fields, resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized amendment-resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The canonicalized resolution identity is also the idempotency key for authoritative correction-resolution audit persistence: once accepted, duplicate submissions, retries, replays, and concurrent recomputations reuse the existing Audit Record identity and do not append another material Audit Record for the same accepted resolution. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff, including whether the request created a new accepted resolution or returned the prior acceptance.
- `dec_3f8a489b93312f3e`: Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted correction resolution is composed of the corrected Game, the prior authoritative result value, the prior authoritative result audit or version identity being corrected, the corrected authoritative value, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots are canonicalized by fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within fixed bracket order. Identity equality is based on canonicalized content, not traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, duplicate submissions, or concurrent recomputations for the same material correction action must return the same projection effect, correction/resolution artifact identity, Audit Record identity, and resolution report. A later correction of the same Game back to a previously used authoritative value is a distinct resolution identity when it corrects a different prior authoritative result value or prior result audit or version identity. After a resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted correction and resolution rather than appending another material Audit Record or creating a competing acceptance. If an implementation records non-authoritative retry-attempt telemetry, that telemetry is separate from the authoritative append-only Audit Record surface and does not affect projection identity, audit identity, or resolution status. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.
- `dec_6a71ba153b5a65e3`: Should `Courtside Core Domain — Phase 1.04 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.04 Follow-up Candidate

### round-4 / vertical

- decisions: `2`
- human decisions: `2`
- status_counts: `deferred_scope_decision`=1, `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `scope_change`, `tighten_requirement`
- trigger_types: `scope_change`, `tighten_requirement`
- rounds: `4`
- profiles: `vertical`
- sections: `Core Mutation Authority`, `Courtside Core Domain — Phase 1.01 Follow-up Candidate`
- decision_ids: `dec_aa501cdd2297e2c2`, `dec_eb288bc65d9dd4d9`

Representative decisions:
- `dec_aa501cdd2297e2c2`: Should `Courtside Core Domain — Phase 1.01 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.01 Follow-up Candidate
- `dec_eb288bc65d9dd4d9`: Should `Core Mutation Authority` adopt this change (tighten requirement): For the approved Player profile surface, `display_name` is the required League-visible Player name used for ordinary display and administrative identification. An accepted `display_name` update replaces the prior value, must preserve a non-empty language-neutral proper name value, and must reject unsupported or blank values without mutation. `profile_photo` is an optional Player profile-photo reference distinct from the reusable Media items associated with Games or the League Gallery. It may be set, replaced, or cleared by an actor authorized for the linked Player profile. An accepted `profile_photo` update stores a stable reference to a supported uploaded or externally hosted photo identity without implying any Game or Gallery Media association; unsupported reference forms, non-photo references, or values that cannot be retained as a stable Player profile-photo identity are rejected without mutation. Accepted updates to either field preserve the prior and new value in audit or equivalent profile-change history with actor, timestamp, action, and optional reason.

### round-8 / vertical

- decisions: `6`
- human decisions: `6`
- status_counts: `deferred_scope_decision`=2, `operator_review_recommended`=4
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`
- trigger_types: `choose_policy`, `relax_requirement`, `scope_change`, `tighten_requirement`
- rounds: `8`
- profiles: `vertical`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Configuration and Reproducibility`, `Courtside Core Domain — Phase 1.02 Follow-up Candidate`, `Season Configuration Lifecycle`, `Venues, Media, and Audit`
- decision_ids: `dec_0d822e97cf6efa6c`, `dec_37d6dc1362febf6d`, `dec_45c7934ec257bede`, `dec_4793973379375570`, `dec_746373b1f5a0b5d4`, `dec_7640465f98dfb83e`

Representative decisions:
- `dec_0d822e97cf6efa6c`: Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted playoff-configuration amendment resolution is composed of the prior frozen configuration version, amended configuration version, canonical identity of the changed playoff result-affecting fields, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots and downstream authoritative Games are canonicalized by the same rules used for authoritative result-correction resolutions. Retries, replays, duplicate submissions, or concurrent recomputations for the same amendment-resolution identity must return the same amended configuration version, projection effect, amendment/resolution artifact identity, Audit Record identity, and resolution report. After an amendment-resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted amendment and resolution rather than appending another material Audit Record or creating a competing amended version. An amendment attempt that cannot produce this identity or resolve every affected conflict in the same action is rejected without mutation.
- `dec_37d6dc1362febf6d`: Should `Season Configuration Lifecycle` adopt this change (choose policy): After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same administrative action applies an amendment-specific playoff conflict resolution. The permitted amendment resolutions are the same operator choices as authoritative result corrections: halt affected downstream advancement until replacement authoritative outcomes exist under the amended bracket participants and fixed slot sources, or explicitly affirm the existing downstream participant path as an audited administrative exception. The amendment action is rejected without mutating authoritative state, persisted projections, or configuration versions unless it identifies the amended configuration version, changed result-affecting playoff fields, affected Matchups and participant slots, conflicted downstream authoritative Games, chosen resolution type, actor, and reason; resolves every affected conflict in the same action; and writes the required Audit Record and resolution report.
- `dec_45c7934ec257bede`: Should `Courtside Core Domain — Phase 1.02 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.02 Follow-up Candidate

## By Trigger Type

### choose_policy

- decisions: `9`
- human decisions: `9`
- status_counts: `deferred_scope_decision`=3, `operator_review_recommended`=6
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `relax_requirement`, `tighten_requirement`
- rounds: `8`, `12`, `19`
- profiles: `vertical`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Configuration and Reproducibility`, `Game Lifecycle`, `Season Configuration Lifecycle`, `Venues, Media, and Audit`
- decision_ids: `dec_0d822e97cf6efa6c`, `dec_37d6dc1362febf6d`, `dec_4793973379375570`, `dec_746373b1f5a0b5d4`, `dec_7640465f98dfb83e`, `dec_e5174d42f4a07d79`, `dec_01658c6e6caf46c5`, `dec_3f8a489b93312f3e`, `dec_873809464fe1c201`

Representative decisions:
- `dec_0d822e97cf6efa6c`: Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted playoff-configuration amendment resolution is composed of the prior frozen configuration version, amended configuration version, canonical identity of the changed playoff result-affecting fields, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots and downstream authoritative Games are canonicalized by the same rules used for authoritative result-correction resolutions. Retries, replays, duplicate submissions, or concurrent recomputations for the same amendment-resolution identity must return the same amended configuration version, projection effect, amendment/resolution artifact identity, Audit Record identity, and resolution report. After an amendment-resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted amendment and resolution rather than appending another material Audit Record or creating a competing amended version. An amendment attempt that cannot produce this identity or resolve every affected conflict in the same action is rejected without mutation.
- `dec_37d6dc1362febf6d`: Should `Season Configuration Lifecycle` adopt this change (choose policy): After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same administrative action applies an amendment-specific playoff conflict resolution. The permitted amendment resolutions are the same operator choices as authoritative result corrections: halt affected downstream advancement until replacement authoritative outcomes exist under the amended bracket participants and fixed slot sources, or explicitly affirm the existing downstream participant path as an audited administrative exception. The amendment action is rejected without mutating authoritative state, persisted projections, or configuration versions unless it identifies the amended configuration version, changed result-affecting playoff fields, affected Matchups and participant slots, conflicted downstream authoritative Games, chosen resolution type, actor, and reason; resolves every affected conflict in the same action; and writes the required Audit Record and resolution report.
- `dec_4793973379375570`: Should `Configuration and Reproducibility` adopt this change (tighten requirement, choose policy): The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes reuse that frozen version. Concurrent or retried first-freeze attempts compare canonical result-affecting configuration basis identity; equal identities reuse existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions. Later amendments require League Administrator authority and an Audit Record. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution. A playoff-configuration amendment after dependent authoritative playoff Games must use an amendment-specific resolution report and deterministic identity; it is not identified as a corrected Game-result value. Historical versions remain available. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic. Configuration cannot enable tied final Games. Unknown playoff policies, ranking criteria, or lifecycle transitions are rejected rather than silently interpreted.

### relax_requirement

- decisions: `1`
- human decisions: `1`
- status_counts: `operator_review_recommended`=1
- actions: `present_at_end`
- decision_types: `choose_policy`
- trigger_types: `choose_policy`, `relax_requirement`
- rounds: `8`
- profiles: `vertical`
- sections: `Venues, Media, and Audit`
- decision_ids: `dec_746373b1f5a0b5d4`

Representative decisions:
- `dec_746373b1f5a0b5d4`: Should `Venues, Media, and Audit` adopt this change (relax requirement, choose policy): A Venue is reusable and League-owned; a Game may reference at most one Venue. A Media item may be associated with a Game, League Gallery, or both without duplicating Media identity. Every material Audit Record contains actor, timestamp, action, previous value, and new value. Audit reasons are optional except for authoritative Game-result corrections, where a reason is mandatory. Audit history is append-only. Required rejection reports identify entity, current state or condition, requested mutation, actor, violated rule, and state-preservation outcome. Accepted playoff correction resolution reports identify halted slots or Matchups, conflicted downstream Games retained as historical records, corrected-path records excluded from current advancement, resume condition, and canonicalized resolution identity used for deterministic retries. Accepted playoff-configuration amendment resolution reports identify the prior and amended configuration versions, changed playoff result-affecting fields, halted or affirmed slots or Matchups, conflicted downstream Games retained as historical records, current advancement effect, resume condition when halted, and canonicalized amendment-resolution identity used for deterministic retries.

### scope_change

- decisions: `5`
- human decisions: `5`
- status_counts: `deferred_scope_decision`=1, `operator_review_recommended`=4
- actions: `present_at_end`
- decision_types: `scope_change`
- trigger_types: `scope_change`, `tighten_requirement`
- rounds: `4`, `8`, `12`, `19`
- profiles: `vertical`
- sections: `Core Mutation Authority`, `Courtside Core Domain — Phase 1.01 Follow-up Candidate`, `Courtside Core Domain — Phase 1.02 Follow-up Candidate`, `Courtside Core Domain — Phase 1.03 Follow-up Candidate`, `Courtside Core Domain — Phase 1.04 Follow-up Candidate`
- decision_ids: `dec_aa501cdd2297e2c2`, `dec_45c7934ec257bede`, `dec_c8be2d3af12d74d2`, `dec_6a71ba153b5a65e3`, `dec_c802fb9e2132d641`

Representative decisions:
- `dec_aa501cdd2297e2c2`: Should `Courtside Core Domain — Phase 1.01 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.01 Follow-up Candidate
- `dec_45c7934ec257bede`: Should `Courtside Core Domain — Phase 1.02 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.02 Follow-up Candidate
- `dec_c8be2d3af12d74d2`: Should `Courtside Core Domain — Phase 1.03 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.03 Follow-up Candidate

### tighten_requirement

- decisions: `8`
- human decisions: `8`
- status_counts: `deferred_scope_decision`=5, `operator_review_recommended`=3
- actions: `present_at_end`
- decision_types: `choose_policy`, `scope_change`, `tighten_requirement`
- trigger_types: `choose_policy`, `scope_change`, `tighten_requirement`
- rounds: `4`, `8`, `12`, `19`
- profiles: `vertical`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Configuration and Reproducibility`, `Core Mutation Authority`, `Game Lifecycle`
- decision_ids: `dec_eb288bc65d9dd4d9`, `dec_0d822e97cf6efa6c`, `dec_4793973379375570`, `dec_7640465f98dfb83e`, `dec_e5174d42f4a07d79`, `dec_01658c6e6caf46c5`, `dec_3f8a489b93312f3e`, `dec_c802fb9e2132d641`

Representative decisions:
- `dec_eb288bc65d9dd4d9`: Should `Core Mutation Authority` adopt this change (tighten requirement): For the approved Player profile surface, `display_name` is the required League-visible Player name used for ordinary display and administrative identification. An accepted `display_name` update replaces the prior value, must preserve a non-empty language-neutral proper name value, and must reject unsupported or blank values without mutation. `profile_photo` is an optional Player profile-photo reference distinct from the reusable Media items associated with Games or the League Gallery. It may be set, replaced, or cleared by an actor authorized for the linked Player profile. An accepted `profile_photo` update stores a stable reference to a supported uploaded or externally hosted photo identity without implying any Game or Gallery Media association; unsupported reference forms, non-photo references, or values that cannot be retained as a stable Player profile-photo identity are rejected without mutation. Accepted updates to either field preserve the prior and new value in audit or equivalent profile-change history with actor, timestamp, action, and optional reason.
- `dec_0d822e97cf6efa6c`: Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted playoff-configuration amendment resolution is composed of the prior frozen configuration version, amended configuration version, canonical identity of the changed playoff result-affecting fields, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots and downstream authoritative Games are canonicalized by the same rules used for authoritative result-correction resolutions. Retries, replays, duplicate submissions, or concurrent recomputations for the same amendment-resolution identity must return the same amended configuration version, projection effect, amendment/resolution artifact identity, Audit Record identity, and resolution report. After an amendment-resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted amendment and resolution rather than appending another material Audit Record or creating a competing amended version. An amendment attempt that cannot produce this identity or resolve every affected conflict in the same action is rejected without mutation.
- `dec_4793973379375570`: Should `Configuration and Reproducibility` adopt this change (tighten requirement, choose policy): The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes reuse that frozen version. Concurrent or retried first-freeze attempts compare canonical result-affecting configuration basis identity; equal identities reuse existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions. Later amendments require League Administrator authority and an Audit Record. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution. A playoff-configuration amendment after dependent authoritative playoff Games must use an amendment-specific resolution report and deterministic identity; it is not identified as a corrected Game-result value. Historical versions remain available. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic. Configuration cannot enable tied final Games. Unknown playoff policies, ranking criteria, or lifecycle transitions are rejected rather than silently interpreted.
