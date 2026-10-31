import type { Goal, Step, StepStatus } from '../types.ts';

export const MAX_STEPS = 5;
export const STEP_LIMIT_NOTE =
	'Five big steps is the most a goal can hold. Finish or remove one to add another.';

export const STEP_STATUSES: readonly { value: StepStatus; label: string }[] = [
	{ value: 'todo', label: 'To do' },
	{ value: 'doing', label: 'Doing' },
	{ value: 'done', label: 'Done' }
];

export function activeGoal(goals: Goal[]): Goal | undefined {
	return goals.find((g) => g.active);
}

/** Only one goal is active at a time. */
export function makeActive(goals: Goal[], goalId: string): Goal[] {
	return goals.map((g) => ({ ...g, active: g.id === goalId }));
}

export function stepsFor(steps: Step[], goalId: string): Step[] {
	return steps.filter((s) => s.goalId === goalId).sort((a, b) => a.order - b.order);
}

export function canAddStep(steps: Step[], goalId: string): boolean {
	return stepsFor(steps, goalId).length < MAX_STEPS;
}

export type AddStepResult =
	{ ok: true; step: Step } | { ok: false; error: 'limit' | 'title-required' };

export function addStep(steps: Step[], goalId: string, title: string, id: string): AddStepResult {
	if (!title.trim()) return { ok: false, error: 'title-required' };
	if (!canAddStep(steps, goalId)) return { ok: false, error: 'limit' };
	const mine = stepsFor(steps, goalId);
	const order = mine.length ? Math.max(...mine.map((s) => s.order)) + 1 : 0;
	return { ok: true, step: { id, goalId, title: title.trim(), status: 'todo', order } };
}

/** Swaps a step with its neighbour; returns the steps whose order changed. */
export function moveStep(steps: Step[], goalId: string, stepId: string, dir: -1 | 1): Step[] {
	const mine = stepsFor(steps, goalId);
	const i = mine.findIndex((s) => s.id === stepId);
	const j = i + dir;
	if (i < 0 || j < 0 || j >= mine.length) return [];
	const a = mine[i];
	const b = mine[j];
	if (!a || !b) return [];
	return [
		{ ...a, order: b.order },
		{ ...b, order: a.order }
	];
}

export function stepStatusLabel(status: StepStatus): string {
	return STEP_STATUSES.find((s) => s.value === status)?.label ?? status;
}
