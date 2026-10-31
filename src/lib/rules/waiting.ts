import { daysBetween, formatLong } from '../dates.ts';
import type { ISODate, WaitingItem } from '../types.ts';

export function waitingDays(item: Pick<WaitingItem, 'since'>, today: ISODate): number {
	return Math.max(0, daysBetween(item.since, today));
}

export function waitingLabel(item: Pick<WaitingItem, 'since'>, today: ISODate): string {
	const n = waitingDays(item, today);
	if (n === 0) return 'waiting since today';
	return `waiting ${n} ${n === 1 ? 'day' : 'days'}`;
}

/** Highlighted, with a follow-up message, once today is past the follow-up date. */
export function isFollowUpDue(
	item: Pick<WaitingItem, 'followUpOn' | 'status'>,
	today: ISODate
): boolean {
	return item.status === 'waiting' && Boolean(item.followUpOn) && today > item.followUpOn;
}

export function isFollowUpToday(
	item: Pick<WaitingItem, 'followUpOn' | 'status'>,
	today: ISODate
): boolean {
	return item.status === 'waiting' && item.followUpOn === today;
}

/** A short, polite nudge that fills in what, who and since. */
export function followUpMessage(item: Pick<WaitingItem, 'what' | 'fromWhom' | 'since'>): string {
	const who = item.fromWhom.trim() || 'there';
	const what = item.what.trim() || 'this';
	return `Hi ${who}, just following up on ${what} from ${formatLong(item.since)}. Is there anything you need from me to move it forward? Thanks!`;
}
