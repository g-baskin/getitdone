import { describe, expect, it } from 'vitest';
import {
	blockerAgeLabel,
	blockerPrompts,
	blockerWhatError,
	FEAR_PROMPT,
	IF_THEN_PLACEHOLDER,
	nextStepLabel,
	PLAN_PROMPT
} from './blockers.ts';

describe('rule 5: blockers need a plan', () => {
	it('has an example if-then plan as a placeholder', () => {
		expect(IF_THEN_PLACEHOLDER).toMatch(/^If .+, then I'll .+/);
	});

	it('gently prompts while the if-then plan is empty, but never blocks', () => {
		expect(blockerPrompts({ type: 'person', ifThenPlan: '' }).plan).toBe(PLAN_PROMPT);
		expect(blockerPrompts({ type: 'person', ifThenPlan: '  ' }).plan).toBe(PLAN_PROMPT);
		expect(blockerPrompts({ type: 'person', ifThenPlan: 'If X, then Y' }).plan).toBeNull();
		expect(blockerWhatError('Need a stamp')).toBeNull();
	});

	it('asks for the smallest brave step when the type is fear', () => {
		expect(blockerPrompts({ type: 'fear', ifThenPlan: 'If X, then Y' }).fear).toBe(FEAR_PROMPT);
		expect(FEAR_PROMPT).toBe("What's the smallest brave step?");
		expect(nextStepLabel('fear')).toBe('Smallest brave step');
		for (const type of ['person', 'decision', 'info', 'money', 'skill'] as const) {
			expect(blockerPrompts({ type, ifThenPlan: '' }).fear).toBeNull();
			expect(nextStepLabel(type)).toBe('Next step');
		}
	});

	it('shows how long a blocker has been open', () => {
		expect(blockerAgeLabel({ createdOn: '2026-10-31' }, '2026-10-31')).toBe('new today');
		expect(blockerAgeLabel({ createdOn: '2026-10-28' }, '2026-10-31')).toBe('open 3 days');
	});
});
