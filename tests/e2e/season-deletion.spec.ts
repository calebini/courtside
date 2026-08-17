import {expect, test} from '@playwright/test';

test('a League Administrator deletes only a confirmed unused Season', async ({page}) => {
  await page.goto('/en/sign-in');
  await page.getByLabel('Email').fill('admin@courtside.local');
  await page.getByLabel('Password').fill('courtside-local-admin');
  await page.getByRole('button', {name: 'Sign in'}).click();
  await page.getByRole('link', {name: 'League setup'}).click();

  await page.locator('.create-season-disclosure > summary').click();
  const creation = page.locator('.create-season-disclosure form');
  await creation.getByLabel('Season name').fill('Accidental Season');
  await creation.getByRole('button', {name: 'Create Season'}).click();
  await expect(page.getByText('The Season was created with the default standings rules and an audit record.'))
    .toBeVisible();

  let deletion = page.locator('.season-deletion-panel');
  await deletion.locator('summary').click();
  await expect(deletion.getByText('Eligible setup correction')).toBeVisible();
  await deletion.getByLabel('Type the Season name to confirm').fill('accidental season');
  await deletion.getByRole('button', {name: 'Permanently delete unused Season'}).click();
  await expect(page.getByText(/The Season was not deleted/)).toBeVisible();

  deletion = page.locator('.season-deletion-panel');
  await deletion.locator('summary').click();
  await deletion.getByLabel('Type the Season name to confirm').fill('Accidental Season');
  await deletion.getByLabel('Reason or note (optional)').fill('Created twice');
  await deletion.getByRole('button', {name: 'Permanently delete unused Season'}).click();
  await expect(page.getByText(/unused Season was deleted/)).toBeVisible();
  await expect(page.getByText('Accidental Season')).toHaveCount(0);

  const protectedDeletion = page.locator('.season-deletion-panel');
  if (!await protectedDeletion.evaluate((element) => (element as HTMLDetailsElement).open)) {
    await protectedDeletion.locator('summary').click();
  }
  await expect(protectedDeletion.getByText('Protected Season history')).toBeVisible();
  await expect(protectedDeletion.getByRole('button', {name: 'Permanently delete unused Season'}))
    .toHaveCount(0);
});
