import { describe, expect, it } from 'vitest';
import { eveningFields, MINIMUM_DAY_NOTE, visibleSections } from './minimumDay.ts';
import { morningSteps } from './morning.ts';

describe('rule 7: minimum day', () => {
	it('reduces the page to the one thing plus one win', () => {
		expect([...visibleSections(true)]).toEqual(['oneThing', 'win']);
		expect(visibleSections(false).size).toBe(11);
	});

	it('shortens the morning and evening the same way', () => {
		expect(morningSteps(true, false)).toEqual(['oneThing']);
		expect(morningSteps(true, true)).toEqual(['yesterday', 'oneThing']);
		expect(eveningFields(true)).toEqual(['didOneThing', 'win']);
		expect(eveningFields(false)).toEqual(['didOneThing', 'win', 'lesson', 'tomorrow']);
	});

	it('uses kind copy with no streak or guilt language', () => {
		expect(MINIMUM_DAY_NOTE).not.toMatch(/streak|fail|miss|lazy|behind|should/i);
	});
});
