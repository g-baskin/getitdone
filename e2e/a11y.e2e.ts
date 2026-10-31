import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { loadDemo } from './helpers.ts';

const ROUTES = [
	'/',
	'/morning',
	'/evening',
	'/focus',
	'/projects',
	'/goal',
	'/blockers',
	'/proof',
	'/review',
	'/settings'
];

test('every screen passes automated WCAG 2.1 AA checks', async ({ page }) => {
	test.setTimeout(120_000);
	await loadDemo(page);
	for (const route of ROUTES) {
		await page.goto(route);
		await expect(page.locator('main h1').first()).toBeVisible();
		await page.waitForLoadState('networkidle');
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
			.exclude('.print-only')
			.analyze();
		const summary = results.violations.map(
			(v) => `${route}: ${v.id} (${v.impact}) ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`
		);
		expect(summary).toEqual([]);
	}
});

test('the morning flow works with the keyboard alone', async ({ page }) => {
	await page.goto('/morning');
	await page.getByLabel('One word for how you want to show up today').focus();
	await page.keyboard.type('Brave');
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: "Today's one thing" })).toBeFocused();
	await page.keyboard.press('Tab');
	await page.keyboard.type('Write the permit letter');
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { name: 'Why it matters' })).toBeVisible();
});
