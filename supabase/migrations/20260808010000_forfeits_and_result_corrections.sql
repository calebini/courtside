alter table games
  add column competition_eligibility_at timestamptz;

update games
   set competition_eligibility_at = started_at
 where started_at is not null;

alter table games
  add constraint games_competition_eligibility_anchor_check
  check (
    (status in ('in_progress', 'final', 'forfeit') and competition_eligibility_at is not null)
    or
    (status in ('scheduled', 'postponed', 'cancelled') and competition_eligibility_at is null)
  );

alter table audit_records
  add constraint audit_result_correction_reason_check
  check (
    action <> 'game.result_corrected'
    or (reason is not null and btrim(reason) <> '')
  );
