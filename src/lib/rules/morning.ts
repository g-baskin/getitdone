import type { DailyPage, OneThing, YesterdayChoice } from '../types.ts';

/** Yesterday's one thing, if it was set and not marked done. */
export function unfinishedOneThing(prev: DailyPage | undefined): OneThing | null {
	if (!prev) return null;
	if (!prev.oneThing.text.trim() || prev.oneThing.done) return null;
	return prev.oneThing;
}

/** The morning flow asks about it first, once per day. */
export function shouldAskAboutYesterday(
	prev: DailyPage | undefined,
	todayPage: DailyPage | undefined
): boolean {
	return unfinishedOneThing(prev) !== null && !todayPage?.yesterdayChoice;
}

/**
 * Applies the choice to today's page. `base` is today's page before any choice,
 * so switching between choices always starts from the same place.
 */
export function applyYesterdayChoice(
	base: DailyPage,
	choice: YesterdayChoice,
	unfinished: OneThing
): DailyPage {
	if (choice === 'drop') return { ...base, yesterdayChoice: 'drop' };
	return {
		...base,
		yesterdayChoice: choice,
		oneThing: {
			text: unfinished.text,
			projectId: unfinished.projectId,
			stepId: unfinished.stepId,
			done: false
		}
	};
}

export type MorningStep = 'yesterday' | 'word' | 'oneThing' | 'why' | 'top3' | 'review';

export const MORNING_STEPS: readonly MorningStep[] = ['word', 'oneThing', 'why', 'top3', 'review'];

/** A minimum day keeps only the one thing. */
export function morningSteps(minimumDay: boolean, askYesterday: boolean): MorningStep[] {
	const steps: MorningStep[] = minimumDay ? ['oneThing'] : [...MORNING_STEPS];
	return askYesterday ? ['yesterday', ...steps] : steps;
}
