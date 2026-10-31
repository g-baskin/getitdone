import { describe, expect, it } from 'vitest';
import type { OneThing } from '../types.ts';
import {
	applyLinkValue,
	goalLinkNote,
	linkValue,
	NOT_TIED_TO_GOAL,
	ONE_THING_REQUIRED,
	oneThingError
} from './oneThing.ts';

describe('rule 1: one thing', () => {
	it('is required to finish the morning', () => {
		expect(oneThingError('')).toBe(ONE_THING_REQUIRED);
		expect(oneThingError('   ')).toBe(ONE_THING_REQUIRED);
		expect(oneThingError('Ship the menu')).toBeNull();
	});

	it('shows a gentle note when linked to neither a step nor a project, without blocking', () => {
		expect(goalLinkNote({ text: 'Ship the menu' })).toBe(NOT_TIED_TO_GOAL);
		expect(goalLinkNote({ text: 'Ship the menu', stepId: 's1' })).toBeNull();
		expect(goalLinkNote({ text: 'Ship the menu', projectId: 'p1' })).toBeNull();
		expect(goalLinkNote({ text: '' })).toBeNull();
		expect(oneThingError('Ship the menu')).toBeNull();
	});

	it('links to exactly one step or project at a time', () => {
		const base: OneThing = { text: 'x', done: false, projectId: 'p1' };
		expect(linkValue(base)).toBe('project:p1');
		const toStep = applyLinkValue(base, 'step:s1');
		expect(toStep.stepId).toBe('s1');
		expect(toStep.projectId).toBeUndefined();
		const none = applyLinkValue(toStep, '');
		expect(none.stepId).toBeUndefined();
		expect(none.projectId).toBeUndefined();
	});
});
