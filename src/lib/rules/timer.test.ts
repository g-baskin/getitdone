import { describe, expect, it } from 'vitest';
import {
	FOCUS_MS,
	formatClock,
	pause,
	remainingMs,
	RESET_MS,
	resume,
	startFocus,
	tick
} from './timer.ts';

describe('focus timer', () => {
	it('runs a 50-minute block then a 2-minute reset', () => {
		expect(FOCUS_MS).toBe(50 * 60_000);
		expect(RESET_MS).toBe(2 * 60_000);
		const s = startFocus('Write the menu', 0);
		expect(remainingMs(s, 0)).toBe(FOCUS_MS);
		expect(tick(s, FOCUS_MS - 1).finishedBlock).toBe(false);
		const done = tick(s, FOCUS_MS);
		expect(done.finishedBlock).toBe(true);
		expect(done.state.phase).toBe('reset');
		expect(remainingMs(done.state, FOCUS_MS)).toBe(RESET_MS);
	});

	it('pauses and resumes without losing time', () => {
		const s = startFocus('', 0);
		const paused = pause(s, 10_000);
		expect(remainingMs(paused, 999_999)).toBe(FOCUS_MS - 10_000);
		expect(tick(paused, FOCUS_MS * 2).finishedBlock).toBe(false);
		const resumed = resume(paused, 100_000);
		expect(remainingMs(resumed, 100_000)).toBe(FOCUS_MS - 10_000);
	});

	it('formats the clock', () => {
		expect(formatClock(FOCUS_MS)).toBe('50:00');
		expect(formatClock(61_000)).toBe('01:01');
		expect(formatClock(0)).toBe('00:00');
	});
});
