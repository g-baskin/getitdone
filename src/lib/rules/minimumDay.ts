export type TodaySection =
	| 'word'
	| 'oneThing'
	| 'whyWho'
	| 'workingOn'
	| 'important'
	| 'blockers'
	| 'waiting'
	| 'energy'
	| 'win'
	| 'lesson'
	| 'tomorrow';

export const ALL_SECTIONS: readonly TodaySection[] = [
	'word',
	'oneThing',
	'whyWho',
	'workingOn',
	'important',
	'blockers',
	'waiting',
	'energy',
	'win',
	'lesson',
	'tomorrow'
];

/** A minimum day is just the one thing and one win. */
export const MINIMUM_SECTIONS: readonly TodaySection[] = ['oneThing', 'win'];

export function visibleSections(minimumDay: boolean): Set<TodaySection> {
	return new Set(minimumDay ? MINIMUM_SECTIONS : ALL_SECTIONS);
}

export type EveningField = 'didOneThing' | 'win' | 'lesson' | 'tomorrow';

export function eveningFields(minimumDay: boolean): EveningField[] {
	return minimumDay ? ['didOneThing', 'win'] : ['didOneThing', 'win', 'lesson', 'tomorrow'];
}

export const MINIMUM_DAY_NOTE = 'Just the one thing and one win today. That counts as a full day.';
