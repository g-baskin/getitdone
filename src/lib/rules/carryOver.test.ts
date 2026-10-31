import { describe, expect, it } from 'vitest';
import type { Blocker, WaitingItem } from '../types.ts';
import { isBlockerOpenOn, openBlockers, openWaiting, sortByAge } from './carryOver.ts';

const blocker = (id: string, createdOn: string, resolvedOn?: string): Blocker => ({
	id,
	what: id,
	type: 'info',
	ifThenPlan: '',
	createdOn,
	resolvedOn
});
const waiting = (id: string, since: string, status: WaitingItem['status']): WaitingItem => ({
	id,
	what: id,
	fromWhom: 'Dr. Moonbeam',
	since,
	followUpOn: since,
	status
});

describe('rule 3: carry-over', () => {
	it('shows an unresolved blocker on every new day', () => {
		const b = blocker('b1', '2026-10-28');
		expect(isBlockerOpenOn(b, '2026-10-28')).toBe(true);
		expect(isBlockerOpenOn(b, '2026-10-29')).toBe(true);
		expect(isBlockerOpenOn(b, '2026-11-15')).toBe(true);
		expect(isBlockerOpenOn(b, '2026-10-27')).toBe(false);
	});

	it('stops carrying a blocker over once it is resolved', () => {
		const b = blocker('b1', '2026-10-28', '2026-10-30');
		expect(isBlockerOpenOn(b, '2026-10-29')).toBe(true);
		expect(isBlockerOpenOn(b, '2026-10-30')).toBe(false);
		expect(isBlockerOpenOn(b, '2026-10-31')).toBe(false);
	});

	it('lists open blockers oldest first', () => {
		const list = [
			blocker('new', '2026-10-30'),
			blocker('done', '2026-10-01', '2026-10-02'),
			blocker('old', '2026-10-20')
		];
		expect(openBlockers(list, '2026-10-31').map((b) => b.id)).toEqual(['old', 'new']);
	});

	it('keeps waiting items until they are received or dropped', () => {
		const list = [
			waiting('w1', '2026-10-20', 'waiting'),
			waiting('w2', '2026-10-21', 'received'),
			waiting('w3', '2026-10-22', 'dropped'),
			waiting('w0', '2026-10-01', 'waiting')
		];
		expect(openWaiting(list).map((w) => w.id)).toEqual(['w0', 'w1']);
	});

	it('sorts by age both ways', () => {
		const list = [waiting('b', '2026-10-05', 'waiting'), waiting('a', '2026-10-01', 'waiting')];
		expect(sortByAge(list, (w) => w.since, 'oldest').map((w) => w.id)).toEqual(['a', 'b']);
		expect(sortByAge(list, (w) => w.since, 'newest').map((w) => w.id)).toEqual(['b', 'a']);
	});
});
