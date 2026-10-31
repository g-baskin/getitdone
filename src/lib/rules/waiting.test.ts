import { describe, expect, it } from 'vitest';
import type { WaitingItem } from '../types.ts';
import {
	followUpMessage,
	isFollowUpDue,
	isFollowUpToday,
	waitingDays,
	waitingLabel
} from './waiting.ts';

const item: WaitingItem = {
	id: 'w1',
	what: 'the signed crater lease',
	fromWhom: 'Dr. Moonbeam',
	since: '2026-10-22',
	followUpOn: '2026-10-29',
	status: 'waiting'
};

describe('rule 4: waiting items age', () => {
	it('counts the days waited', () => {
		expect(waitingDays(item, '2026-10-22')).toBe(0);
		expect(waitingDays(item, '2026-10-31')).toBe(9);
		expect(waitingLabel(item, '2026-10-22')).toBe('waiting since today');
		expect(waitingLabel(item, '2026-10-23')).toBe('waiting 1 day');
		expect(waitingLabel(item, '2026-10-31')).toBe('waiting 9 days');
	});

	it('is highlighted only once today is past the follow-up date', () => {
		expect(isFollowUpDue(item, '2026-10-28')).toBe(false);
		expect(isFollowUpDue(item, '2026-10-29')).toBe(false);
		expect(isFollowUpToday(item, '2026-10-29')).toBe(true);
		expect(isFollowUpDue(item, '2026-10-30')).toBe(true);
	});

	it('is never highlighted once received or dropped', () => {
		expect(isFollowUpDue({ ...item, status: 'received' }, '2026-11-30')).toBe(false);
		expect(isFollowUpDue({ ...item, status: 'dropped' }, '2026-11-30')).toBe(false);
	});

	it('writes a short, polite follow-up that fills in what, who and since', () => {
		const msg = followUpMessage(item);
		expect(msg).toBe(
			'Hi Dr. Moonbeam, just following up on the signed crater lease from Thursday, October 22. Is there anything you need from me to move it forward? Thanks!'
		);
		expect(msg.length).toBeLessThan(200);
		expect(msg).not.toMatch(/still|again|already|urgent|asap/i);
	});
});
