# Operator Decision Checkpoint Summary

- terminal_state: `TARGET_NOT_REACHED`
- checkpoint_count: `148`
- rounds_with_checkpoints: `4`, `8`, `12`, `16`, `20`, `24`, `27`
- trigger_reason_counts: `deferable_scope_boundary`=78, `operator_policy_choice`=70
- source_type_counts: `decision_point`=148
- summary_method: `mechanical_checkpoint_v1`

## Recommended Operator Review

### chk_194a45334fa3c8f6

- round: `4`
- profile: `vertical`
- trigger_reason: `deferable_scope_boundary`
- source_type: `decision_point`
- sections: `Playoffs`
- recommended_option_id: `accept_editor_choice`

Should `Playoffs` adopt this change (tighten requirement, choose policy): 10. A playoff Matchup with incomplete authoritative Game outcomes or an unresolved participant conflict must not advance automatically.

### chk_283503e9d866a579

- round: `4`
- profile: `vertical`
- trigger_reason: `deferable_scope_boundary`
- source_type: `decision_point`
- sections: `Playoff Matchup Lifecycle`
- recommended_option_id: `accept_editor_choice`

Should `Playoff Matchup Lifecycle` adopt this change (tighten requirement): Playoff Games use the ordinary Game lifecycle. Playoff outcomes do not contribute to regular-season standings. A Matchup with incomplete configured Games, a tied aggregate after all permitted tiebreak handling, an unknown tiebreak policy, or a blocked participant-resolution conflict must not advance automatically and must report the violated rule.

### chk_36a6e12e480596e3

- round: `4`
- profile: `vertical`
- trigger_reason: `deferable_scope_boundary`
- source_type: `decision_point`
- sections: `Authorization Configuration`
- recommended_option_id: `accept_editor_choice`

Should `Authorization Configuration` adopt this change (choose policy, scope change): League Administrators assign, reassign, and revoke Team Captain authority and approve or revoke Player Management Relationships. League Administrators also hold Phase 1 authority for core Game lifecycle mutations, authoritative result corrections, Roster Membership changes, Player Stat Line creation and material changes, frozen Season configuration amendments, persisted random-draw conflict resolution, and playoff correction conflict resolution. Team Captain authority is a scoped role marker in Phase 1 and does not add independent mutation permissions unless a later accepted specification defines them. Adding roles or changing their authority requires an accepted specification update.

### chk_5be0812ef2c7b3f2

- round: `4`
- profile: `vertical`
- trigger_reason: `deferable_scope_boundary`
- source_type: `decision_point`
- sections: `General Lifecycle Failure Rule`
- recommended_option_id: `accept_editor_choice`

Should `General Lifecycle Failure Rule` adopt this change (tighten requirement, choose policy, scope change): For every lifecycle-bearing Courtside domain entity, a transition that is not explicitly permitted by this specification must be rejected without mutating authoritative state. The rejection report must identify the entity, the current state or condition, the requested state or mutation, the actor, and the violated lifecycle rule. Auditing rejected attempts is not required by this Phase 1 domain specification unless the audit policy for that surface explicitly requires it.

### chk_70bce51a37b27e69

- round: `4`
- profile: `vertical`
- trigger_reason: `deferable_scope_boundary`
- source_type: `decision_point`
- sections: `Core Mutation Authority`
- recommended_option_id: `accept_editor_choice`

Should `Core Mutation Authority` adopt this change (scope change): Team Captain assignments are scoped to one Season Team and are auditable role assignments. In Phase 1 they do not independently authorize core domain mutations unless a later accepted specification grants a specific Team Captain permission.

## By Trigger Reason

### deferable_scope_boundary

- checkpoints: `78`
- rounds: `4`, `8`, `12`, `16`, `20`, `24`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Authority and Precedence`, `Authorization`, `Authorization Configuration`, `Canonical Concepts`, `Configuration and Reproducibility`, `Consequences`, `Core Mutation Authority`, `Courtside Core Domain — Isolated Phase 1.01 Composite`, `Courtside Core Domain — Isolated Phase 1.02 Composite`, `Courtside Core Domain — Isolated Phase 1.03 Composite`, `Courtside Core Domain — Isolated Phase 1.04 Composite`, `Courtside Core Domain — Isolated Phase 1.05 Composite`, `Courtside Core Domain — Isolated Phase 1.06 Composite`, `Courtside Core Domain — Isolated Phase 1.07 Composite`, `Derived Data Authority`, `Game Lifecycle`, `Game and Venue Configuration`, `Games and Results`, `General Lifecycle Failure Rule`, `Localization Configuration`, `Playoff Matchup Lifecycle`, `Playoffs`, `Role Assignment`, `Role Assignment Lifecycle`, `Roster Membership Lifecycle`, `Scheduling Transitions`, `Season Configuration Lifecycle`, `Standing Calculations`, `Standings`, `Standings Configuration`, `Standings Lifecycle`, `Statistics Configuration`
- checkpoint_ids: `chk_194a45334fa3c8f6`, `chk_283503e9d866a579`, `chk_36a6e12e480596e3`, `chk_5be0812ef2c7b3f2`, `chk_70bce51a37b27e69`, `chk_7b9cf3023460674c`, `chk_9265e5b6a15c7db5`, `chk_976679f78207414b`, `chk_9db3daf3dbf553b1`, `chk_b326ece3d5d16868`, `chk_bd468f49c98c78bc`, `chk_cd2ba896d68b3186`, `chk_d7a8406898038dd5`, `chk_dd93d510c02fe8b4`, `chk_1a2da5611caf6829`, `chk_4fa98892e9462fb5`, `chk_544551838c91c932`, `chk_5b5ed45288b3abe9`, `chk_b1abd1a9f3e20177`, `chk_be3eb11f4ca23fb9`, `chk_bedfb8e44ac48619`, `chk_d188d42eff521386`, `chk_eaecc194b5145182`, `chk_fe021eb074e61c9a`, `chk_8114d978ed174234`, `chk_8db3d98a2bdf9ba6`, `chk_9dad9b29838b4f97`, `chk_ccb0ab041c21b90e`, `chk_f5417d35effa335f`, `chk_f67269cea9338b09`, `chk_07b988825ac7de14`, `chk_111e0c1b69115f3d`, `chk_1d295aa3968c7826`, `chk_2e6c1a11e097d7ed`, `chk_52aa1c703a765345`, `chk_6cf2f6164df3576b`, `chk_750dd9c59353cc69`, `chk_7708121beb96f845`, `chk_80f43870c3a7a7d9`, `chk_bf7411ff85934478`, `chk_c1845b80d45f50d8`, `chk_e2a236c63bd0f4f8`, `chk_ef44ed43c5ac0847`, `chk_0f73c23755363729`, `chk_12bb6b05519fa07f`, `chk_8a8ac0043f9ea6ea`, `chk_25329c1aaa20597c`, `chk_4a80d01b495200ba`, `chk_834c720148b738fd`, `chk_01755340f7bb2246`, `chk_044ba98066d6daf3`, `chk_05c966998be80a92`, `chk_06e7764ce2a78bf6`, `chk_0dceac2f71a603fe`, `chk_111f2de24885c0e8`, `chk_11436080234b2f3d`, `chk_165e5d29fdfeae28`, `chk_1d9225f06571254b`, `chk_33e091c88413b5bf`, `chk_488d2423f61db350`, `chk_4a3b0ff0cefd37c3`, `chk_62fa9d453c0eef0f`, `chk_6b19bcdc477f315f`, `chk_6cb40f495a604286`, `chk_7782d6ff8a76be54`, `chk_81a12f2abb30bfe0`, `chk_841df734049b8b9f`, `chk_953601ac12a4f650`, `chk_b479601f52a04364`, `chk_b4d407bf6d331df5`, `chk_be964f3cf8f77cc7`, `chk_cb5f2a10c19547aa`, `chk_d0fb3d750b78c6f3`, `chk_d83c7da3b02f657a`, `chk_d9368df018ae932e`, `chk_f0f4bd2ec6f50c0b`, `chk_f3fdb47eb9f0fbc1`, `chk_f61de14affe60e32`

### operator_policy_choice

- checkpoints: `70`
- rounds: `4`, `8`, `12`, `16`, `20`, `24`, `27`
- profiles: `vertical`
- trigger_reasons: `operator_policy_choice`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Authority and Precedence`, `Authorization`, `Canonical Concepts`, `Competition Transitions`, `Configuration and Reproducibility`, `Context`, `Core Mutation Authority`, `Decision`, `Game Lifecycle`, `Games and Results`, `Identity and Participation`, `Player Management Lifecycle`, `Player Stat Line Lifecycle`, `Player Statistics`, `Playoff Configuration`, `Playoffs`, `Role Assignment`, `Role Assignment Lifecycle`, `Roster Membership Lifecycle`, `Scope`, `Season Configuration Lifecycle`, `Standings`, `Standings Configuration`, `Standings Lifecycle`, `Venues, Media, and Audit`
- checkpoint_ids: `chk_02565b8c9242b371`, `chk_0c728c360efb05b8`, `chk_59f0ac408b67b931`, `chk_5c52a836557b08f0`, `chk_5dedc3de878248e6`, `chk_6b71c80b35b12c65`, `chk_7ec05c85867f594f`, `chk_8ce5375afe063a68`, `chk_8f177a36130f5461`, `chk_93b383d2a9da99bc`, `chk_9d5d306677877e5c`, `chk_b69074a544e818a2`, `chk_bd2a850f89fe90b7`, `chk_350d557f3124843b`, `chk_8f6f4a5231c3aed4`, `chk_9c4597fde27d4343`, `chk_ede642f8d6bed27b`, `chk_0fa31f08ff648ae2`, `chk_15516a59b42106cc`, `chk_3890dd400fca0687`, `chk_842abdd611b20e21`, `chk_9552404ea35ed3f0`, `chk_a89e34dda4983afd`, `chk_b06c6ef4e97cd1cc`, `chk_b7b547dc966be29f`, `chk_e2821fbf730c9756`, `chk_01fafc8439c53a9f`, `chk_0ec28267f0f8b6d4`, `chk_178fd72099496361`, `chk_26ac6627cae5fd74`, `chk_57196930f89898b0`, `chk_8168de60491bd0aa`, `chk_a0e2282a947f9343`, `chk_da2b9b7e9ae0e3f7`, `chk_4429d50d90e1bb21`, `chk_45b89292a02fe023`, `chk_4ce540e8b69f60f1`, `chk_85d9f14d928c54c7`, `chk_880047b3aa8330f6`, `chk_efaeff1c4678488b`, `chk_55f5a1790338eb3d`, `chk_198d59333ba2172d`, `chk_354dcbc302caeab6`, `chk_454b9366eaba05fd`, `chk_5e6c2d122c6cedce`, `chk_6bb2e19255ead75c`, `chk_73a8326924a0fdce`, `chk_7ecda855d6e900cd`, `chk_7f3bef0370103d7d`, `chk_91e6e64bf84b1583`, `chk_9bc1b6dfe9363ca6`, `chk_a0332bd78b9e808b`, `chk_a2c2aaecc510c476`, `chk_ac78f6a3be97b892`, `chk_b00ec36ad7c79cf5`, `chk_c32f13c6d3ed9992`, `chk_c7459be39f678ab9`, `chk_c78a03c413bfe995`, `chk_d6438e2ec5d19fcc`, `chk_dbc0dc0d21335450`, `chk_e1ce288a8f8a7af1`, `chk_e585511c7124ac02`, `chk_e6991f3fcbbd5976`, `chk_e9e43ea908ef8662`, `chk_eefaacb3ccee0aa4`, `chk_f39a6e54b57a66f3`, `chk_f6e9c165fb710591`, `chk_f7300f59ecdae430`, `chk_f7e3ba0bfc07dc56`, `chk_fb6aa605672eff91`

## By Section

### Audit Configuration

- checkpoints: `4`
- rounds: `20`, `24`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Audit Configuration`
- checkpoint_ids: `chk_0f73c23755363729`, `chk_834c720148b738fd`, `chk_488d2423f61db350`, `chk_9bc1b6dfe9363ca6`

### Authoritative Result Corrections

- checkpoints: `13`
- rounds: `4`, `8`, `20`, `24`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Authoritative Result Corrections`
- checkpoint_ids: `chk_02565b8c9242b371`, `chk_9d5d306677877e5c`, `chk_b326ece3d5d16868`, `chk_cd2ba896d68b3186`, `chk_1a2da5611caf6829`, `chk_4fa98892e9462fb5`, `chk_4429d50d90e1bb21`, `chk_8a8ac0043f9ea6ea`, `chk_25329c1aaa20597c`, `chk_354dcbc302caeab6`, `chk_6b19bcdc477f315f`, `chk_b479601f52a04364`, `chk_f7e3ba0bfc07dc56`

### Authority and Precedence

- checkpoints: `4`
- rounds: `12`, `16`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Authority and Precedence`
- checkpoint_ids: `chk_9552404ea35ed3f0`, `chk_1d295aa3968c7826`, `chk_044ba98066d6daf3`, `chk_f6e9c165fb710591`

### Authorization

- checkpoints: `14`
- rounds: `4`, `12`, `16`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Authorization`
- checkpoint_ids: `chk_6b71c80b35b12c65`, `chk_7b9cf3023460674c`, `chk_9db3daf3dbf553b1`, `chk_bd2a850f89fe90b7`, `chk_d7a8406898038dd5`, `chk_f5417d35effa335f`, `chk_01fafc8439c53a9f`, `chk_0ec28267f0f8b6d4`, `chk_111e0c1b69115f3d`, `chk_2e6c1a11e097d7ed`, `chk_52aa1c703a765345`, `chk_80f43870c3a7a7d9`, `chk_ef44ed43c5ac0847`, `chk_6cb40f495a604286`

### Authorization Configuration

- checkpoints: `4`
- rounds: `4`, `8`, `16`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Authorization Configuration`
- checkpoint_ids: `chk_36a6e12e480596e3`, `chk_fe021eb074e61c9a`, `chk_e2a236c63bd0f4f8`, `chk_841df734049b8b9f`

### Canonical Concepts

- checkpoints: `11`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Canonical Concepts`
- checkpoint_ids: `chk_05c966998be80a92`, `chk_198d59333ba2172d`, `chk_454b9366eaba05fd`, `chk_73a8326924a0fdce`, `chk_a0332bd78b9e808b`, `chk_b00ec36ad7c79cf5`, `chk_cb5f2a10c19547aa`, `chk_d6438e2ec5d19fcc`, `chk_e1ce288a8f8a7af1`, `chk_f39a6e54b57a66f3`, `chk_f61de14affe60e32`

### Competition Transitions

- checkpoints: `1`
- rounds: `20`
- profiles: `vertical`
- trigger_reasons: `operator_policy_choice`
- sections: `Competition Transitions`
- checkpoint_ids: `chk_85d9f14d928c54c7`

### Configuration and Reproducibility

- checkpoints: `9`
- rounds: `12`, `16`, `20`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Configuration and Reproducibility`
- checkpoint_ids: `chk_15516a59b42106cc`, `chk_842abdd611b20e21`, `chk_b7b547dc966be29f`, `chk_178fd72099496361`, `chk_26ac6627cae5fd74`, `chk_57196930f89898b0`, `chk_a0e2282a947f9343`, `chk_880047b3aa8330f6`, `chk_953601ac12a4f650`

### Consequences

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Consequences`
- checkpoint_ids: `chk_d0fb3d750b78c6f3`

### Context

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `operator_policy_choice`
- sections: `Context`
- checkpoint_ids: `chk_e6991f3fcbbd5976`

### Core Mutation Authority

- checkpoints: `10`
- rounds: `4`, `16`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Core Mutation Authority`
- checkpoint_ids: `chk_0c728c360efb05b8`, `chk_5c52a836557b08f0`, `chk_70bce51a37b27e69`, `chk_8ce5375afe063a68`, `chk_9265e5b6a15c7db5`, `chk_93b383d2a9da99bc`, `chk_b69074a544e818a2`, `chk_07b988825ac7de14`, `chk_7708121beb96f845`, `chk_d83c7da3b02f657a`

### Courtside Core Domain — Isolated Phase 1.01 Composite

- checkpoints: `1`
- rounds: `4`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Courtside Core Domain — Isolated Phase 1.01 Composite`
- checkpoint_ids: `chk_bd468f49c98c78bc`

### Courtside Core Domain — Isolated Phase 1.02 Composite

- checkpoints: `1`
- rounds: `8`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Courtside Core Domain — Isolated Phase 1.02 Composite`
- checkpoint_ids: `chk_be3eb11f4ca23fb9`

### Courtside Core Domain — Isolated Phase 1.03 Composite

- checkpoints: `1`
- rounds: `12`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Courtside Core Domain — Isolated Phase 1.03 Composite`
- checkpoint_ids: `chk_8114d978ed174234`

### Courtside Core Domain — Isolated Phase 1.04 Composite

- checkpoints: `1`
- rounds: `16`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Courtside Core Domain — Isolated Phase 1.04 Composite`
- checkpoint_ids: `chk_bf7411ff85934478`

### Courtside Core Domain — Isolated Phase 1.05 Composite

- checkpoints: `1`
- rounds: `20`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Courtside Core Domain — Isolated Phase 1.05 Composite`
- checkpoint_ids: `chk_12bb6b05519fa07f`

### Courtside Core Domain — Isolated Phase 1.06 Composite

- checkpoints: `1`
- rounds: `24`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Courtside Core Domain — Isolated Phase 1.06 Composite`
- checkpoint_ids: `chk_4a80d01b495200ba`

### Courtside Core Domain — Isolated Phase 1.07 Composite

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Courtside Core Domain — Isolated Phase 1.07 Composite`
- checkpoint_ids: `chk_be964f3cf8f77cc7`

### Decision

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `operator_policy_choice`
- sections: `Decision`
- checkpoint_ids: `chk_eefaacb3ccee0aa4`

### Derived Data Authority

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Derived Data Authority`
- checkpoint_ids: `chk_06e7764ce2a78bf6`

### Game Lifecycle

- checkpoints: `3`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Game Lifecycle`
- checkpoint_ids: `chk_33e091c88413b5bf`, `chk_c7459be39f678ab9`, `chk_fb6aa605672eff91`

### Game and Venue Configuration

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Game and Venue Configuration`
- checkpoint_ids: `chk_7782d6ff8a76be54`

### Games and Results

- checkpoints: `4`
- rounds: `4`, `8`, `20`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Games and Results`
- checkpoint_ids: `chk_8f177a36130f5461`, `chk_8f6f4a5231c3aed4`, `chk_efaeff1c4678488b`, `chk_11436080234b2f3d`

### General Lifecycle Failure Rule

- checkpoints: `4`
- rounds: `4`, `8`, `12`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `General Lifecycle Failure Rule`
- checkpoint_ids: `chk_5be0812ef2c7b3f2`, `chk_5b5ed45288b3abe9`, `chk_9dad9b29838b4f97`, `chk_f0f4bd2ec6f50c0b`

### Identity and Participation

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `operator_policy_choice`
- sections: `Identity and Participation`
- checkpoint_ids: `chk_5e6c2d122c6cedce`

### Localization Configuration

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Localization Configuration`
- checkpoint_ids: `chk_62fa9d453c0eef0f`

### Player Management Lifecycle

- checkpoints: `4`
- rounds: `8`, `27`
- profiles: `vertical`
- trigger_reasons: `operator_policy_choice`
- sections: `Player Management Lifecycle`
- checkpoint_ids: `chk_350d557f3124843b`, `chk_9c4597fde27d4343`, `chk_ede642f8d6bed27b`, `chk_7f3bef0370103d7d`

### Player Stat Line Lifecycle

- checkpoints: `2`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `operator_policy_choice`
- sections: `Player Stat Line Lifecycle`
- checkpoint_ids: `chk_6bb2e19255ead75c`, `chk_c32f13c6d3ed9992`

### Player Statistics

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `operator_policy_choice`
- sections: `Player Statistics`
- checkpoint_ids: `chk_c78a03c413bfe995`

### Playoff Configuration

- checkpoints: `2`
- rounds: `12`, `27`
- profiles: `vertical`
- trigger_reasons: `operator_policy_choice`
- sections: `Playoff Configuration`
- checkpoint_ids: `chk_3890dd400fca0687`, `chk_e585511c7124ac02`

### Playoff Matchup Lifecycle

- checkpoints: `3`
- rounds: `4`, `8`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Playoff Matchup Lifecycle`
- checkpoint_ids: `chk_283503e9d866a579`, `chk_544551838c91c932`, `chk_0dceac2f71a603fe`

### Playoffs

- checkpoints: `5`
- rounds: `4`, `8`, `20`, `24`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Playoffs`
- checkpoint_ids: `chk_194a45334fa3c8f6`, `chk_b1abd1a9f3e20177`, `chk_45b89292a02fe023`, `chk_55f5a1790338eb3d`, `chk_d9368df018ae932e`

### Role Assignment

- checkpoints: `3`
- rounds: `4`, `16`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Role Assignment`
- checkpoint_ids: `chk_dd93d510c02fe8b4`, `chk_750dd9c59353cc69`, `chk_8168de60491bd0aa`

### Role Assignment Lifecycle

- checkpoints: `4`
- rounds: `4`, `16`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Role Assignment Lifecycle`
- checkpoint_ids: `chk_976679f78207414b`, `chk_c1845b80d45f50d8`, `chk_da2b9b7e9ae0e3f7`, `chk_f3fdb47eb9f0fbc1`

### Roster Membership Lifecycle

- checkpoints: `3`
- rounds: `20`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Roster Membership Lifecycle`
- checkpoint_ids: `chk_4ce540e8b69f60f1`, `chk_b4d407bf6d331df5`, `chk_e9e43ea908ef8662`

### Scheduling Transitions

- checkpoints: `1`
- rounds: `12`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Scheduling Transitions`
- checkpoint_ids: `chk_ccb0ab041c21b90e`

### Scope

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `operator_policy_choice`
- sections: `Scope`
- checkpoint_ids: `chk_7ecda855d6e900cd`

### Season Configuration Lifecycle

- checkpoints: `8`
- rounds: `12`, `16`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Season Configuration Lifecycle`
- checkpoint_ids: `chk_0fa31f08ff648ae2`, `chk_a89e34dda4983afd`, `chk_b06c6ef4e97cd1cc`, `chk_e2821fbf730c9756`, `chk_6cf2f6164df3576b`, `chk_1d9225f06571254b`, `chk_a2c2aaecc510c476`, `chk_f7300f59ecdae430`

### Standing Calculations

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Standing Calculations`
- checkpoint_ids: `chk_81a12f2abb30bfe0`

### Standings

- checkpoints: `3`
- rounds: `4`, `8`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Standings`
- checkpoint_ids: `chk_5dedc3de878248e6`, `chk_d188d42eff521386`, `chk_165e5d29fdfeae28`

### Standings Configuration

- checkpoints: `5`
- rounds: `4`, `8`, `12`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Standings Configuration`
- checkpoint_ids: `chk_7ec05c85867f594f`, `chk_eaecc194b5145182`, `chk_8db3d98a2bdf9ba6`, `chk_01755340f7bb2246`, `chk_91e6e64bf84b1583`

### Standings Lifecycle

- checkpoints: `5`
- rounds: `4`, `8`, `12`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Standings Lifecycle`
- checkpoint_ids: `chk_59f0ac408b67b931`, `chk_bedfb8e44ac48619`, `chk_f67269cea9338b09`, `chk_111f2de24885c0e8`, `chk_ac78f6a3be97b892`

### Statistics Configuration

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`
- sections: `Statistics Configuration`
- checkpoint_ids: `chk_4a3b0ff0cefd37c3`

### Venues, Media, and Audit

- checkpoints: `1`
- rounds: `27`
- profiles: `vertical`
- trigger_reasons: `operator_policy_choice`
- sections: `Venues, Media, and Audit`
- checkpoint_ids: `chk_dbc0dc0d21335450`

## By Source Type

### decision_point

- checkpoints: `148`
- rounds: `4`, `8`, `12`, `16`, `20`, `24`, `27`
- profiles: `vertical`
- trigger_reasons: `deferable_scope_boundary`, `operator_policy_choice`
- sections: `Audit Configuration`, `Authoritative Result Corrections`, `Authority and Precedence`, `Authorization`, `Authorization Configuration`, `Canonical Concepts`, `Competition Transitions`, `Configuration and Reproducibility`, `Consequences`, `Context`, `Core Mutation Authority`, `Courtside Core Domain — Isolated Phase 1.01 Composite`, `Courtside Core Domain — Isolated Phase 1.02 Composite`, `Courtside Core Domain — Isolated Phase 1.03 Composite`, `Courtside Core Domain — Isolated Phase 1.04 Composite`, `Courtside Core Domain — Isolated Phase 1.05 Composite`, `Courtside Core Domain — Isolated Phase 1.06 Composite`, `Courtside Core Domain — Isolated Phase 1.07 Composite`, `Decision`, `Derived Data Authority`, `Game Lifecycle`, `Game and Venue Configuration`, `Games and Results`, `General Lifecycle Failure Rule`, `Identity and Participation`, `Localization Configuration`, `Player Management Lifecycle`, `Player Stat Line Lifecycle`, `Player Statistics`, `Playoff Configuration`, `Playoff Matchup Lifecycle`, `Playoffs`, `Role Assignment`, `Role Assignment Lifecycle`, `Roster Membership Lifecycle`, `Scheduling Transitions`, `Scope`, `Season Configuration Lifecycle`, `Standing Calculations`, `Standings`, `Standings Configuration`, `Standings Lifecycle`, `Statistics Configuration`, `Venues, Media, and Audit`
- checkpoint_ids: `chk_02565b8c9242b371`, `chk_0c728c360efb05b8`, `chk_194a45334fa3c8f6`, `chk_283503e9d866a579`, `chk_36a6e12e480596e3`, `chk_59f0ac408b67b931`, `chk_5be0812ef2c7b3f2`, `chk_5c52a836557b08f0`, `chk_5dedc3de878248e6`, `chk_6b71c80b35b12c65`, `chk_70bce51a37b27e69`, `chk_7b9cf3023460674c`, `chk_7ec05c85867f594f`, `chk_8ce5375afe063a68`, `chk_8f177a36130f5461`, `chk_9265e5b6a15c7db5`, `chk_93b383d2a9da99bc`, `chk_976679f78207414b`, `chk_9d5d306677877e5c`, `chk_9db3daf3dbf553b1`, `chk_b326ece3d5d16868`, `chk_b69074a544e818a2`, `chk_bd2a850f89fe90b7`, `chk_bd468f49c98c78bc`, `chk_cd2ba896d68b3186`, `chk_d7a8406898038dd5`, `chk_dd93d510c02fe8b4`, `chk_1a2da5611caf6829`, `chk_350d557f3124843b`, `chk_4fa98892e9462fb5`, `chk_544551838c91c932`, `chk_5b5ed45288b3abe9`, `chk_8f6f4a5231c3aed4`, `chk_9c4597fde27d4343`, `chk_b1abd1a9f3e20177`, `chk_be3eb11f4ca23fb9`, `chk_bedfb8e44ac48619`, `chk_d188d42eff521386`, `chk_eaecc194b5145182`, `chk_ede642f8d6bed27b`, `chk_fe021eb074e61c9a`, `chk_0fa31f08ff648ae2`, `chk_15516a59b42106cc`, `chk_3890dd400fca0687`, `chk_8114d978ed174234`, `chk_842abdd611b20e21`, `chk_8db3d98a2bdf9ba6`, `chk_9552404ea35ed3f0`, `chk_9dad9b29838b4f97`, `chk_a89e34dda4983afd`, `chk_b06c6ef4e97cd1cc`, `chk_b7b547dc966be29f`, `chk_ccb0ab041c21b90e`, `chk_e2821fbf730c9756`, `chk_f5417d35effa335f`, `chk_f67269cea9338b09`, `chk_01fafc8439c53a9f`, `chk_07b988825ac7de14`, `chk_0ec28267f0f8b6d4`, `chk_111e0c1b69115f3d`, `chk_178fd72099496361`, `chk_1d295aa3968c7826`, `chk_26ac6627cae5fd74`, `chk_2e6c1a11e097d7ed`, `chk_52aa1c703a765345`, `chk_57196930f89898b0`, `chk_6cf2f6164df3576b`, `chk_750dd9c59353cc69`, `chk_7708121beb96f845`, `chk_80f43870c3a7a7d9`, `chk_8168de60491bd0aa`, `chk_a0e2282a947f9343`, `chk_bf7411ff85934478`, `chk_c1845b80d45f50d8`, `chk_da2b9b7e9ae0e3f7`, `chk_e2a236c63bd0f4f8`, `chk_ef44ed43c5ac0847`, `chk_0f73c23755363729`, `chk_12bb6b05519fa07f`, `chk_4429d50d90e1bb21`, `chk_45b89292a02fe023`, `chk_4ce540e8b69f60f1`, `chk_85d9f14d928c54c7`, `chk_880047b3aa8330f6`, `chk_8a8ac0043f9ea6ea`, `chk_efaeff1c4678488b`, `chk_25329c1aaa20597c`, `chk_4a80d01b495200ba`, `chk_55f5a1790338eb3d`, `chk_834c720148b738fd`, `chk_01755340f7bb2246`, `chk_044ba98066d6daf3`, `chk_05c966998be80a92`, `chk_06e7764ce2a78bf6`, `chk_0dceac2f71a603fe`, `chk_111f2de24885c0e8`, `chk_11436080234b2f3d`, `chk_165e5d29fdfeae28`, `chk_198d59333ba2172d`, `chk_1d9225f06571254b`, `chk_33e091c88413b5bf`, `chk_354dcbc302caeab6`, `chk_454b9366eaba05fd`, `chk_488d2423f61db350`, `chk_4a3b0ff0cefd37c3`, `chk_5e6c2d122c6cedce`, `chk_62fa9d453c0eef0f`, `chk_6b19bcdc477f315f`, `chk_6bb2e19255ead75c`, `chk_6cb40f495a604286`, `chk_73a8326924a0fdce`, `chk_7782d6ff8a76be54`, `chk_7ecda855d6e900cd`, `chk_7f3bef0370103d7d`, `chk_81a12f2abb30bfe0`, `chk_841df734049b8b9f`, `chk_91e6e64bf84b1583`, `chk_953601ac12a4f650`, `chk_9bc1b6dfe9363ca6`, `chk_a0332bd78b9e808b`, `chk_a2c2aaecc510c476`, `chk_ac78f6a3be97b892`, `chk_b00ec36ad7c79cf5`, `chk_b479601f52a04364`, `chk_b4d407bf6d331df5`, `chk_be964f3cf8f77cc7`, `chk_c32f13c6d3ed9992`, `chk_c7459be39f678ab9`, `chk_c78a03c413bfe995`, `chk_cb5f2a10c19547aa`, `chk_d0fb3d750b78c6f3`, `chk_d6438e2ec5d19fcc`, `chk_d83c7da3b02f657a`, `chk_d9368df018ae932e`, `chk_dbc0dc0d21335450`, `chk_e1ce288a8f8a7af1`, `chk_e585511c7124ac02`, `chk_e6991f3fcbbd5976`, `chk_e9e43ea908ef8662`, `chk_eefaacb3ccee0aa4`, `chk_f0f4bd2ec6f50c0b`, `chk_f39a6e54b57a66f3`, `chk_f3fdb47eb9f0fbc1`, `chk_f61de14affe60e32`, `chk_f6e9c165fb710591`, `chk_f7300f59ecdae430`, `chk_f7e3ba0bfc07dc56`, `chk_fb6aa605672eff91`
