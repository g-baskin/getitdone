import { isValidISODate } from '../dates.ts';
import { TABLE_NAMES, type AppData, type TableName } from '../types.ts';

type Rec = Record<string, unknown>;
type Check = (v: unknown) => boolean;

const str: Check = (v) => typeof v === 'string';
const bool: Check = (v) => typeof v === 'boolean';
const num: Check = (v) => typeof v === 'number' && Number.isFinite(v);
const date: Check = (v) => isValidISODate(v);
const dateOrEmpty: Check = (v) => v === '' || isValidISODate(v);
const opt =
	(c: Check): Check =>
	(v) =>
		v === undefined || c(v);
const oneOf =
	(...values: string[]): Check =>
	(v) =>
		typeof v === 'string' && values.includes(v);
const numOrNull: Check = (v) => v === null || num(v);
const strTuple3: Check = (v) => Array.isArray(v) && v.length === 3 && v.every(str);
const obj =
	(shape: Record<string, Check>): Check =>
	(v) =>
		isRecord(v) && Object.entries(shape).every(([k, c]) => c(v[k]));

function isRecord(v: unknown): v is Rec {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const rating = obj({ score: numOrNull, note: opt(str) });

const SHAPES: Record<TableName, Record<string, Check>> = {
	goals: { id: str, title: str, deadline: dateOrEmpty, why: str, active: bool },
	steps: {
		id: str,
		goalId: str,
		title: str,
		status: oneOf('todo', 'doing', 'done'),
		targetDate: opt(date),
		order: num
	},
	projects: {
		id: str,
		name: str,
		status: oneOf('active', 'parked', 'done'),
		nextStep: str,
		parkedReason: opt(str),
		updatedAt: str
	},
	pages: {
		date,
		oneThing: obj({ text: str, projectId: opt(str), stepId: opt(str), done: bool }),
		whyItMatters: str,
		whoIsCountingOnMe: str,
		todaysWord: str,
		important: strTuple3,
		energy: obj({ sleepHours: opt(num), moved: bool, focusBlocks: num }),
		evening: obj({
			didOneThing: opt(bool),
			win: opt(str),
			lesson: opt(str),
			tomorrowOneThing: opt(str)
		}),
		minimumDay: bool,
		yesterdayChoice: opt(oneOf('carry', 'shrink', 'drop'))
	},
	blockers: {
		id: str,
		what: str,
		who: opt(str),
		type: oneOf('person', 'decision', 'info', 'money', 'skill', 'fear'),
		ifThenPlan: str,
		nextStep: opt(str),
		createdOn: date,
		resolvedOn: opt(date)
	},
	waiting: {
		id: str,
		what: str,
		fromWhom: str,
		since: date,
		followUpOn: date,
		status: oneOf('waiting', 'received', 'dropped'),
		notes: opt(str)
	},
	wins: {
		id: str,
		date,
		text: str,
		source: oneOf('evening', 'manual', 'step-completed')
	},
	reviews: {
		weekOf: date,
		intentions: obj({ self: str, people: str, skills: str, service: str }),
		ratings: obj({
			clarity: rating,
			energy: rating,
			drive: rating,
			output: rating,
			impact: rating,
			courage: rating
		}),
		mainOutputPercent: numOrNull,
		parkedDecisions: (v) =>
			Array.isArray(v) &&
			v.every(obj({ projectId: str, name: str, decision: oneOf('keep', 'restart', 'drop') })),
		topWins: strTuple3,
		nextWeekFocus: str,
		nextWeekStepId: opt(str)
	}
};

const KEYS: Record<TableName, string> = {
	goals: 'id',
	steps: 'id',
	projects: 'id',
	pages: 'date',
	blockers: 'id',
	waiting: 'id',
	wins: 'id',
	reviews: 'weekOf'
};

/** Returns a readable problem, or null when every record has the shape the app expects. */
export function validateAppData(data: unknown): string | null {
	if (!isRecord(data)) return 'The backup has no data section.';
	for (const table of TABLE_NAMES) {
		const rows = data[table];
		if (!Array.isArray(rows)) return `The backup is missing the "${table}" list.`;
		const shape = SHAPES[table];
		const seen = new Set<unknown>();
		for (let i = 0; i < rows.length; i++) {
			const row: unknown = rows[i];
			if (!isRecord(row)) return `Item ${i + 1} in "${table}" isn't a record.`;
			for (const [field, check] of Object.entries(shape)) {
				if (!check(row[field])) return `Item ${i + 1} in "${table}" has an unexpected "${field}".`;
			}
			const key = row[KEYS[table]];
			if (seen.has(key)) return `"${table}" has two items with the same key.`;
			seen.add(key);
		}
	}
	return null;
}

export function isAppData(data: unknown): data is AppData {
	return validateAppData(data) === null;
}
