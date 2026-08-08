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
    page.getByRole('heading', {name: 'Run the night from first tip to final.'})
  ).toBeVisible();
  await expect(page.getByText('Courtside Rec League')).toBeVisible();

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
  operationCard = page.locator('.operations-panel .postponed-card').filter({hasText: 'Court 3'});
  await operationCard.getByLabel(/New local date and time/).fill('2026-08-21T19:00');
  await operationCard.getByRole('button', {name: 'Return to schedule'}).click();

  await expect(page.getByText('The game has been rescheduled and its prior schedule preserved.')).toBeVisible();
  operationCard = page.locator('.operations-panel .operation-card').filter({hasText: 'Court 3'});
  await operationCard.getByRole('button', {name: 'Start game'}).click();

  await expect(page.getByText('The game is now in progress and ready for its final score.')).toBeVisible();
  const scoreCard = page.locator('.score-panel .game-card').filter({hasText: 'Court 3'});
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
});
