import { Dexie, type EntityTable } from 'dexie';
import type {
	Blocker,
	DailyPage,
	Goal,
	Project,
	Step,
	WaitingItem,
	WeeklyReview,
	Win
} from '../types.ts';

export const DB_NAME = 'getitdone';

/**
 * Current schema version, shared by IndexedDB and JSON backups.
 * To change the schema: bump this, add `db.version(n).stores(...).upgrade(...)` below,
 * and add a backup migration from n-1 in `backup.ts`.
 */
export const SCHEMA_VERSION = 1;

export type GetItDoneDB = Dexie & {
	goals: EntityTable<Goal, 'id'>;
	steps: EntityTable<Step, 'id'>;
	projects: EntityTable<Project, 'id'>;
	pages: EntityTable<DailyPage, 'date'>;
	blockers: EntityTable<Blocker, 'id'>;
	waiting: EntityTable<WaitingItem, 'id'>;
	wins: EntityTable<Win, 'id'>;
	reviews: EntityTable<WeeklyReview, 'weekOf'>;
};

export function openDatabase(name = DB_NAME): GetItDoneDB {
	const db = new Dexie(name) as GetItDoneDB;
	db.version(1).stores({
		goals: 'id',
		steps: 'id, goalId',
		projects: 'id, status',
		pages: 'date',
		blockers: 'id, createdOn',
		waiting: 'id, status',
		wins: 'id, date',
		reviews: 'weekOf'
	});
	return db;
}

export const db = openDatabase();

export function allTables(d: GetItDoneDB = db) {
	return [d.goals, d.steps, d.projects, d.pages, d.blockers, d.waiting, d.wins, d.reviews];
}
