import type { Blocker, ISODate, WaitingItem } from '../types.ts';

/** A blocker shows on every day from the day it was added until the day it's resolved. */
export function isBlockerOpenOn(b: Blocker, date: ISODate): boolean {
	return b.createdOn <= date && (!b.resolvedOn || b.resolvedOn > date);
}

export function openBlockers(blockers: Blocker[], date: ISODate): Blocker[] {
	return blockers
		.filter((b) => isBlockerOpenOn(b, date))
		.sort((a, b) => a.createdOn.localeCompare(b.createdOn) || a.id.localeCompare(b.id));
}

/** Waiting items stay until they're received or dropped. */
export function isWaitingOpen(w: WaitingItem): boolean {
	return w.status === 'waiting';
}

export function openWaiting(items: WaitingItem[]): WaitingItem[] {
	return items
		.filter(isWaitingOpen)
		.sort((a, b) => a.since.localeCompare(b.since) || a.id.localeCompare(b.id));
}

export type AgeOrder = 'oldest' | 'newest';

export function sortByAge<T>(items: T[], dateOf: (item: T) => ISODate, order: AgeOrder): T[] {
	const sorted = [...items].sort((a, b) => dateOf(a).localeCompare(dateOf(b)));
	return order === 'oldest' ? sorted : sorted.reverse();
}
