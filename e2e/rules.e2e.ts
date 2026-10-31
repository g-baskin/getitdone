import { expect, test } from '@playwright/test';
import { importBackup, loadDemo, localISODate, shiftISODate } from './helpers.ts';

function emptyPage(date: string) {
	return {
		date,
		oneThing: { text: '', done: false },
		whyItMatters: '',
		whoIsCountingOnMe: '',
		todaysWord: '',
		important: ['', '', ''],
		energy: { moved: false, focusBlocks: 0 },
		evening: {},
		minimumDay: false
	};
}

function backupWith(pages: unknown[]) {
	return {
		app: 'get-it-done',
		schemaVersion: 1,
		exportedAt: '',
		data: {
			goals: [],
			steps: [],
			projects: [],
			pages,
			blockers: [],
			waiting: [],
			wins: [],
			reviews: []
		}
	};
}

test("yesterday's unfinished one thing is asked about first, and can be shrunk", async ({
	page
}) => {
	const today = localISODate();
	const yesterday = {
		...emptyPage(shiftISODate(today, -1)),
		oneThing: { text: 'Rebuild the whole teapot catalogue', done: false }
	};
	await importBackup(page, backupWith([yesterday]));

	await page.goto('/morning');
	await expect(page.getByRole('heading', { name: 'Before you start' })).toBeVisible();
	await expect(page.getByText('Rebuild the whole teapot catalogue')).toBeVisible();
	await expect(page.getByText('Step 1 of 6')).toBeVisible();
	await page.getByRole('button', { name: 'Shrink it' }).click();
	await expect(page.getByRole('heading', { name: "Today's word" })).toBeVisible();
	await page.getByRole('button', { name: 'Next' }).click();

	// The old text is selected and ready to be cut down.
	const oneThing = page.getByLabel(/once it's done/);
	await expect(oneThing).toHaveValue('Rebuild the whole teapot catalogue');
	await expect(oneThing).toBeFocused();
	await expect(page.getByText('Make it smaller')).toBeVisible();
	await page.keyboard.type('Rebuild the teapot catalogue cover page');
	await expect(oneThing).toHaveValue('Rebuild the teapot catalogue cover page');
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByRole('button', { name: 'Finish and see today' }).click();
	await expect(page.getByRole('textbox', { name: "Today's one thing" })).toHaveValue(
		'Rebuild the teapot catalogue cover page'
	);

	// Asked once per day.
	await page.goto('/morning');
	await expect(page.getByRole('heading', { name: "Today's word" })).toBeVisible();
});

test("the evening's pick for tomorrow pre-fills the next morning", async ({ page }) => {
	const day1 = new Date();
	day1.setHours(20, 0, 0, 0);
	await page.clock.setFixedTime(day1);

	await page.goto('/evening');
	await page.getByLabel('Yes').check();
	await page.getByLabel(/One win from today/).fill('Fixed the teapot hinge');
	await page.getByLabel(/One lesson/).fill('Oil first, then tighten');
	await page.getByLabel(/Tomorrow's one thing/).fill('Pour the first test cup');
	await page.getByRole('button', { name: 'Save check-in' }).click();
	await expect(page.getByText('Saved.')).toBeVisible();

	// The evening win lands in the Proof Log.
	await page.goto('/proof');
	await expect(page.getByTestId('win')).toContainText('Fixed the teapot hinge');
	await expect(page.getByTestId('win')).toContainText('Evening');

	const day2 = new Date(day1);
	day2.setDate(day2.getDate() + 1);
	day2.setHours(7, 30, 0, 0);
	await page.clock.setFixedTime(day2);
	await page.goto('/morning');
	await expect(page.getByRole('heading', { name: "Today's word" })).toBeVisible();
	await page.getByRole('button', { name: 'Next' }).click();
	const oneThing = page.getByLabel(/once it's done/);
	await expect(oneThing).toHaveValue('Pour the first test cup');
	await oneThing.fill('Pour two test cups');
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByRole('button', { name: 'Finish and see today' }).click();
	await expect(page.getByRole('textbox', { name: "Today's one thing" })).toHaveValue(
		'Pour two test cups'
	);
});

test('overdue waiting items are highlighted with a copyable follow-up', async ({
	page,
	context
}) => {
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await loadDemo(page);
	await page.goto('/');
	const overdue = page.locator('[data-testid="waiting"][data-overdue="true"]');
	await expect(overdue).toHaveCount(1);
	await expect(overdue).toContainText('the signed crater lease');
	await expect(overdue).toContainText('waiting 9 days');
	await overdue.getByRole('button', { name: 'Copy follow-up message' }).click();
	await expect(overdue.getByText('Copied.')).toBeVisible();
	const copied = await page.evaluate(() => navigator.clipboard.readText());
	expect(copied).toMatch(/^Hi Dr\. Moonbeam, just following up on the signed crater lease from /);

	// Received items stop carrying over.
	await overdue.getByRole('button', { name: /^Received\b.*the signed crater lease/ }).click();
	await expect(page.locator('[data-overdue="true"]')).toHaveCount(0);
	await page.goto('/blockers');
	await expect(page.getByTestId('waiting')).toHaveCount(2);
});

test('a fourth active project needs one parked, with a reason', async ({ page }) => {
	await loadDemo(page);
	await page.goto('/projects');
	await expect(page.getByTestId('active-project')).toHaveCount(3);

	await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Comet cafe');
	await page.getByRole('button', { name: 'Add project' }).click();
	await expect(page.getByText('Three projects are already active.')).toBeVisible();
	await page.getByRole('button', { name: 'Park one to make room' }).click();
	await page.getByLabel('Floating menu').check();
	await page.getByRole('button', { name: 'Park it and make room' }).click();
	await expect(page.getByRole('alert')).toHaveText(
		'Add a short reason so future you knows why it can wait.'
	);
	await page.getByLabel('Why can it wait?').fill('After the permit');
	await page.getByRole('button', { name: 'Park it and make room' }).click();

	await expect(page.getByTestId('active-project')).toHaveCount(3);
	const names = await page
		.getByTestId('active-project')
		.getByLabel('Project name')
		.evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value).sort());
	expect(names).toEqual(['Comet cafe', 'Lunar Council permit', 'Robot barista training']);
	const parked = page.getByTestId('parked-project').filter({ hasText: 'Floating menu' });
	await expect(parked).toContainText('Parked: After the permit');
});

test('completing a big step adds it to the Proof Log', async ({ page }) => {
	await loadDemo(page);
	await page.goto('/goal');
	await expect(page.getByTestId('step')).toHaveCount(5);
	await expect(page.getByText('Five big steps is the most a goal can hold.')).toBeVisible();
	await page.getByLabel('Status').nth(1).selectOption('done');
	await expect(page.getByText('is done and added to your Proof Log')).toBeVisible();
	await page.goto('/proof');
	await expect(page.getByTestId('win').first()).toContainText(
		'Finished a big step: Train the robot barista'
	);
});

test('a finished 50-minute focus block adds to today, then a 2-minute reset', async ({ page }) => {
	await page.clock.install();
	await page.goto('/focus');
	await page.getByLabel('What is this block for?').fill('Write the menu');
	await page.getByRole('button', { name: 'Start 50 minutes' }).click();
	await expect(page.getByRole('timer')).toHaveText('50:00');
	await page.clock.fastForward('49:00');
	await expect(page.getByRole('timer')).toHaveText('01:00');
	await page.clock.fastForward('01:01');
	await expect(page.getByText('Reset', { exact: true })).toBeVisible();
	await expect(page.getByRole('timer')).toHaveText(/^0[12]:\d\d$/);
	await expect(page.getByLabel("What's the next block for?")).toBeVisible();
	await expect(page.getByTestId('blocks-today')).toHaveText('1');
	await page.clock.fastForward('02:01');
	await expect(page.getByText("Reset done. Start when you're ready.")).toBeVisible();
	await page.goto('/');
	await expect(page.getByRole('group', { name: 'Focus blocks' })).toContainText('1');
});

test('a block that finishes while Today is open is kept when Today saves', async ({ page }) => {
	await page.clock.install();
	await page.goto('/focus');
	await page.getByRole('button', { name: 'Start 50 minutes' }).click();
	await page.getByRole('link', { name: 'Today', exact: true }).click();
	const blocks = page.getByRole('group', { name: 'Focus blocks' });
	await expect(blocks).toContainText('0');
	await page.clock.fastForward('50:01');
	await expect(blocks).toContainText('1');
	await page.getByLabel("Today's word").fill('Steady');
	await expect(page.getByText('Saved')).toBeVisible();
	await page.reload();
	await expect(page.getByRole('group', { name: 'Focus blocks' })).toContainText('1');
	await expect(page.getByLabel("Today's word")).toHaveValue('Steady');
});
