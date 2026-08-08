import {expect, test} from '@playwright/test';

test('an authenticated League Administrator finalizes a game and sees updated standings', async ({
  page
}) => {
  await page.goto('/en/admin');
  await expect(page).toHaveURL(/\/en\/sign-in/);

  await page.getByLabel('Email').fill('admin@courtside.local');
  await page.getByLabel('Password').fill('courtside-local-admin');
  await page.getByRole('button', {name: 'Sign in'}).click();

  await expect(page).toHaveURL(/\/en\/admin/);
  await expect(page.getByRole('heading', {name: 'Results, made official.'})).toBeVisible();
  await expect(page.getByText('Courtside Rec League')).toBeVisible();

  await page.getByLabel('Harbour Hawks score').fill('81');
  await page.getByLabel('Northside Comets score').fill('77');
  await page.getByRole('button', {name: 'Finalize result'}).first().click();

  await expect(page.getByText('The result is official and the standings have been recalculated.')).toBeVisible();
  await expect(page.getByText('Rules frozen')).toBeVisible();
  const harbourRow = page.getByRole('row', {name: /Harbour Hawks/});
  await expect(harbourRow).toContainText('2');
  await expect(harbourRow).toContainText('+4');
});
