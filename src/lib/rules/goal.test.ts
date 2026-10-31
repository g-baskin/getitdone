import { describe, expect, it } from 'vitest';
import type { Goal, Step } from '../types.ts';
import { activeGoal, addStep, canAddStep, makeActive, MAX_STEPS, moveStep } from './goal.ts';

const step = (id: string, order: number, goalId = 'g'): Step => ({
	id,
	goalId,
	title: id,
	status: 'todo',
	order
});

describe('goal and big steps', () => {
	it('keeps only one goal active', () => {
		const goals: Goal[] = [
			{ id: 'a', title: 'A', deadline: '', why: '', active: true },
			{ id: 'b', title: 'B', deadline: '', why: '', active: false }
		];
		const next = makeActive(goals, 'b');
		expect(next.filter((g) => g.active).map((g) => g.id)).toEqual(['b']);
		expect(activeGoal(next)?.id).toBe('b');
	});

	it('holds at most five steps per goal', () => {
		const five = [0, 1, 2, 3, 4].map((i) => step(`s${i}`, i));
		expect(MAX_STEPS).toBe(5);
		expect(canAddStep(five, 'g')).toBe(false);
		expect(addStep(five, 'g', 'Sixth', 'x')).toEqual({ ok: false, error: 'limit' });
		expect(canAddStep(five, 'other')).toBe(true);
		const result = addStep(five.slice(0, 4), 'g', ' Fifth ', 'x');
		expect(result).toEqual({
			ok: true,
			step: { id: 'x', goalId: 'g', title: 'Fifth', status: 'todo', order: 4 }
		});
		expect(addStep([], 'g', '  ', 'x')).toEqual({ ok: false, error: 'title-required' });
	});

	it('reorders by swapping neighbours', () => {
		const steps = [step('a', 0), step('b', 1), step('c', 2)];
		expect(moveStep(steps, 'g', 'b', -1)).toEqual([{ ...step('b', 0) }, { ...step('a', 1) }]);
		expect(moveStep(steps, 'g', 'a', -1)).toEqual([]);
	});
});
