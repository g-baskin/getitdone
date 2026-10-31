import { beforeEach, describe, expect, it } from 'vitest';
import { db, SCHEMA_VERSION } from './db.ts';
import {
	exportBackup,
	importData,
	isDatabaseEmpty,
	migrateBackupData,
	parseBackup,
	readAllData,
	resetAllData,
	RESET_CONFIRM_WORD,
	serializeBackup
} from './backup.ts';
import { buildDemoData } from './demo.ts';
import { addBlocker, savePage } from './repo.ts';
import { emptyDailyPage } from '../rules/pages.ts';

const TODAY = '2026-10-31';

beforeEach(async () => {
	await resetAllData(RESET_CONFIRM_WORD);
});

describe('backup: export, reset, import', () => {
	it('restores identical data after a full round trip', async () => {
		await importData(buildDemoData(TODAY, new Date('2026-10-31T08:00:00Z')));
		// Data written through the app, including undefined optional fields, must survive too.
		await addBlocker({ what: 'Rocket is late', type: 'fear', ifThenPlan: '', createdOn: TODAY });
		const before = await readAllData();
		const file = serializeBackup(await exportBackup());

		await resetAllData(RESET_CONFIRM_WORD);
		expect(await isDatabaseEmpty()).toBe(true);

		const parsed = parseBackup(file);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) return;
		expect(parsed.counts.blockers).toBe(4);
		await importData(parsed.backup.data);

		const after = await readAllData();
		expect(JSON.stringify(after)).toBe(JSON.stringify(before));
		expect(serializeBackup({ ...(await exportBackup()), exportedAt: '' })).toBe(
			serializeBackup({ ...JSON.parse(file), exportedAt: '' })
		);
	});

	it('reset needs the typed confirmation word', async () => {
		await savePage(emptyDailyPage(TODAY));
		await expect(resetAllData('erase please')).rejects.toThrow();
		expect(await isDatabaseEmpty()).toBe(false);
		await resetAllData(RESET_CONFIRM_WORD);
		expect(await isDatabaseEmpty()).toBe(true);
	});

	it('rejects files that are not valid backups and leaves data untouched', async () => {
		await savePage(emptyDailyPage(TODAY));
		expect(parseBackup('not json').ok).toBe(false);
		expect(parseBackup('{"app":"other","schemaVersion":1,"data":{}}').ok).toBe(false);
		expect(parseBackup('{"app":"get-it-done","data":{}}').ok).toBe(false);
		const future = parseBackup(
			JSON.stringify({ app: 'get-it-done', schemaVersion: SCHEMA_VERSION + 1, data: {} })
		);
		expect(future.ok === false && future.error).toMatch(/newer version/);
		const broken = buildDemoData(TODAY);
		(broken.blockers[0] as unknown as Record<string, unknown>).type = 'dragon';
		const bad = parseBackup(JSON.stringify({ app: 'get-it-done', schemaVersion: 1, data: broken }));
		expect(bad.ok === false && bad.error).toMatch(/blockers/);
		await expect(importData(broken)).rejects.toThrow();
		expect((await readAllData()).pages).toHaveLength(1);
	});

	it('rolls back the whole import if any write fails', async () => {
		await savePage(emptyDailyPage(TODAY));
		const dup = buildDemoData(TODAY);
		dup.wins.push({ ...dup.wins[0]! });
		// Validation catches duplicates; bypass it to prove the transaction itself is atomic.
		await expect(
			db.transaction('rw', db.pages, db.wins, async () => {
				await db.pages.clear();
				await db.wins.bulkAdd(dup.wins);
			})
		).rejects.toThrow();
		expect((await readAllData()).pages.map((p) => p.date)).toEqual([TODAY]);
	});
});

describe('schema version and migration path', () => {
	it('stamps backups with the schema version and accepts version 1', async () => {
		const b = await exportBackup();
		expect(b.schemaVersion).toBe(SCHEMA_VERSION);
		expect(SCHEMA_VERSION).toBe(1);
		expect(parseBackup(serializeBackup(b)).ok).toBe(true);
	});

	it('applies each migration in order from version 1 up to the current version', () => {
		const migrations = {
			1: (d: Record<string, unknown>) => ({ ...d, a: 1 }),
			2: (d: Record<string, unknown>) => ({ ...d, b: (d.a as number) + 1 })
		};
		expect(migrateBackupData({}, 1, 3, migrations)).toEqual({ a: 1, b: 2 });
		expect(migrateBackupData({ x: 1 }, 1, 1, {})).toEqual({ x: 1 });
		expect(() => migrateBackupData({}, 1, 2, {})).toThrow(/No migration/);
	});
});
