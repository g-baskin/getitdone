import type { DailyPage, ISODate } from '../types.ts';

export function emptyDailyPage(date: ISODate): DailyPage {
	return {
		date,
		oneThing: { text: '', done: false },
		whyItMatters: '',
		whoIsCountingOnMe: '',
		todaysWord: '',
		important: ['', '', ''],
		energy: { moved: false, focusBlocks: 0 },
		evening: {},
		minimumDay: false
	};
}

/** The most recent page before `date`: "yesterday" is the last day the app was used. */
export function previousPage(pages: DailyPage[], date: ISODate): DailyPage | undefined {
	let best: DailyPage | undefined;
	for (const p of pages) {
		if (p.date < date && (!best || p.date > best.date)) best = p;
	}
	return best;
}

/** A fresh page; last evening's "tomorrow's one thing" pre-fills the one thing. */
export function newDailyPage(date: ISODate, prev?: DailyPage): DailyPage {
	const page = emptyDailyPage(date);
	const tomorrow = prev && prev.date < date ? prev.evening.tomorrowOneThing?.trim() : undefined;
	if (tomorrow) page.oneThing.text = tomorrow;
	return page;
}

/** Keeps "did the one thing happen?" and the done checkbox telling the same story. */
export function setOneThingDone(page: DailyPage, done: boolean): DailyPage {
	return {
		...page,
		oneThing: { ...page.oneThing, done },
		evening: { ...page.evening, didOneThing: done }
	};
}

export function isPlanned(page: DailyPage | undefined): boolean {
	return Boolean(page?.oneThing.text.trim());
}
