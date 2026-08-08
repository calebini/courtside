import {expect, test} from '@playwright/test';

test('a League Administrator schedules, postpones, reschedules, starts, and finalizes a game', async ({
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
  await scoreCard.getByLabel('Harbour Hawks score').fill('81');
  await scoreCard.getByLabel('Northside Comets score').fill('77');
  await scoreCard.getByRole('button', {name: 'Finalize result'}).click();

  await expect(
    page.getByText('The result is official and the standings have been recalculated.')
  ).toBeVisible();
  await expect(page.getByText('Rules frozen')).toBeVisible();
  const harbourRow = page.getByRole('row', {name: /Harbour Hawks/});
  await expect(harbourRow).toContainText('2');
  await expect(harbourRow).toContainText('+4');
});
