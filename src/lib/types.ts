/** A local calendar date, `YYYY-MM-DD`. */
export type ISODate = string;

export interface Goal {
	id: string;
	title: string;
	/** Empty string when no deadline has been chosen yet. */
	deadline: ISODate | '';
	why: string;
	active: boolean;
}

export type StepStatus = 'todo' | 'doing' | 'done';

export interface Step {
	id: string;
	goalId: string;
	title: string;
	status: StepStatus;
	targetDate?: ISODate;
	order: number;
}

export type ProjectStatus = 'active' | 'parked' | 'done';

export interface Project {
	id: string;
	name: string;
	status: ProjectStatus;
	nextStep: string;
	parkedReason?: string;
	/** ISO timestamp. */
	updatedAt: string;
}

export interface OneThing {
	text: string;
	projectId?: string;
	stepId?: string;
	done: boolean;
}

export interface Energy {
	sleepHours?: number;
	moved: boolean;
	focusBlocks: number;
}

export interface Evening {
	didOneThing?: boolean;
	win?: string;
	lesson?: string;
	tomorrowOneThing?: string;
}

/** How the morning flow handled the previous day's unfinished one thing. */
export type YesterdayChoice = 'carry' | 'shrink' | 'drop';

export interface DailyPage {
	date: ISODate;
	oneThing: OneThing;
	whyItMatters: string;
	whoIsCountingOnMe: string;
	todaysWord: string;
	important: [string, string, string];
	energy: Energy;
	evening: Evening;
	minimumDay: boolean;
	/** Set once the morning flow has asked about the previous unfinished one thing. */
	yesterdayChoice?: YesterdayChoice;
}

export type BlockerType = 'person' | 'decision' | 'info' | 'money' | 'skill' | 'fear';

export interface Blocker {
	id: string;
	what: string;
	who?: string;
	type: BlockerType;
	ifThenPlan: string;
	nextStep?: string;
	createdOn: ISODate;
	resolvedOn?: ISODate;
}

export type WaitingStatus = 'waiting' | 'received' | 'dropped';

export interface WaitingItem {
	id: string;
	what: string;
	fromWhom: string;
	since: ISODate;
	followUpOn: ISODate;
	status: WaitingStatus;
	notes?: string;
}

export type WinSource = 'evening' | 'manual' | 'step-completed';

export interface Win {
	id: string;
	date: ISODate;
	text: string;
	source: WinSource;
}

export type RatingKey = 'clarity' | 'energy' | 'drive' | 'output' | 'impact' | 'courage';

export interface Rating {
	/** 1-10, or null when not rated yet. */
	score: number | null;
	note?: string;
}

export type ParkedChoice = 'keep' | 'restart' | 'drop';

export interface ParkedDecision {
	projectId: string;
	/** Copy of the project name so the printed review still reads well later. */
	name: string;
	decision: ParkedChoice;
}

export interface WeeklyReview {
	/** Monday of the week being reviewed. */
	weekOf: ISODate;
	intentions: { self: string; people: string; skills: string; service: string };
	ratings: Record<RatingKey, Rating>;
	/** 0-100, or null when not filled in yet. */
	mainOutputPercent: number | null;
	parkedDecisions: ParkedDecision[];
	topWins: [string, string, string];
	nextWeekFocus: string;
	nextWeekStepId?: string;
}

export interface AppData {
	goals: Goal[];
	steps: Step[];
	projects: Project[];
	pages: DailyPage[];
	blockers: Blocker[];
	waiting: WaitingItem[];
	wins: Win[];
	reviews: WeeklyReview[];
}

export type TableName = keyof AppData;

export const TABLE_NAMES: readonly TableName[] = [
	'goals',
	'steps',
	'projects',
	'pages',
	'blockers',
	'waiting',
	'wins',
	'reviews'
];
