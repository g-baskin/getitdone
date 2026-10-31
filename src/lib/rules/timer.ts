export const FOCUS_MS = 50 * 60 * 1000;
export const RESET_MS = 2 * 60 * 1000;

export type TimerState =
	| { phase: 'idle'; nextIntention: string }
	| {
			phase: 'focus';
			intention: string;
			/** Epoch ms when the block ends; null while paused. */
			endsAt: number | null;
			/** Remaining ms, kept while paused. */
			remaining: number;
	  }
	| { phase: 'reset'; endsAt: number; nextIntention: string };

export function idle(nextIntention = ''): TimerState {
	return { phase: 'idle', nextIntention };
}

export function startFocus(intention: string, now: number, durationMs = FOCUS_MS): TimerState {
	return { phase: 'focus', intention, endsAt: now + durationMs, remaining: durationMs };
}

export function pause(state: TimerState, now: number): TimerState {
	if (state.phase !== 'focus' || state.endsAt === null) return state;
	return { ...state, endsAt: null, remaining: Math.max(0, state.endsAt - now) };
}

export function resume(state: TimerState, now: number): TimerState {
	if (state.phase !== 'focus' || state.endsAt !== null) return state;
	return { ...state, endsAt: now + state.remaining };
}

export function remainingMs(state: TimerState, now: number): number {
	if (state.phase === 'idle') return 0;
	if (state.phase === 'focus' && state.endsAt === null) return state.remaining;
	return Math.max(0, (state.endsAt ?? now) - now);
}

/** Advances the timer. A finished focus block moves to the 2-minute reset and reports it. */
export function tick(
	state: TimerState,
	now: number,
	resetMs = RESET_MS
): { state: TimerState; finishedBlock: boolean } {
	if (state.phase === 'focus' && state.endsAt !== null && now >= state.endsAt) {
		return {
			state: { phase: 'reset', endsAt: now + resetMs, nextIntention: '' },
			finishedBlock: true
		};
	}
	return { state, finishedBlock: false };
}

export function formatClock(ms: number): string {
	const total = Math.ceil(ms / 1000);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
