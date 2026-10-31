import { db as defaultDb, allTables, SCHEMA_VERSION, type GetItDoneDB } from './db.ts';
import { validateAppData } from './validate.ts';
import { TABLE_NAMES, type AppData, type TableName } from '../types.ts';

export const BACKUP_APP_ID = 'get-it-done';
export const RESET_CONFIRM_WORD = 'ERASE';

export interface Backup {
	app: typeof BACKUP_APP_ID;
	schemaVersion: number;
	exportedAt: string;
	data: AppData;
}

/** Upgrades backup data from version n to n+1. Add one entry per schema bump. */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;
export const MIGRATIONS: Record<number, Migration> = {
	// 1: (data) => ({ ...data, newTable: [] }),  // would upgrade a v1 backup to v2
};

export type ParseResult =
	{ ok: true; backup: Backup; counts: Record<TableName, number> } | { ok: false; error: string };

export function emptyData(): AppData {
	return {
		goals: [],
		steps: [],
		projects: [],
		pages: [],
		blockers: [],
		waiting: [],
		wins: [],
		reviews: []
	};
}

export function countRows(data: AppData): Record<TableName, number> {
	const counts = {} as Record<TableName, number>;
	for (const t of TABLE_NAMES) counts[t] = data[t].length;
	return counts;
}

/** Runs each migration from the backup's version up to `target`. */
export function migrateBackupData(
	data: Record<string, unknown>,
	fromVersion: number,
	target = SCHEMA_VERSION,
	migrations: Record<number, Migration> = MIGRATIONS
): Record<string, unknown> {
	let out = data;
	for (let v = fromVersion; v < target; v++) {
		const step = migrations[v];
		if (!step) throw new Error(`No migration from schema version ${v} to ${v + 1}.`);
		out = step(out);
	}
	return out;
}

export function parseBackup(text: string): ParseResult {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return { ok: false, error: "This file isn't valid JSON." };
	}
	if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
		return { ok: false, error: "This file isn't a Get It Done backup." };
	}
	const r = raw as Record<string, unknown>;
	if (r.app !== BACKUP_APP_ID) return { ok: false, error: "This file isn't a Get It Done backup." };
	const version = r.schemaVersion;
	if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
		return { ok: false, error: 'The backup has no valid schema version.' };
	}
	if (version > SCHEMA_VERSION) {
		return {
			ok: false,
			error: `This backup comes from a newer version of the app (schema ${version}). Update the app first.`
		};
	}
	if (typeof r.data !== 'object' || r.data === null) {
		return { ok: false, error: 'The backup has no data section.' };
	}
	let data: Record<string, unknown>;
	try {
		data = migrateBackupData(r.data as Record<string, unknown>, version);
	} catch (e) {
		return {
			ok: false,
			error: e instanceof Error ? e.message : 'The backup could not be upgraded.'
		};
	}
	const problem = validateAppData(data);
	if (problem) return { ok: false, error: problem };
	const appData = data as unknown as AppData;
	const backup: Backup = {
		app: BACKUP_APP_ID,
		schemaVersion: SCHEMA_VERSION,
		exportedAt: typeof r.exportedAt === 'string' ? r.exportedAt : '',
		data: appData
	};
	return { ok: true, backup, counts: countRows(appData) };
}

export async function readAllData(d: GetItDoneDB = defaultDb): Promise<AppData> {
	return d.transaction('r', allTables(d), async () => ({
		goals: await d.goals.toArray(),
		steps: await d.steps.toArray(),
		projects: await d.projects.toArray(),
		pages: await d.pages.toArray(),
		blockers: await d.blockers.toArray(),
		waiting: await d.waiting.toArray(),
		wins: await d.wins.toArray(),
		reviews: await d.reviews.toArray()
	}));
}

export async function exportBackup(
	d: GetItDoneDB = defaultDb,
	now: Date = new Date()
): Promise<Backup> {
	return {
		app: BACKUP_APP_ID,
		schemaVersion: SCHEMA_VERSION,
		exportedAt: now.toISOString(),
		data: await readAllData(d)
	};
}

export function serializeBackup(b: Backup): string {
	return JSON.stringify(b, null, 2);
}

export function backupFileName(date: string): string {
	return `backup-${date}.getitdone.json`;
}

/** Replaces everything with the backup in one transaction: on any failure nothing changes. */
export async function importData(data: AppData, d: GetItDoneDB = defaultDb): Promise<void> {
	const problem = validateAppData(data);
	if (problem) throw new Error(problem);
	await d.transaction('rw', allTables(d), async () => {
		await Promise.all(allTables(d).map((t) => t.clear()));
		await d.goals.bulkAdd(data.goals);
		await d.steps.bulkAdd(data.steps);
		await d.projects.bulkAdd(data.projects);
		await d.pages.bulkAdd(data.pages);
		await d.blockers.bulkAdd(data.blockers);
		await d.waiting.bulkAdd(data.waiting);
		await d.wins.bulkAdd(data.wins);
		await d.reviews.bulkAdd(data.reviews);
	});
}

export function isResetConfirmed(typed: string): boolean {
	return typed.trim() === RESET_CONFIRM_WORD;
}

/** Erases every table. Callers must check `isResetConfirmed` first. */
export async function resetAllData(typed: string, d: GetItDoneDB = defaultDb): Promise<void> {
	if (!isResetConfirmed(typed)) throw new Error(`Type ${RESET_CONFIRM_WORD} to confirm.`);
	await d.transaction('rw', allTables(d), async () => {
		await Promise.all(allTables(d).map((t) => t.clear()));
	});
}

export async function isDatabaseEmpty(d: GetItDoneDB = defaultDb): Promise<boolean> {
	const counts = await d.transaction('r', allTables(d), () =>
		Promise.all(allTables(d).map((t) => t.count()))
	);
	return counts.every((c) => c === 0);
}
