# Decision Register

- mode: `end_of_cycle`
- terminal_state: `PHASE_1_STABLE`
- decision_status_counts: `deferred_scope_decision`=5, `operator_review_recommended`=10
- unresolved_human_decision_count: `15`

## dec_c8be2d3af12d74d2

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Courtside Core Domain — Phase 1.03 Follow-up Candidate

Should `Courtside Core Domain — Phase 1.03 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.03 Follow-up Candidate

Evidence:
- # Courtside Core Domain — Phase 1.03 Follow-up Candidate

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_e5174d42f4a07d79

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `12`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Game Lifecycle

Should `Game Lifecycle` adopt this change (tighten requirement, choose policy): Every scheduled instant is interpreted in the League configured IANA timezone and stored as an unambiguous instant. Administrative scheduled-instant entry, including initial scheduling and rescheduling, must identify exactly one instant in the League configured IANA timezone before the Game is mutated. A local scheduled value that is ambiguous during a daylight-saving overlap, nonexistent during a daylight-saving gap, or otherwise cannot identify one unambiguous instant is rejected without mutation unless the administrative input supplies enough offset or disambiguation information to identify exactly one instant. The rejection report must identify the Game, attempted scheduled value, League timezone, actor, violated scheduling rule, and confirmation that authoritative Game state and schedule history remain unchanged. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history.

Evidence:
- Every scheduled instant is interpreted in the League configured IANA timezone and stored as an unambiguous instant. Administrative scheduled-instant entry, including initial scheduling and rescheduling, must identify exactly one instant in the League configured IANA timezone before the Game is mutated. A local scheduled value that is ambiguous during a daylight-saving overlap, nonexistent during a daylight-saving gap, or otherwise cannot identify one unambiguous instant is rejected without mutation unless the administrative input supplies enough offset or disambiguation information to identify exactly one instant. The rejection report must identify the Game, attempted scheduled value, League timezone, actor, violated scheduling rule, and confirmation that authoritative Game state and schedule history remain unchanged. Scheduling changes must preserve operational history containing actor, timestamp, action, previous scheduled instant and status when present, new scheduled instant and status when present, and optional reason. This history may be represented as an Audit Record or as separate schedule history.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_6a71ba153b5a65e3

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `19`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Courtside Core Domain — Phase 1.04 Follow-up Candidate

Should `Courtside Core Domain — Phase 1.04 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.04 Follow-up Candidate

Evidence:
- # Courtside Core Domain — Phase 1.04 Follow-up Candidate

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_c802fb9e2132d641

- type: `scope_change`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `scope_change`
- round: `19`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (tighten requirement, scope change): For the approved Player profile surface, `display_name` is the required League-visible Player name used for ordinary display and administrative identification. An accepted `display_name` update replaces the prior value, must preserve a non-empty language-neutral proper name value, and must reject unsupported or blank values without mutation. `profile_photo` is an optional Player profile-photo reference distinct from the reusable Media items associated with Games or the League Gallery. It may be set, replaced, or cleared by an actor authorized for the linked Player profile. An accepted `profile_photo` update stores a stable reference to a supported uploaded or externally hosted photo identity without implying any Game or Gallery Media association; unsupported reference forms, non-photo references, or values that cannot be retained as a stable Player profile-photo identity are rejected without mutation. Accepted updates to either field write an Audit Record preserving the prior and new value with actor, timestamp, action, and optional reason. The Audit Record is the required operational artifact for inspecting accepted Player profile field changes; no separate profile-change history substitutes for that mandatory audit surface in Phase 1.

Evidence:
- For the approved Player profile surface, `display_name` is the required League-visible Player name used for ordinary display and administrative identification. An accepted `display_name` update replaces the prior value, must preserve a non-empty language-neutral proper name value, and must reject unsupported or blank values without mutation. `profile_photo` is an optional Player profile-photo reference distinct from the reusable Media items associated with Games or the League Gallery. It may be set, replaced, or cleared by an actor authorized for the linked Player profile. An accepted `profile_photo` update stores a stable reference to a supported uploaded or externally hosted photo identity without implying any Game or Gallery Media association; unsupported reference forms, non-photo references, or values that cannot be retained as a stable Player profile-photo identity are rejected without mutation. Accepted updates to either field write an Audit Record preserving the prior and new value with actor, timestamp, action, and optional reason. The Audit Record is the required operational artifact for inspecting accepted Player profile field changes; no separate profile-change history substitutes for that mandatory audit surface in Phase 1.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_3f8a489b93312f3e

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`, `choose_policy`
- round: `19`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted correction resolution is composed of the corrected Game, the prior authoritative result value, the prior authoritative result audit or version identity being corrected, the corrected authoritative value, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots are canonicalized by fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within fixed bracket order. Identity equality is based on canonicalized content, not traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, duplicate submissions, or concurrent recomputations for the same material correction action must return the same projection effect, correction/resolution artifact identity, Audit Record identity, and resolution report. A later correction of the same Game back to a previously used authoritative value is a distinct resolution identity when it corrects a different prior authoritative result value or prior result audit or version identity. After a resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted correction and resolution rather than appending another material Audit Record or creating a competing acceptance. If an implementation records non-authoritative retry-attempt telemetry, that telemetry is separate from the authoritative append-only Audit Record surface and does not affect projection identity, audit identity, or resolution status. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

Evidence:
- The deterministic identity of an accepted correction resolution is composed of the corrected Game, the prior authoritative result value, the prior authoritative result audit or version identity being corrected, the corrected authoritative value, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots are canonicalized by fixed bracket path or immutable slot identity, and downstream authoritative Games are canonicalized by immutable canonical Game identity within fixed bracket order. Identity equality is based on canonicalized content, not traversal order, storage order, report ordering, discovery order, display labels, or mutable implementation identifiers. Retries, replays, duplicate submissions, or concurrent recomputations for the same material correction action must return the same projection effect, correction/resolution artifact identity, Audit Record identity, and resolution report. A later correction of the same Game back to a previously used authoritative value is a distinct resolution identity when it corrects a different prior authoritative result value or prior result audit or version identity. After a resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted correction and resolution rather than appending another material Audit Record or creating a competing acceptance. If an implementation records non-authoritative retry-attempt telemetry, that telemetry is separate from the authoritative append-only Audit Record surface and does not affect projection identity, audit identity, or resolution status. They must not create an alternate participant projection, silently consume historically visible conflicted Games for advancement, or require an operator to resolve the same accepted halt again.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_873809464fe1c201

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `19`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Audit Configuration

Should `Audit Configuration` adopt this change (choose policy): Audit Records contain actor, timestamp, action, previous value, new value, and reason, with reason optional unless otherwise required. Auditing is mandatory for finalized or forfeited Game-result corrections with a required reason, accepted Player `display_name` and `profile_photo` updates, material Player-stat changes, Roster Membership changes, Player Management Relationship approvals and revocations, League Administrator and Team Captain assignment changes, frozen Season configuration amendments, persisted random-draw tiebreak results, playoff correction conflict resolutions, and scheduling changes unless required scheduling-change history is preserved outside Audit Records.

Evidence:
- Audit Records contain actor, timestamp, action, previous value, new value, and reason, with reason optional unless otherwise required. Auditing is mandatory for finalized or forfeited Game-result corrections with a required reason, accepted Player `display_name` and `profile_photo` updates, material Player-stat changes, Roster Membership changes, Player Management Relationship approvals and revocations, League Administrator and Team Captain assignment changes, frozen Season configuration amendments, persisted random-draw tiebreak results, playoff correction conflict resolutions, and scheduling changes unless required scheduling-change history is preserved outside Audit Records.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_01658c6e6caf46c5

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`, `choose_policy`
- round: `19`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Audit Configuration

Should `Audit Configuration` adopt this change (tighten requirement, choose policy): An Audit Record for a playoff correction conflict resolution must include resolution type, prior authoritative result value, prior authoritative result audit or version identity being corrected, corrected authoritative value, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. An Audit Record for a playoff-configuration amendment resolution must include the prior frozen configuration version, amended configuration version, changed playoff result-affecting fields, resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized amendment-resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The canonicalized resolution identity is also the idempotency key for authoritative correction-resolution audit persistence: once accepted, duplicate submissions, retries, replays, and concurrent recomputations reuse the existing Audit Record identity and do not append another material Audit Record for the same accepted resolution. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff, including whether the request created a new accepted resolution or returned the prior acceptance.

Evidence:
- An Audit Record for a playoff correction conflict resolution must include resolution type, prior authoritative result value, prior authoritative result audit or version identity being corrected, corrected authoritative value, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. An Audit Record for a playoff-configuration amendment resolution must include the prior frozen configuration version, amended configuration version, changed playoff result-affecting fields, resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized amendment-resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The canonicalized resolution identity is also the idempotency key for authoritative correction-resolution audit persistence: once accepted, duplicate submissions, retries, replays, and concurrent recomputations reuse the existing Audit Record identity and do not append another material Audit Record for the same accepted resolution. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff, including whether the request created a new accepted resolution or returned the prior acceptance.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_aa501cdd2297e2c2

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Courtside Core Domain — Phase 1.01 Follow-up Candidate

Should `Courtside Core Domain — Phase 1.01 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.01 Follow-up Candidate

Evidence:
- # Courtside Core Domain — Phase 1.01 Follow-up Candidate

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_eb288bc65d9dd4d9

- type: `tighten_requirement`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`
- round: `4`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Core Mutation Authority

Should `Core Mutation Authority` adopt this change (tighten requirement): For the approved Player profile surface, `display_name` is the required League-visible Player name used for ordinary display and administrative identification. An accepted `display_name` update replaces the prior value, must preserve a non-empty language-neutral proper name value, and must reject unsupported or blank values without mutation. `profile_photo` is an optional Player profile-photo reference distinct from the reusable Media items associated with Games or the League Gallery. It may be set, replaced, or cleared by an actor authorized for the linked Player profile. An accepted `profile_photo` update stores a stable reference to a supported uploaded or externally hosted photo identity without implying any Game or Gallery Media association; unsupported reference forms, non-photo references, or values that cannot be retained as a stable Player profile-photo identity are rejected without mutation. Accepted updates to either field preserve the prior and new value in audit or equivalent profile-change history with actor, timestamp, action, and optional reason.

Evidence:
- For the approved Player profile surface, `display_name` is the required League-visible Player name used for ordinary display and administrative identification. An accepted `display_name` update replaces the prior value, must preserve a non-empty language-neutral proper name value, and must reject unsupported or blank values without mutation. `profile_photo` is an optional Player profile-photo reference distinct from the reusable Media items associated with Games or the League Gallery. It may be set, replaced, or cleared by an actor authorized for the linked Player profile. An accepted `profile_photo` update stores a stable reference to a supported uploaded or externally hosted photo identity without implying any Game or Gallery Media association; unsupported reference forms, non-photo references, or values that cannot be retained as a stable Player profile-photo identity are rejected without mutation. Accepted updates to either field preserve the prior and new value in audit or equivalent profile-change history with actor, timestamp, action, and optional reason.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_45c7934ec257bede

- type: `scope_change`
- status: `operator_review_recommended`
- triggers: `scope_change`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Courtside Core Domain — Phase 1.02 Follow-up Candidate

Should `Courtside Core Domain — Phase 1.02 Follow-up Candidate` adopt this change (scope change): # Courtside Core Domain — Phase 1.02 Follow-up Candidate

Evidence:
- # Courtside Core Domain — Phase 1.02 Follow-up Candidate

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_37d6dc1362febf6d

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `choose_policy`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Season Configuration Lifecycle

Should `Season Configuration Lifecycle` adopt this change (choose policy): After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same administrative action applies an amendment-specific playoff conflict resolution. The permitted amendment resolutions are the same operator choices as authoritative result corrections: halt affected downstream advancement until replacement authoritative outcomes exist under the amended bracket participants and fixed slot sources, or explicitly affirm the existing downstream participant path as an audited administrative exception. The amendment action is rejected without mutating authoritative state, persisted projections, or configuration versions unless it identifies the amended configuration version, changed result-affecting playoff fields, affected Matchups and participant slots, conflicted downstream authoritative Games, chosen resolution type, actor, and reason; resolves every affected conflict in the same action; and writes the required Audit Record and resolution report.

Evidence:
- After any dependent authoritative Game outcome exists, a frozen result-affecting configuration amendment is legal only if it preserves existing authoritative state or resolves every affected derived-state conflict in the same administrative action. Amendments that change playoff Round structure, configured Games per Matchup, participant slot sources, advancement rule, or aggregate-tiebreak policy are prohibited once dependent authoritative playoff Games exist unless the same administrative action applies an amendment-specific playoff conflict resolution. The permitted amendment resolutions are the same operator choices as authoritative result corrections: halt affected downstream advancement until replacement authoritative outcomes exist under the amended bracket participants and fixed slot sources, or explicitly affirm the existing downstream participant path as an audited administrative exception. The amendment action is rejected without mutating authoritative state, persisted projections, or configuration versions unless it identifies the amended configuration version, changed result-affecting playoff fields, affected Matchups and participant slots, conflicted downstream authoritative Games, chosen resolution type, actor, and reason; resolves every affected conflict in the same action; and writes the required Audit Record and resolution report.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_0d822e97cf6efa6c

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Authoritative Result Corrections

Should `Authoritative Result Corrections` adopt this change (tighten requirement, choose policy): The deterministic identity of an accepted playoff-configuration amendment resolution is composed of the prior frozen configuration version, amended configuration version, canonical identity of the changed playoff result-affecting fields, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots and downstream authoritative Games are canonicalized by the same rules used for authoritative result-correction resolutions. Retries, replays, duplicate submissions, or concurrent recomputations for the same amendment-resolution identity must return the same amended configuration version, projection effect, amendment/resolution artifact identity, Audit Record identity, and resolution report. After an amendment-resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted amendment and resolution rather than appending another material Audit Record or creating a competing amended version. An amendment attempt that cannot produce this identity or resolve every affected conflict in the same action is rejected without mutation.

Evidence:
- The deterministic identity of an accepted playoff-configuration amendment resolution is composed of the prior frozen configuration version, amended configuration version, canonical identity of the changed playoff result-affecting fields, affected participant slots, downstream authoritative Games that create the conflict, and chosen resolution type. Affected participant slots and downstream authoritative Games are canonicalized by the same rules used for authoritative result-correction resolutions. Retries, replays, duplicate submissions, or concurrent recomputations for the same amendment-resolution identity must return the same amended configuration version, projection effect, amendment/resolution artifact identity, Audit Record identity, and resolution report. After an amendment-resolution identity has been accepted, a later attempt with the same identity reuses the prior accepted amendment and resolution rather than appending another material Audit Record or creating a competing amended version. An amendment attempt that cannot produce this identity or resolve every affected conflict in the same action is rejected without mutation.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_4793973379375570

- type: `choose_policy`
- status: `deferred_scope_decision`
- triggers: `tighten_requirement`, `choose_policy`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Configuration and Reproducibility

Should `Configuration and Reproducibility` adopt this change (tighten requirement, choose policy): The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes reuse that frozen version. Concurrent or retried first-freeze attempts compare canonical result-affecting configuration basis identity; equal identities reuse existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions. Later amendments require League Administrator authority and an Audit Record. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution. A playoff-configuration amendment after dependent authoritative playoff Games must use an amendment-specific resolution report and deterministic identity; it is not identified as a corrected Game-result value. Historical versions remain available. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic. Configuration cannot enable tied final Games. Unknown playoff policies, ranking criteria, or lifecycle transitions are rejected rather than silently interpreted.

Evidence:
- The first accepted `final` or `forfeit` Game freezes a single versioned snapshot of result-affecting Season configuration, and retries or later authoritative outcomes reuse that frozen version. Concurrent or retried first-freeze attempts compare canonical result-affecting configuration basis identity; equal identities reuse existing frozen version, and unequal identities are rejected without mutating authoritative state, persisted projections, or configuration versions. Later amendments require League Administrator authority and an Audit Record. A result-affecting amendment that conflicts with existing authoritative Game outcomes or playoff state must preserve authoritative state through rejection or same-action administrative resolution. A playoff-configuration amendment after dependent authoritative playoff Games must use an amendment-specific resolution report and deterministic identity; it is not identified as a corrected Game-result value. Historical versions remain available. Given the same authoritative outcomes, adjustment records, persisted random draws, accepted correction resolutions, and configuration version, standings and playoff advancement are deterministic. Configuration cannot enable tied final Games. Unknown playoff policies, ranking criteria, or lifecycle transitions are rejected rather than silently interpreted.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_746373b1f5a0b5d4

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `relax_requirement`, `choose_policy`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Venues, Media, and Audit

Should `Venues, Media, and Audit` adopt this change (relax requirement, choose policy): A Venue is reusable and League-owned; a Game may reference at most one Venue. A Media item may be associated with a Game, League Gallery, or both without duplicating Media identity. Every material Audit Record contains actor, timestamp, action, previous value, and new value. Audit reasons are optional except for authoritative Game-result corrections, where a reason is mandatory. Audit history is append-only. Required rejection reports identify entity, current state or condition, requested mutation, actor, violated rule, and state-preservation outcome. Accepted playoff correction resolution reports identify halted slots or Matchups, conflicted downstream Games retained as historical records, corrected-path records excluded from current advancement, resume condition, and canonicalized resolution identity used for deterministic retries. Accepted playoff-configuration amendment resolution reports identify the prior and amended configuration versions, changed playoff result-affecting fields, halted or affirmed slots or Matchups, conflicted downstream Games retained as historical records, current advancement effect, resume condition when halted, and canonicalized amendment-resolution identity used for deterministic retries.

Evidence:
- A Venue is reusable and League-owned; a Game may reference at most one Venue. A Media item may be associated with a Game, League Gallery, or both without duplicating Media identity. Every material Audit Record contains actor, timestamp, action, previous value, and new value. Audit reasons are optional except for authoritative Game-result corrections, where a reason is mandatory. Audit history is append-only. Required rejection reports identify entity, current state or condition, requested mutation, actor, violated rule, and state-preservation outcome. Accepted playoff correction resolution reports identify halted slots or Matchups, conflicted downstream Games retained as historical records, corrected-path records excluded from current advancement, resume condition, and canonicalized resolution identity used for deterministic retries. Accepted playoff-configuration amendment resolution reports identify the prior and amended configuration versions, changed playoff result-affecting fields, halted or affirmed slots or Matchups, conflicted downstream Games retained as historical records, current advancement effect, resume condition when halted, and canonicalized amendment-resolution identity used for deterministic retries.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.

## dec_7640465f98dfb83e

- type: `choose_policy`
- status: `operator_review_recommended`
- triggers: `tighten_requirement`, `choose_policy`
- round: `8`
- profile: `vertical`
- action: `present_at_end`
- requires_human_decision: `true`
- affected_sections: Audit Configuration

Should `Audit Configuration` adopt this change (tighten requirement, choose policy): An Audit Record for a playoff correction conflict resolution must include resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. An Audit Record for a playoff-configuration amendment resolution must include the prior frozen configuration version, amended configuration version, changed playoff result-affecting fields, resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized amendment-resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The canonicalized resolution identity is also the idempotency key for authoritative correction-resolution audit persistence: once accepted, duplicate submissions, retries, replays, and concurrent recomputations reuse the existing Audit Record identity and do not append another material Audit Record for the same accepted resolution. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff, including whether the request created a new accepted resolution or returned the prior acceptance.

Evidence:
- An Audit Record for a playoff correction conflict resolution must include resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. An Audit Record for a playoff-configuration amendment resolution must include the prior frozen configuration version, amended configuration version, changed playoff result-affecting fields, resolution type, affected participant slots, conflicted downstream authoritative Games, canonicalized amendment-resolution identity, and whether affected advancement is halted or an existing downstream participant path is affirmed as an administrative exception. The canonicalized resolution identity is also the idempotency key for authoritative correction-resolution audit persistence: once accepted, duplicate submissions, retries, replays, and concurrent recomputations reuse the existing Audit Record identity and do not append another material Audit Record for the same accepted resolution. The corresponding resolution report must expose the same information needed to reproduce retry behavior and operator handoff, including whether the request created a new accepted resolution or returned the prior acceptance.

Risk if wrong: The spec may silently encode a policy, scope, authority, or operational choice the owner did not intend.
