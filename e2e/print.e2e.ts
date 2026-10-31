import { expect, test } from '@playwright/test';
import {
	importBackup,
	loadDemo,
	localISODate,
	pdfIsLetter,
	pdfPageCount,
	printCalls,
	printToPdf,
	shiftISODate,
	stubPrint
} from './helpers.ts';

test.beforeEach(async ({ page }) => {
	await stubPrint(page);
});

test('Today with demo data prints on exactly one Letter page', async ({ page }) => {
	await loadDemo(page);
	await page.goto('/');
	await expect(page.getByRole('textbox', { name: "Today's one thing" })).toHaveValue(
		/robot barista/
	);
	await page.getByRole('button', { name: 'Print or save as PDF' }).click();
	expect(await printCalls(page)).toBe(1);

	const sheet = page.getByTestId('daily-sheet');
	await page.emulateMedia({ media: 'print' });
	await expect(sheet).toBeVisible();
	await expect(sheet).toContainText("Finish the robot barista's tea-pouring routine");
	await expect(sheet).toContainText('Permit form needs an official stamp');
	await expect(sheet).toContainText('the signed crater lease');
	await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();

	const pdf = await printToPdf(page);
	expect(pdfPageCount(pdf)).toBe(1);
	expect(pdfIsLetter(pdf)).toBe(true);
});

test('the blank daily template prints on exactly one Letter page', async ({ page }) => {
	await loadDemo(page);
	await page.goto('/');
	await expect(page.getByRole('textbox', { name: "Today's one thing" })).toHaveValue(
		/robot barista/
	);
	await page.getByRole('button', { name: 'Print blank page' }).click();
	expect(await printCalls(page)).toBe(1);

	const sheet = page.getByTestId('daily-sheet');
	await page.emulateMedia({ media: 'print' });
	await expect(sheet).toBeVisible();
	// Blank means blank: no demo entries, just lines to fill in by hand.
	await expect(sheet).not.toContainText('robot barista');
	await expect(sheet).not.toContainText('Lunar Council');
	await expect(sheet).toContainText("Today's one thing");

	const pdf = await printToPdf(page);
	expect(pdfPageCount(pdf)).toBe(1);
	expect(pdfIsLetter(pdf)).toBe(true);
});

test('the Weekly review prints on exactly one Letter page', async ({ page }) => {
	await loadDemo(page);
	await page.goto('/review');
	await expect(page.getByLabel('Main focus')).toHaveValue('Get the permit approved');
	await page.getByRole('button', { name: 'Print or save as PDF' }).click();
	expect(await printCalls(page)).toBe(1);

	const sheet = page.getByTestId('weekly-sheet');
	await page.emulateMedia({ media: 'print' });
	await expect(sheet).toBeVisible();
	await expect(sheet).toContainText('Get the permit approved');
	await expect(sheet).toContainText('Get a permit from the Lunar Council');

	const pdf = await printToPdf(page);
	expect(pdfPageCount(pdf)).toBe(1);
	expect(pdfIsLetter(pdf)).toBe(true);
});

test('an empty Today page and an empty review still print on one page', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('textbox', { name: "Today's one thing" })).toBeVisible();
	expect(pdfPageCount(await printToPdf(page))).toBe(1);
	await page.goto('/review');
	await expect(page.getByLabel('Main focus')).toBeVisible();
	expect(pdfPageCount(await printToPdf(page))).toBe(1);
});

test('very long entries and many items still fit on one page', async ({ page }) => {
	const today = localISODate();
	const long = (s: string) => `${s} ${'with a great deal of extra detail '.repeat(8)}`.trim();
	const monday = shiftISODate(today, -((new Date().getDay() + 6) % 7));
	const backup = {
		app: 'get-it-done',
		schemaVersion: 1,
		exportedAt: new Date().toISOString(),
		data: {
			goals: [],
			steps: [],
			projects: Array.from({ length: 8 }, (_, i) => ({
				id: `p${i}`,
				name: long(`Project ${i}`),
				status: i < 3 ? 'active' : 'parked',
				nextStep: long('Next'),
				parkedReason: i < 3 ? undefined : 'Later',
				updatedAt: new Date().toISOString()
			})),
			pages: [
				{
					date: today,
					oneThing: { text: long('An extremely long one thing'), done: false },
					whyItMatters: long('Because'),
					whoIsCountingOnMe: long('Everyone on the Moon'),
					todaysWord: 'Supercalifragilisticexpialidocious',
					important: [long('First'), long('Second'), long('Third')],
					energy: { sleepHours: 8, moved: true, focusBlocks: 12 },
					evening: {
						didOneThing: false,
						win: long('A win'),
						lesson: long('A lesson'),
						tomorrowOneThing: long('Tomorrow')
					},
					minimumDay: false
				}
			],
			blockers: Array.from({ length: 10 }, (_, i) => ({
				id: `b${i}`,
				what: long(`Blocker ${i}`),
				who: 'Professor Sprocket',
				type: 'fear',
				ifThenPlan: long('If it happens, then I will act'),
				nextStep: long('Brave step'),
				createdOn: today
			})),
			waiting: Array.from({ length: 10 }, (_, i) => ({
				id: `w${i}`,
				what: long(`Waiting item ${i}`),
				fromWhom: long('Dr. Moonbeam'),
				since: shiftISODate(today, -20),
				followUpOn: shiftISODate(today, -10),
				status: 'waiting'
			})),
			wins: [],
			reviews: [
				{
					weekOf: monday,
					intentions: {
						self: long('Calm'),
						people: long('Kind'),
						skills: long('Sharp'),
						service: long('Useful')
					},
					ratings: Object.fromEntries(
						['clarity', 'energy', 'drive', 'output', 'impact', 'courage'].map((k) => [
							k,
							{ score: 7, note: long('A note') }
						])
					),
					mainOutputPercent: 100,
					parkedDecisions: Array.from({ length: 8 }, (_, i) => ({
						projectId: `p${i}`,
						name: long(`Project ${i}`),
						decision: 'keep'
					})),
					topWins: [long('Win one'), long('Win two'), long('Win three')],
					nextWeekFocus: long('Focus'),
					nextWeekStepId: undefined
				}
			]
		}
	};
	await importBackup(page, backup);

	await page.goto('/');
	await expect(page.getByRole('textbox', { name: "Today's one thing" })).toHaveValue(
		/extremely long/
	);
	await expect(page.getByTestId('blocker')).toHaveCount(10);
	expect(pdfPageCount(await printToPdf(page))).toBe(1);

	await page.goto('/review');
	await expect(page.getByLabel('Main focus')).toHaveValue(/Focus/);
	expect(pdfPageCount(await printToPdf(page))).toBe(1);
});
