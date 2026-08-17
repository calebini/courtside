import {expect, test} from '@playwright/test';

test('a League Administrator maintains administrator and captain assignments', async ({page}) => {
  await page.goto('/en/sign-in');
  await page.getByLabel('Email').fill('admin@courtside.local');
  await page.getByLabel('Password').fill('courtside-local-admin');
  await page.getByRole('button', {name: 'Sign in'}).click();
  await page.getByRole('link', {name: 'League setup'}).click();

  const roles = page.locator('.role-admin-panel');
  await expect(roles.getByText('The final active administrator is protected.')).toBeVisible();
  await roles.getByLabel('Registered account email').first().fill('member@courtside.local');
  await roles.getByRole('button', {name: 'Grant administrator access'}).click();
  await expect(page.getByText('League Administrator access was granted and audited.')).toBeVisible();
  await expect(roles.getByText('Local Member')).toBeVisible();

  await roles.getByLabel('Season Team').selectOption({label: 'Harbour Hawks'});
  await roles.getByLabel('Registered account email').last().fill('member@courtside.local');
  await roles.getByRole('button', {name: 'Assign or reassign captain'}).click();
  await expect(page.getByText('The Team Captain assignment was saved and audited.')).toBeVisible();
  const captain = roles.locator('.role-holder').filter({hasText: 'Harbour Hawks'});
  await expect(captain).toContainText('Local Member');
  await captain.getByRole('button', {name: 'Revoke'}).click();
  await expect(page.getByText('The Team Captain assignment was revoked and audited.')).toBeVisible();

  const memberAdministrator = roles.locator('.role-holder').filter({hasText: 'member@courtside.local'});
  await memberAdministrator.getByRole('button', {name: 'Revoke'}).click();
  await expect(page.getByText('League Administrator access was revoked and audited.')).toBeVisible();
  await expect(roles.getByText('The final active administrator is protected.')).toBeVisible();
});
