import { todayISO } from '../dates.ts';

/** Today's local date; rolls over at local midnight while the app stays open. */
class Clock {
	today = $state(todayISO());

	constructor() {
		if (typeof window === 'undefined') return;
		setInterval(() => this.refresh(), 30_000);
		document.addEventListener('visibilitychange', () => this.refresh());
	}

	refresh() {
		const now = todayISO();
		if (now !== this.today) this.today = now;
	}
}

export const clock = new Clock();
