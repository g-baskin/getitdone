import { expect, type Page, type Request } from '@playwright/test';

export const ORIGIN = 'http://localhost:4173';

/** Fails the test if the page asks for anything outside the app's own origin. */
export function trackRequests(page: Page): { external: string[]; all: string[] } {
	const all: string[] = [];
	const external: string[] = [];
	page.on('request', (req: Request) => {
		const url = req.url();
		all.push(url);
		if (url.startsWith('data:') || url.startsWith('blob:')) return;
		if (new URL(url).origin !== ORIGIN) external.push(url);
	});
	page.on('websocket', (ws) => external.push(ws.url()));
	return { external, all };
}

/** Replaces window.print so tests don't open a dialog; counts calls instead. */
export async function stubPrint(page: Page): Promise<void> {
	await page.addInitScript(() => {
		const w = window as unknown as { __printCalls: number };
		w.__printCalls = 0;
		window.print = () => {
			w.__printCalls++;
		};
	});
}

export async function printCalls(page: Page): Promise<number> {
	return page.evaluate(() => (window as unknown as { __printCalls: number }).__printCalls);
}

export async function loadDemo(page: Page): Promise<void> {
	await page.goto('/settings');
	await page.getByRole('button', { name: 'Load demo data' }).click();
	await expect(page.getByText('Demo data loaded.')).toBeVisible();
}

/** Restores a backup through the Settings screen. */
export async function importBackup(page: Page, json: unknown, name = 'test.getitdone.json') {
	await page.goto('/settings');
	await page.getByLabel('Backup file (.json)').setInputFiles({
		name,
		mimeType: 'application/json',
		buffer: Buffer.from(JSON.stringify(json))
	});
	await expect(page.getByTestId('import-preview')).toBeVisible();
	await page.getByRole('button', { name: 'Replace my data with this backup' }).click();
	await expect(page.getByText(`Restored from ${name}.`)).toBeVisible();
}

export function pdfPageCount(pdf: Buffer): number {
	const text = pdf.toString('latin1');
	return (text.match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}

export function pdfIsLetter(pdf: Buffer): boolean {
	const boxes = pdf.toString('latin1').match(/\/MediaBox\s*\[([^\]]+)\]/g) ?? [];
	return (
		boxes.length > 0 &&
		boxes.every((b) => {
			const [, , w, h] = b
				.replace(/[^\d.\s]/g, ' ')
				.trim()
				.split(/\s+/)
				.map(Number);
			return Math.round(w ?? 0) === 612 && Math.round(h ?? 0) === 792;
		})
	);
}

/** Renders the page with print styles, the way "Save as PDF" does. */
export async function printToPdf(page: Page): Promise<Buffer> {
	return page.pdf({ format: 'Letter', preferCSSPageSize: true, printBackground: false });
}

export function localISODate(d = new Date()): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftISODate(iso: string, days: number): string {
	const [y, m, d] = iso.split('-').map(Number);
	return localISODate(new Date(y!, m! - 1, d! + days));
}
