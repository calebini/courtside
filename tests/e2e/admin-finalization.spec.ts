import {expect, test} from '@playwright/test';

test('a League Administrator manages a Game through finalization, correction, and forfeit', async ({
  page
}) => {
  await page.goto('/en/admin');
  await expect(page).toHaveURL(/\/en\/sign-in/);

  await page.getByLabel('Email').fill('admin@courtside.local');
  await page.getByLabel('Password').fill('courtside-local-admin');
  await page.getByRole('button', {name: 'Sign in'}).click();

  await expect(page).toHaveURL(/\/en\/admin/);
  await expect(
    page.getByRole('heading', {name: 'What needs attention now.'})
  ).toBeVisible();
  await expect(page.getByText('Courtside Rec League')).toBeVisible();
  await expect(page.locator('.schedule-panel')).toHaveCount(0);
  await page.getByRole('link', {name: 'Games', exact: true}).click();
  await expect(page).toHaveURL(/\/en\/admin\/games/);

  const schedulePanel = page.locator('.schedule-panel');
  await schedulePanel.getByLabel(/Local date and time/).fill('2026-11-01T01:30');
  await schedulePanel.getByRole('button', {name: 'Schedule game'}).click();
  await expect(page.getByText(/daylight-saving gaps and overlaps/)).toBeVisible();
  await expect(page.locator('.operations-panel .operation-card')).toHaveCount(0);

  await schedulePanel.getByLabel(/Local date and time/).fill('2026-08-20T18:30');
  await schedulePanel
    .getByLabel('Venue')
    .selectOption({label: 'Harbour Community Centre — 100 Harbour Way'});
  await schedulePanel.getByLabel('Court or arrival instructions').fill('Court 3');
  await schedulePanel.getByRole('button', {name: 'Schedule game'}).click();

  await expect(page.getByText('The game has been scheduled and its audit history recorded.')).toBeVisible();
  let operationCard = page.locator('.operations-panel .operation-card').filter({hasText: 'Court 3'});
  await expect(operationCard).toContainText('Harbour Hawks');
  await operationCard.getByRole('button', {name: 'Postpone'}).click();

  await expect(page.getByText('The game has been postponed.')).toBeVisible();
  operationCard = page.locator('.postponed-card').filter({hasText: 'Court 3'});
  await operationCard.getByLabel(/New local date and time/).fill('2026-08-21T19:00');
  await operationCard.getByRole('button', {name: 'Return to schedule'}).click();

  await expect(page.getByText('The game has been rescheduled and its prior schedule preserved.')).toBeVisible();
  operationCard = page.locator('.operations-panel .operation-card').filter({hasText: 'Court 3'});
  await operationCard.getByRole('button', {name: 'Start game'}).click();

  await expect(page.getByText('The game is now in progress and ready for its final score.')).toBeVisible();
  const scoreCard = page.locator('.attention-section .game-card').filter({hasText: 'Court 3'});
  const finalizeForm = scoreCard.locator('form').first();
  await finalizeForm.getByLabel('Harbour Hawks score').fill('81');
  await finalizeForm.getByLabel('Northside Comets score').fill('77');
  await finalizeForm.getByRole('button', {name: 'Finalize result'}).click();

  await expect(
    page.getByText('The result is official and the standings have been recalculated.')
  ).toBeVisible();
  await expect(page.getByText('Rules frozen')).toBeVisible();
  const harbourRow = page.getByRole('row', {name: /Harbour Hawks/});
  await expect(harbourRow).toContainText('2');
  await expect(harbourRow).toContainText('+4');

  let completedCard = page.locator('.completed-card').filter({hasText: 'Court 3'});
  await expect(completedCard).toContainText('81–77');
  let playerPoints = completedCard.locator('details.player-points-details');
  await playerPoints.locator('summary').click();
  await playerPoints.getByLabel('Avery Chen points').fill('0');
  await playerPoints.getByLabel('Jordan Lee points').fill('12');
  await playerPoints.getByLabel('Verification for submitted values').selectOption('confirmed');
  await playerPoints.getByLabel('Reason or note (optional)').fill('Verified score sheet');
  await playerPoints.getByRole('button', {name: 'Save Player points'}).click();
  await expect(page.getByText(/Player points were saved/)).toBeVisible();

  completedCard = page.locator('.completed-card').filter({hasText: 'Court 3'});
  playerPoints = completedCard.locator('details.player-points-details');
  await playerPoints.locator('summary').click();
  await expect(playerPoints.getByLabel('Avery Chen points')).toHaveValue('0');
  await expect(playerPoints.getByLabel('Jordan Lee points')).toHaveValue('12');
  await expect(playerPoints.getByText('Confirmed')).toHaveCount(2);
  await playerPoints.getByLabel('Jordan Lee points').fill('14');
  await playerPoints.getByLabel('Verification for submitted values').selectOption('provisional');
  await playerPoints.getByLabel('Reason or note (optional)').fill('Score sheet correction');
  await playerPoints.getByRole('button', {name: 'Save Player points'}).click();
  await expect(page.getByText(/Player points were saved/)).toBeVisible();

  const correction = completedCard.locator('details.result-details');
  await correction.locator('summary').click();
  await correction.getByLabel('Harbour Hawks score').fill('70');
  await correction.getByLabel('Northside Comets score').fill('75');
  await correction.getByLabel('Winning team').selectOption({label: 'Northside Comets'});
  await correction.getByLabel('Reason for correction').fill('Score sheet transposition');
  await correction.getByRole('button', {name: 'Correct result'}).click();

  await expect(
    page.getByText(/corrected result is official.*prior value is preserved/i)
  ).toBeVisible();
  completedCard = page.locator('.completed-card').filter({hasText: 'Court 3'});
  await expect(completedCard).toContainText('70–75');
  await completedCard.locator('details.audit-details summary').click();
  await expect(completedCard).toContainText('81–77 → 70–75');
  await expect(completedCard).toContainText('Score sheet transposition');

  const northsideRow = page.getByRole('row', {name: /Northside Comets/});
  await expect(northsideRow).toContainText('2');
  await expect(northsideRow).toContainText('+5');

  await schedulePanel.getByLabel(/Local date and time/).fill('2026-08-28T18:30');
  await schedulePanel.getByLabel('Court or arrival instructions').fill('Court 4');
  await schedulePanel.getByRole('button', {name: 'Schedule game'}).click();

  operationCard = page.locator('.operations-panel .operation-card').filter({hasText: 'Court 4'});
  const forfeitForm = operationCard.locator('details.result-details');
  await forfeitForm.locator('summary').click();
  await forfeitForm.getByLabel('Harbour Hawks score').fill('0');
  await forfeitForm.getByLabel('Northside Comets score').fill('20');
  await forfeitForm.getByLabel('Winning team').selectOption({label: 'Northside Comets'});
  await forfeitForm.getByLabel('Reason or note (optional)').fill('Home team unavailable');
  await forfeitForm.getByRole('button', {name: 'Make forfeit official'}).click();

  await expect(
    page.getByText('The forfeit is official and the standings have been recalculated.')
  ).toBeVisible();
  const forfeitCard = page.locator('.completed-card').filter({hasText: 'Court 4'});
  await expect(forfeitCard).toContainText('Forfeit');
  await expect(forfeitCard).toContainText('0–20');
  await expect(page.getByRole('row', {name: /Northside Comets/})).toContainText('4');

  await page.goto('/en/results');
  await expect(page.getByRole('heading', {name: 'Results', exact: true})).toBeVisible();
  await expect(page.locator('.public-game-card').filter({hasText: '70–75'})).toBeVisible();
  await expect(page.locator('.public-game-card').filter({hasText: '0–20'})).toContainText('Forfeit');
  await expect(page.getByText('Score sheet transposition')).toHaveCount(0);
  await expect(page.getByText('Local League Admin')).toHaveCount(0);

  await page.goto('/en/standings');
  await expect(page.getByRole('heading', {name: 'Standings', exact: true})).toBeVisible();
  await expect(page.getByRole('row', {name: /Northside Comets/})).toContainText('4');

  await page.goto('/fr/schedule');
  await expect(page.getByRole('heading', {name: 'Horaire', exact: true})).toBeVisible();
  await expect(page.getByText('En cours').first()).toBeVisible();
  await expect(page.getByText('c.', {exact: true}).first()).toBeVisible();
  await expect(page.getByText(/Harbour Community Centre/).first()).toBeVisible();
  await expect(page.getByText('America/Los_Angeles')).toBeVisible();

  await page.goto('/en/players');
  await page.getByRole('button', {name: 'Sign out'}).click();
  await page.getByLabel('Email').fill('member@courtside.local');
  await page.getByLabel('Password').fill('courtside-local-member');
  await page.getByRole('button', {name: 'Sign in'}).click();

  await expect(page).toHaveURL(/\/en\/stats/);
  await expect(page.getByRole('heading', {name: 'Player statistics'})).toBeVisible();
  const leaderboard = page.locator('.member-leaderboard');
  await expect(leaderboard.getByRole('row', {name: /Avery Chen/})).toContainText('0');
  await expect(leaderboard.getByText('Jordan Lee')).toHaveCount(0);

  const correctedGame = page.locator('.member-game-list li').filter({hasText: '70–75'});
  await correctedGame.getByRole('link', {name: 'View box score'}).click();
  const boxScore = page.locator('.member-box-score');
  await expect(boxScore.locator('.official-score')).toContainText('Harbour Hawks 70–75 Northside Comets');
  await expect(boxScore.getByRole('row', {name: /Avery Chen/})).toContainText('0');
  await expect(boxScore.getByRole('row', {name: /Avery Chen/})).toContainText('Confirmed');
  await expect(boxScore.getByRole('row', {name: /Jordan Lee/})).toContainText('14');
  await expect(boxScore.getByRole('row', {name: /Jordan Lee/})).toContainText('Provisional');
});
