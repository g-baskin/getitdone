import type { OneThing } from '../types.ts';

export const ONE_THING_REQUIRED = 'Pick one thing to keep going. Small is fine.';
export const NOT_TIED_TO_GOAL = "This isn't tied to your goal. Still the right call?";

/** The one thing is the only required field of the morning. */
export function oneThingError(text: string): string | null {
	return text.trim() ? null : ONE_THING_REQUIRED;
}

export function isLinked(o: Pick<OneThing, 'projectId' | 'stepId'>): boolean {
	return Boolean(o.projectId || o.stepId);
}

/** A gentle, non-blocking note when the one thing is linked to neither a step nor a project. */
export function goalLinkNote(o: Pick<OneThing, 'text' | 'projectId' | 'stepId'>): string | null {
	if (!o.text.trim() || isLinked(o)) return null;
	return NOT_TIED_TO_GOAL;
}

/** Encodes the link for a single <select>: "step:<id>", "project:<id>" or "". */
export function linkValue(o: Pick<OneThing, 'projectId' | 'stepId'>): string {
	if (o.stepId) return `step:${o.stepId}`;
	if (o.projectId) return `project:${o.projectId}`;
	return '';
}

export function applyLinkValue<T extends OneThing>(o: T, value: string): T {
	const next: T = { ...o, stepId: undefined, projectId: undefined };
	if (value.startsWith('step:')) next.stepId = value.slice(5);
	else if (value.startsWith('project:')) next.projectId = value.slice(8);
	return next;
}
