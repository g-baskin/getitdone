import { daysBetween } from '../dates.ts';
import type { Blocker, BlockerType, ISODate } from '../types.ts';

export const BLOCKER_TYPES: readonly { value: BlockerType; label: string }[] = [
	{ value: 'person', label: 'Person' },
	{ value: 'decision', label: 'Decision' },
	{ value: 'info', label: 'Info' },
	{ value: 'money', label: 'Money' },
	{ value: 'skill', label: 'Skill' },
	{ value: 'fear', label: 'Fear' }
];

export const IF_THEN_PLACEHOLDER =
	"If the Lunar Council hasn't replied by Thursday, then I'll call them at lunch.";
export const PLAN_PROMPT = 'A quick "if this, then that" plan makes this easier to handle.';
export const FEAR_PROMPT = "What's the smallest brave step?";

export function blockerTypeLabel(type: BlockerType): string {
	return BLOCKER_TYPES.find((t) => t.value === type)?.label ?? type;
}

export interface BlockerPrompts {
	/** Soft prompt shown while the if-then plan is empty. Never blocks saving. */
	plan: string | null;
	/** Shown for fear blockers. */
	fear: string | null;
}

export function blockerPrompts(b: Pick<Blocker, 'type' | 'ifThenPlan'>): BlockerPrompts {
	return {
		plan: b.ifThenPlan.trim() ? null : PLAN_PROMPT,
		fear: b.type === 'fear' ? FEAR_PROMPT : null
	};
}

export function nextStepLabel(type: BlockerType): string {
	return type === 'fear' ? 'Smallest brave step' : 'Next step';
}

export function blockerAgeDays(b: Pick<Blocker, 'createdOn'>, today: ISODate): number {
	return Math.max(0, daysBetween(b.createdOn, today));
}

export function blockerAgeLabel(b: Pick<Blocker, 'createdOn'>, today: ISODate): string {
	const n = blockerAgeDays(b, today);
	if (n === 0) return 'new today';
	return `open ${n} ${n === 1 ? 'day' : 'days'}`;
}

export const BLOCKER_WHAT_REQUIRED = 'Say what is in the way.';

export function blockerWhatError(what: string): string | null {
	return what.trim() ? null : BLOCKER_WHAT_REQUIRED;
}
