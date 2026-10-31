import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { loadDemo } from './helpers.ts';

async function downloadBackup(page: Page): Promise<{ name: string; text: string }> {
	await page.goto('/settings');
	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Download backup' }).click()
	]);
	const path = await download.path();
	return { name: download.suggestedFilename(), text: await readFile(path, 'utf8') };
}

test('export, then reset, then import restores identical data', async ({ page }) => {
	await loadDemo(page);
	// Add something through the normal screens too.
	await page.goto('/proof');
	await page.getByLabel('Add a win').fill('Fixed the wobbly teapot lid');
	await page.getByRole('button', { name: 'Add win' }).click();
	await expect(page.getByTestId('win').first()).toContainText('Fixed the wobbly teapot lid');

	const first = await downloadBackup(page);
	expect(first.name).toMatch(/^backup-\d{4}-\d{2}-\d{2}\.getitdone\.json$/);
	const before = JSON.parse(first.text);
	expect(before).toMatchObject({ app: 'get-it-done', schemaVersion: 1 });
	expect(before.data.wins).toHaveLength(5);

	// Reset needs the typed word.
	const erase = page.getByRole('button', { name: 'Erase all data' });
	await expect(erase).toBeDisabled();
	await page.getByLabel('Type ERASE to confirm').fill('erase');
	await expect(erase).toBeDisabled();
	await page.getByLabel('Type ERASE to confirm').fill('ERASE');
	await erase.click();
	await expect(page.getByText('All data erased.')).toBeVisible();

	await page.goto('/proof');
	await expect(page.getByText('Your first win will show up here.')).toBeVisible();

	await page.goto('/settings');
	await page.getByLabel('Backup file (.json)').setInputFiles({
		name: first.name,
		mimeType: 'application/json',
		buffer: Buffer.from(first.text)
	});
	const preview = page.getByTestId('import-preview');
	await expect(preview).toContainText('5 wins');
	await expect(preview).toContainText('4 projects');
	await page.getByRole('button', { name: 'Replace my data with this backup' }).click();
	await expect(page.getByText(`Restored from ${first.name}.`)).toBeVisible();

	const second = await downloadBackup(page);
	const after = JSON.parse(second.text);
	expect(after.schemaVersion).toBe(before.schemaVersion);
	expect(after.data).toEqual(before.data);
	expect(JSON.stringify(after.data)).toBe(JSON.stringify(before.data));

	await page.goto('/');
	await expect(page.getByRole('textbox', { name: "Today's one thing" })).toHaveValue(
		/robot barista/
	);
});

test('a file that is not a backup is refused and nothing changes', async ({ page }) => {
	await loadDemo(page);
	await page.goto('/settings');
	await page.getByLabel('Backup file (.json)').setInputFiles({
		name: 'notes.json',
		mimeType: 'application/json',
		buffer: Buffer.from('{"hello":"world"}')
	});
	await expect(page.getByRole('alert')).toHaveText("This file isn't a Get It Done backup.");
	await expect(page.getByTestId('import-preview')).toHaveCount(0);
	await page.goto('/');
	await expect(page.getByRole('textbox', { name: "Today's one thing" })).toHaveValue(
		/robot barista/
	);
});
