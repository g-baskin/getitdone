import { toISODate } from '../dates.ts';
import { addFocusBlock } from '../db/repo.ts';
import {
	idle,
	pause,
	remainingMs,
	resume,
	startFocus,
	tick,
	type TimerState
} from '../rules/timer.ts';
import { STORAGE_KEYS } from './storageKeys.ts';

function restore(): TimerState {
	try {
		const raw = localStorage.getItem(STORAGE_KEYS.timer);
		if (!raw) return idle();
		const s = JSON.parse(raw) as TimerState;
		if (s.phase === 'focus' && typeof s.remaining === 'number') return s;
		if (s.phase === 'reset' && typeof s.endsAt === 'number') return s;
	} catch {
		// Ignore a damaged saved timer and start fresh.
	}
	return idle();
}

/** One focus timer for the whole app, so it keeps running while you move between screens. */
class FocusTimer {
	state = $state<TimerState>(idle());
	now = $state(Date.now());
	/** Increments whenever a block finishes, so screens can react. */
	finishedCount = $state(0);
	#interval: ReturnType<typeof setInterval> | undefined;

	constructor() {
		if (typeof window === 'undefined') return;
		this.state = restore();
		this.#sync();
	}

	get remaining(): number {
		return remainingMs(this.state, this.now);
	}

	get running(): boolean {
		return this.state.phase === 'focus' && this.state.endsAt !== null;
	}

	start(intention: string) {
		this.now = Date.now();
		this.state = startFocus(intention.trim(), this.now);
		this.#sync();
	}

	pause() {
		this.state = pause(this.state, Date.now());
		this.#sync();
	}

	resume() {
		this.now = Date.now();
		this.state = resume(this.state, this.now);
		this.#sync();
	}

	stop(nextIntention = '') {
		this.state = idle(nextIntention);
		this.#sync();
	}

	#tick = () => {
		this.now = Date.now();
		const before = this.state;
		const result = tick(before, this.now);
		if (result.finishedBlock && before.phase === 'focus' && before.endsAt !== null) {
			this.state = result.state;
			// Count the block on the day it ended.
			void addFocusBlock(toISODate(new Date(before.endsAt))).then(() => this.finishedCount++);
			this.#sync();
		}
		if (this.state.phase === 'reset' && this.remaining === 0) this.#stopTicking();
	};

	#sync() {
		localStorage.setItem(STORAGE_KEYS.timer, JSON.stringify(this.state));
		const needsTick =
			this.running || (this.state.phase === 'reset' && remainingMs(this.state, Date.now()) > 0);
		if (needsTick && !this.#interval) {
			this.#interval = setInterval(this.#tick, 1000);
			this.#tick();
		} else if (!needsTick) {
			this.#stopTicking();
		}
	}

	#stopTicking() {
		clearInterval(this.#interval);
		this.#interval = undefined;
	}
}

export const focusTimer = new FocusTimer();
