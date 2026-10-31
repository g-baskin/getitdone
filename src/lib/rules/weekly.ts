import { isSunday, mondayOf } from '../dates.ts';
import type {
	ISODate,
	ParkedDecision,
	Project,
	Rating,
	RatingKey,
	WeeklyReview,
	Win
} from '../types.ts';

export const RATING_KEYS: readonly RatingKey[] = [
	'clarity',
	'energy',
	'drive',
	'output',
	'impact',
	'courage'
];

export const RATING_LABELS: Record<RatingKey, { label: string; hint: string }> = {
	clarity: { label: 'Clarity', hint: 'I knew what mattered and why.' },
	energy: { label: 'Energy', hint: 'Sleep, movement, food and breaks.' },
	drive: { label: 'Drive', hint: 'I cared about the outcome and kept going.' },
	output: { label: 'Output', hint: 'I moved the work that matters most.' },
	impact: { label: 'Impact on others', hint: 'I helped and showed up for people.' },
	courage: { label: 'Courage', hint: 'I spoke up and took the brave step.' }
};

export const INTENTION_LABELS = {
	self: 'Myself',
	people: 'The people around me',
	skills: "The skills I'm building",
	service: "The difference I'm making for others"
} as const;

export function weekOf(date: ISODate): ISODate {
	return mondayOf(date);
}

/** The review is suggested on Sundays and available any day. */
export function shouldSuggestReview(today: ISODate, existing: WeeklyReview | undefined): boolean {
	return isSunday(today) && !existing;
}

function emptyRatings(): Record<RatingKey, Rating> {
	return {
		clarity: { score: null },
		energy: { score: null },
		drive: { score: null },
		output: { score: null },
		impact: { score: null },
		courage: { score: null }
	};
}

export function emptyWeeklyReview(week: ISODate): WeeklyReview {
	return {
		weekOf: week,
		intentions: { self: '', people: '', skills: '', service: '' },
		ratings: emptyRatings(),
		mainOutputPercent: null,
		parkedDecisions: [],
		topWins: ['', '', ''],
		nextWeekFocus: '',
		nextWeekStepId: undefined
	};
}

/** A new review lists every parked project as "keep" and suggests the week's first wins. */
export function startWeeklyReview(
	week: ISODate,
	projects: Project[],
	weekWins: Win[]
): WeeklyReview {
	const review = emptyWeeklyReview(week);
	review.parkedDecisions = syncParkedDecisions([], projects);
	const picks = weekWins.slice(0, 3).map((w) => w.text);
	review.topWins = [picks[0] ?? '', picks[1] ?? '', picks[2] ?? ''];
	return review;
}

/** Keeps existing decisions and adds any project that has been parked since. */
export function syncParkedDecisions(
	existing: ParkedDecision[],
	projects: Project[]
): ParkedDecision[] {
	const out = [...existing];
	for (const p of projects) {
		if (p.status === 'parked' && !out.some((d) => d.projectId === p.id)) {
			out.push({ projectId: p.id, name: p.name, decision: 'keep' });
		}
	}
	return out;
}

export function clampScore(value: unknown): number | null {
	if (value === '' || value === null || value === undefined) return null;
	const n = Math.round(Number(value));
	if (!Number.isFinite(n)) return null;
	return Math.min(10, Math.max(1, n));
}

export function clampPercent(value: unknown): number | null {
	if (value === '' || value === null || value === undefined) return null;
	const n = Math.round(Number(value));
	if (!Number.isFinite(n)) return null;
	return Math.min(100, Math.max(0, n));
}
