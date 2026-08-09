import {expect, test} from '@playwright/test';

const validPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

test('a member manages approved Players while the League desk controls authority', async ({browser}) => {
  const memberContext = await browser.newContext();
  const member = await memberContext.newPage();
  await member.goto('/en/sign-in');
  await member.getByLabel('Email').fill('member@courtside.local');
  await member.getByLabel('Password').fill('courtside-local-member');
  await member.getByRole('button', {name: 'Sign in'}).click();
  await expect(member).toHaveURL(/\/en\/players$/);
  await expect(member.getByRole('heading', {name: 'My Players'})).toBeVisible();

  const jordan = member.locator('.managed-player-card').filter({hasText: 'Jordan Lee'});
  await expect(jordan).toContainText('Approved');
  await jordan.getByLabel('Display name').fill('Jordan L.');
  await jordan.getByRole('button', {name: 'Save name'}).click();
  await expect(member.getByText('The Player display name was updated and audited.')).toBeVisible();

  const updatedJordan = member.locator('.managed-player-card').filter({hasText: 'Jordan L.'});
  await updatedJordan.getByLabel('Profile photo').setInputFiles({name: 'avatar.png', mimeType: 'image/png', buffer: validPng});
  await updatedJordan.getByRole('button', {name: 'Set or replace photo'}).click();
  await expect(member.getByText('The private profile photo was updated and audited.')).toBeVisible();
  await expect(member.locator('.profile-photo').first()).toHaveAttribute('src', /storage\/v1\/object\/sign/);

  await member.getByLabel('Player reference').fill('40000000-0000-4000-8000-000000000060');
  await member.getByRole('button', {name: 'Request access'}).click();
  await expect(member.locator('.managed-player-card').filter({hasText: 'Avery Chen'})).toContainText('Requested');

  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await admin.goto('/en/sign-in');
  await admin.getByLabel('Email').fill('admin@courtside.local');
  await admin.getByLabel('Password').fill('courtside-local-admin');
  await admin.getByRole('button', {name: 'Sign in'}).click();
  await admin.getByRole('link', {name: 'Manage Player access'}).click();
  const request = admin.locator('.access-row').filter({hasText: 'Avery Chen'});
  await expect(request).toContainText('Local Member');
  await request.getByRole('button', {name: 'Approve request'}).click();
  await expect(admin.getByText('The request was approved and audited.')).toBeVisible();

  await member.reload();
  await expect(member.locator('.managed-player-card').filter({hasText: 'Avery Chen'})).toContainText('Approved');
  await adminContext.close();
  await memberContext.close();
});
