import {expect, test} from '@playwright/test';

test('a League Administrator preserves Player identity and roster history', async ({page}) => {
  await page.goto('/en/admin/rosters');
  await expect(page).toHaveURL(/\/en\/sign-in/);

  await page.getByLabel('Email').fill('admin@courtside.local');
  await page.getByLabel('Password').fill('courtside-local-admin');
  await page.getByRole('button', {name: 'Sign in'}).click();

  await expect(page).toHaveURL(/\/en\/admin$/);
  await page.getByRole('link', {name: 'Manage players and rosters'}).click();
  await expect(page).toHaveURL(/\/en\/admin\/rosters/);
  await expect(
    page.getByRole('heading', {name: 'Keep every roster move in the record.'})
  ).toBeVisible();

  const createPanel = page.locator('.create-player-panel');
  await createPanel.getByLabel('Display name').fill('Taylor Brooks');
  await createPanel.getByLabel('Reason or note (optional)').fill('New league registration');
  await createPanel.getByRole('button', {name: 'Create player'}).click();
  await expect(page.getByText('The player identity was created and audited.')).toBeVisible();

  const playerCard = page.locator('.player-directory-card').filter({hasText: 'Taylor Brooks'});
  await expect(playerCard).toBeVisible();
  await playerCard.getByText('Change display name').click();
  await playerCard.getByLabel('Display name').fill('Taylor B. Brooks');
  await playerCard.getByLabel('Reason or note (optional)').fill('Preferred display name');
  await playerCard.getByRole('button', {name: 'Save display name'}).click();
  await expect(page.getByText(/prior value preserved in audit history/)).toBeVisible();

  const membershipPanel = page.locator('.add-membership-panel');
  await membershipPanel.getByLabel('Player').selectOption({label: 'Taylor B. Brooks'});
  await membershipPanel.getByLabel('Season team').selectOption({label: 'Harbour Hawks'});
  await membershipPanel.getByLabel(/Effective local date and time/).fill('2026-08-10T09:00');
  await membershipPanel.getByLabel('Reason or note (optional)').fill('Opening roster');
  await membershipPanel.getByRole('button', {name: 'Add roster membership'}).click();
  await expect(page.getByText('The roster membership was added and audited.')).toBeVisible();

  const hawksRoster = page.locator('.team-roster').filter({
    has: page.getByRole('heading', {name: 'Harbour Hawks', exact: true})
  });
  let memberCard = hawksRoster.locator('.roster-member').filter({hasText: 'Taylor B. Brooks'});
  await expect(memberCard).toContainText('Open');
  await memberCard.getByText('Transfer', {exact: true}).click();
  const transferForm = memberCard.locator('form').filter({hasText: 'Record transfer'});
  await transferForm.getByLabel('Transfer to').selectOption({label: 'Northside Comets'});
  await transferForm.getByLabel('Effective local date and time').fill('2026-08-20T18:00');
  await transferForm.getByLabel('Reason or note (optional)').fill('Approved roster move');
  await transferForm.getByRole('button', {name: 'Record transfer'}).click();
  await expect(page.getByText('The transfer was recorded as contiguous roster history.')).toBeVisible();

  await expect(
    hawksRoster.locator('.roster-member').filter({hasText: 'Taylor B. Brooks'})
  ).toContainText('Ended');
  const cometsRoster = page.locator('.team-roster').filter({
    has: page.getByRole('heading', {name: 'Northside Comets', exact: true})
  });
  memberCard = cometsRoster.locator('.roster-member').filter({hasText: 'Taylor B. Brooks'});
  await expect(memberCard).toContainText('Open');
  await memberCard.locator('summary').filter({hasText: 'End membership'}).click();
  const endForm = memberCard.locator('form').filter({hasText: 'End membership'});
  await endForm.getByLabel('Effective local date and time').fill('2026-08-30T12:00');
  await endForm.getByLabel('Reason or note (optional)').fill('Season departure');
  await endForm.getByRole('button', {name: 'End membership'}).click();
  await expect(page.getByText(/ended without rewriting its history/)).toBeVisible();
  await expect(
    cometsRoster.locator('.roster-member').filter({hasText: 'Taylor B. Brooks'})
  ).toContainText('Ended');

  const audit = page.locator('.roster-audit-list');
  await expect(audit).toContainText('Player created');
  await expect(audit).toContainText('Display name updated');
  await expect(audit).toContainText('Membership transferred');
  await expect(audit).toContainText('Season departure');

  await page.goto('/fr/admin/rosters');
  await expect(
    page.getByRole('heading', {name: 'Conservez chaque mouvement d’alignement au dossier.'})
  ).toBeVisible();
  await expect(page.getByText('Joueurs', {exact: true})).toBeVisible();
  await expect(page.getByText('Terminé').first()).toBeVisible();
});
