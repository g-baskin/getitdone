import { expect, test } from '@playwright/test';
import { loadDemo, ORIGIN, stubPrint, trackRequests } from './helpers.ts';

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

test('no network requests beyond the app’s own files', async ({ page }) => {
	await stubPrint(page);
	const requests = trackRequests(page);
	const consoleErrors: string[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') consoleErrors.push(msg.text());
	});
	page.on('pageerror', (err) => consoleErrors.push(err.message));
	await loadDemo(page);
	for (const route of ROUTES) {
		await page.goto(route);
		await page.waitForLoadState('networkidle');
	}
	// Exercise a few features that could tempt a network call.
	await page.goto('/');
	await page.getByRole('button', { name: 'Print or save as PDF' }).click();
	await page.goto('/settings');
	await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Download backup' }).click()
	]);
	await page.waitForLoadState('networkidle');

	// Also proves the strict CSP never blocks the app's own scripts or styles.
	expect(consoleErrors).toEqual([]);
	expect(requests.all.length).toBeGreaterThan(0);
	expect(requests.external).toEqual([]);
	for (const url of requests.all) {
		if (!url.startsWith('data:') && !url.startsWith('blob:')) {
			expect(new URL(url).origin).toBe(ORIGIN);
		}
	}
});

test('the page ships a content security policy that only allows its own origin', async ({
	page
}) => {
	await page.goto('/');
	const csp = await page
		.locator('meta[http-equiv="content-security-policy"]')
		.getAttribute('content');
	expect(csp).toContain("default-src 'self'");
	expect(csp).toContain("connect-src 'self'");
	expect(csp).not.toMatch(/https?:\/\//);
});
