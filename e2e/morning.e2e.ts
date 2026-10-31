import { expect, test } from '@playwright/test';
import { trackRequests } from './helpers.ts';

test('morning flow end to end on a fresh install', async ({ page }) => {
	const requests = trackRequests(page);
	const started = Date.now();

	await page.goto('/');
	await expect(page.getByText("Ready to pick today's one thing?")).toBeVisible();
	await page.getByRole('link', { name: 'Start the morning' }).click();

	// A fresh install has no yesterday, so it starts at today's word: five steps in all.
	await expect(page.getByRole('heading', { name: "Today's word" })).toBeVisible();
	await expect(page.getByText('Step 1 of 5')).toBeVisible();
	await page.getByLabel('One word for how you want to show up today').fill('Curious');
	await page.getByRole('button', { name: 'Next' }).click();

	// The one thing is required.
	await expect(page.getByRole('heading', { name: "Today's one thing" })).toBeVisible();
	await page.getByRole('button', { name: 'Next' }).click();
	await expect(page.getByRole('alert')).toHaveText('Pick one thing to keep going. Small is fine.');
	const oneThing = page.getByLabel(/once it's done, would make the rest of today lighter/);
	await expect(oneThing).toBeFocused();
	await oneThing.fill('Paint the welcome sign for the Moon shop');
	// Not linked to a step or project: a gentle note, not a block.
	await expect(page.getByText("This isn't tied to your goal. Still the right call?")).toBeVisible();
	await page.getByRole('button', { name: 'Next' }).click();

	await expect(page.getByRole('heading', { name: 'Why it matters' })).toBeVisible();
	await page.getByLabel("Who's counting on me").fill('Captain Crumpet');
	await page.getByLabel('Why it matters').fill('Visitors need to find the door');
	await page.getByRole('button', { name: 'Next' }).click();

	await expect(page.getByRole('heading', { name: "What's important today" })).toBeVisible();
	await page.getByLabel('Important 1').fill('Order paint');
	await page.getByLabel('Important 2').fill('Call the sign maker');
	await page.getByRole('button', { name: 'Next' }).click();

	await expect(page.getByRole('heading', { name: 'Blockers and waiting' })).toBeVisible();
	await page.getByRole('button', { name: 'Add a blocker' }).click();
	await page.getByLabel("What's in the way?").fill('Unsure about the font');
	await page.getByLabel('Type').selectOption('fear');
	await expect(page.getByText('A quick "if this, then that" plan makes this easier')).toBeVisible();
	await expect(page.getByLabel("What's the smallest brave step?")).toBeVisible();
	await page.getByLabel("What's the smallest brave step?").fill('Sketch two options');
	await page.getByRole('button', { name: 'Add blocker', exact: true }).click();
	await expect(page.getByTestId('blocker')).toContainText('Unsure about the font');

	await page.getByRole('button', { name: "Add something you're waiting on" }).click();
	await page.getByLabel('Waiting for').fill('the paint delivery');
	await page.getByLabel('From whom').fill('Galactic Paints');
	await page.getByRole('button', { name: 'Add waiting item' }).click();
	await expect(page.getByTestId('waiting')).toContainText('waiting since today');

	await page.getByRole('button', { name: 'Finish and see today' }).click();

	// Ends on Today, with the one thing as the main item.
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole('textbox', { name: "Today's one thing" })).toHaveValue(
		'Paint the welcome sign for the Moon shop'
	);
	await expect(page.getByLabel("Today's word")).toHaveValue('Curious');
	await expect(page.getByText("Ready to pick today's one thing?")).toHaveCount(0);

	// Saved locally: survives a reload.
	await page.reload();
	await expect(page.getByRole('textbox', { name: "Today's one thing" })).toHaveValue(
		'Paint the welcome sign for the Moon shop'
	);
	await expect(page.getByLabel('Important 2')).toHaveValue('Call the sign maker');
	await expect(page.getByTestId('blocker')).toContainText('Sketch two options');

	expect(Date.now() - started).toBeLessThan(5 * 60_000);
	expect(requests.external).toEqual([]);
});

test('minimum day keeps the morning to just the one thing', async ({ page }) => {
	await page.goto('/morning');
	await page.getByLabel('Minimum day').check();
	await expect(page.getByText('Step 1 of 1')).toBeVisible();
	await expect(page.getByText('That counts as a full day.')).toBeVisible();
	await page.getByLabel(/once it's done/).fill('Reply to one email');
	await page.getByRole('button', { name: 'Finish and see today' }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByLabel('Minimum day')).toBeChecked();
	await expect(page.getByRole('heading', { name: 'Blockers' })).toHaveCount(0);
	await expect(page.getByLabel(/^Win/)).toBeVisible();
	await expect(page.getByLabel('Lesson')).toHaveCount(0);
});
