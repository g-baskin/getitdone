import { describe, expect, it } from 'vitest';
import type { DailyPage } from '../types.ts';
import {
	applyYesterdayChoice,
	morningSteps,
	shouldAskAboutYesterday,
	unfinishedOneThing
} from './morning.ts';
import { emptyDailyPage, newDailyPage, previousPage, setOneThingDone } from './pages.ts';

function page(date: string, patch: Partial<DailyPage> = {}): DailyPage {
	return { ...emptyDailyPage(date), ...patch };
}

const unfinished = page('2026-10-30', {
	oneThing: { text: 'Fix the teapot hinge', stepId: 's2', done: false }
});

describe("rule 6: yesterday's unfinished one thing", () => {
	it('is detected when it was set and not marked done', () => {
		expect(unfinishedOneThing(unfinished)?.text).toBe('Fix the teapot hinge');
		expect(unfinishedOneThing(setOneThingDone(unfinished, true))).toBeNull();
		expect(unfinishedOneThing(page('2026-10-30'))).toBeNull();
		expect(unfinishedOneThing(undefined)).toBeNull();
	});

	it('is asked about first in the morning flow, once', () => {
		expect(shouldAskAboutYesterday(unfinished, undefined)).toBe(true);
		expect(morningSteps(false, true)[0]).toBe('yesterday');
		const answered = page('2026-10-31', { yesterdayChoice: 'drop' });
		expect(shouldAskAboutYesterday(unfinished, answered)).toBe(false);
		expect(morningSteps(false, false)).toEqual(['word', 'oneThing', 'why', 'top3', 'review']);
	});

	it('carry over keeps the text and its link', () => {
		const base = newDailyPage('2026-10-31', unfinished);
		const next = applyYesterdayChoice(base, 'carry', unfinished.oneThing);
		expect(next.oneThing).toEqual({ text: 'Fix the teapot hinge', stepId: 's2', done: false });
		expect(next.yesterdayChoice).toBe('carry');
	});

	it('shrink starts from the same text so it can be cut down', () => {
		const base = newDailyPage('2026-10-31', unfinished);
		const next = applyYesterdayChoice(base, 'shrink', unfinished.oneThing);
		expect(next.oneThing.text).toBe('Fix the teapot hinge');
		expect(next.yesterdayChoice).toBe('shrink');
	});

	it('drop leaves today empty (or with last evening pick) and never marks yesterday done', () => {
		const base = newDailyPage('2026-10-31', unfinished);
		const next = applyYesterdayChoice(base, 'drop', unfinished.oneThing);
		expect(next.oneThing.text).toBe('');
		expect(next.yesterdayChoice).toBe('drop');
		expect(unfinished.oneThing.done).toBe(false);
	});

	it('uses the most recent earlier page as "yesterday"', () => {
		const pages = [page('2026-10-20'), page('2026-10-29'), page('2026-10-31')];
		expect(previousPage(pages, '2026-10-31')?.date).toBe('2026-10-29');
		expect(previousPage(pages, '2026-10-20')).toBeUndefined();
	});
});

describe("rule 9: tomorrow's one thing", () => {
	const evening = page('2026-10-30', {
		oneThing: { text: 'Paint the sign', done: true },
		evening: { didOneThing: true, tomorrowOneThing: '  Pour the first test cup  ' }
	});

	it("pre-fills the next morning's one thing", () => {
		expect(newDailyPage('2026-10-31', evening).oneThing.text).toBe('Pour the first test cup');
	});

	it('can still be edited', () => {
		const p = newDailyPage('2026-10-31', evening);
		p.oneThing.text = 'Pour two test cups';
		expect(p.oneThing.text).toBe('Pour two test cups');
		expect(evening.evening.tomorrowOneThing).toBe('  Pour the first test cup  ');
	});

	it('leaves the morning blank when nothing was set', () => {
		expect(newDailyPage('2026-10-31', page('2026-10-30')).oneThing.text).toBe('');
		expect(newDailyPage('2026-10-31').oneThing.text).toBe('');
	});

	it('is replaced by a carried-over one thing when that is chosen', () => {
		const both = page('2026-10-30', {
			oneThing: { text: 'Fix the hinge', done: false },
			evening: { didOneThing: false, tomorrowOneThing: 'Pour a test cup' }
		});
		const base = newDailyPage('2026-10-31', both);
		expect(base.oneThing.text).toBe('Pour a test cup');
		expect(applyYesterdayChoice(base, 'carry', both.oneThing).oneThing.text).toBe('Fix the hinge');
		expect(applyYesterdayChoice(base, 'drop', both.oneThing).oneThing.text).toBe('Pour a test cup');
	});
});
