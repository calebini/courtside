import {expect, test, type APIRequestContext, type Page} from '@playwright/test';

interface MailpitAddress {
  readonly Address: string;
}

interface MailpitSummary {
  readonly ID: string;
  readonly To: readonly MailpitAddress[];
}

interface MailpitList {
  readonly messages: readonly MailpitSummary[];
}

interface MailpitMessage {
  readonly HTML?: string;
  readonly Text?: string;
}

async function confirmationLink(
  api: APIRequestContext,
  page: Page,
  recipient: string,
  ignoredIds: ReadonlySet<string> = new Set()
) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const listResponse = await api.get('http://127.0.0.1:54324/api/v1/messages');
    const list = await listResponse.json() as MailpitList;
    const summary = list.messages.find((message) =>
      !ignoredIds.has(message.ID) && message.To.some((address) => address.Address === recipient)
    );
    if (summary) {
      const messageResponse = await api.get(`http://127.0.0.1:54324/api/v1/message/${summary.ID}`);
      const message = await messageResponse.json() as MailpitMessage;
      const content = `${message.HTML ?? ''}\n${message.Text ?? ''}`.replaceAll('&amp;', '&');
      const links = [...content.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((match) => match[0]);
      const link = links.find((candidate) => candidate.includes('/auth/v1/verify'));
      if (link) return {id: summary.ID, link};
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`No authentication email arrived for ${recipient}`);
}

test('registers a confirmed Account and completes non-enumerating recovery', async ({page, request}) => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `onboarding-${suffix}@example.test`;
  const firstPassword = 'courtside9';
  const nextPassword = 'courtside10';

  await page.goto('/en/register');
  await page.getByLabel('Your name').fill('Casey Morgan');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', {exact: true}).fill(firstPassword);
  await page.getByLabel('Confirm password').fill(firstPassword);
  await page.getByRole('button', {name: 'Create account'}).click();
  await expect(page.getByText('Check your email to confirm the address.')).toBeVisible();

  const confirmation = await confirmationLink(request, page, email);
  await page.goto(confirmation.link);
  await expect(page).toHaveURL(/\/en\/players$/);
  await expect(page.getByText('Casey Morgan')).toBeVisible();
  await expect(page.getByRole('heading', {name: 'Request a Player'})).toBeVisible();

  await page.getByRole('button', {name: 'Sign out'}).click();
  await page.goto('/en/forgot-password');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', {name: 'Send reset link'}).click();
  await expect(page.getByText('If that address matches an account')).toBeVisible();

  const recovery = await confirmationLink(request, page, email, new Set([confirmation.id]));
  await page.goto(recovery.link);
  await expect(page).toHaveURL(/\/en\/update-password$/);
  await page.getByLabel('New password', {exact: true}).fill(nextPassword);
  await page.getByLabel('Confirm new password').fill(nextPassword);
  await page.getByRole('button', {name: 'Update password'}).click();
  await expect(page.getByText('Your password was updated.')).toBeVisible();

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(nextPassword);
  await page.getByRole('button', {name: 'Sign in'}).click();
  await expect(page).toHaveURL(/\/en\/players$/);
});
