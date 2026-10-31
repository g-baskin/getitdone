import { describe, expect, it } from 'vitest';
import type { Step, Win } from '../types.ts';
import { emptyDailyPage } from './pages.ts';
import {
	changeStepStatus,
	eveningWinChange,
	eveningWinId,
	manualWin,
	sortWinsNewestFirst,
	winsInWeek
} from './proofLog.ts';

describe('rule 8: Proof Log', () => {
	it('records an evening win as an entry for that day', () => {
		const page = emptyDailyPage('2026-10-31');
		page.evening.win = ' Poured the first cup ';
		expect(eveningWinChange(page)).toEqual({
			put: {
				id: eveningWinId('2026-10-31'),
				date: '2026-10-31',
				text: 'Poured the first cup',
				source: 'evening'
			}
		});
	});

	it('removes the evening entry when the win is cleared, and never duplicates it', () => {
		const page = emptyDailyPage('2026-10-31');
		expect(eveningWinChange(page)).toEqual({ remove: 'evening-2026-10-31' });
		page.evening.win = 'a';
		const first = eveningWinChange(page);
		page.evening.win = 'b';
		const second = eveningWinChange(page);
		expect('put' in first && 'put' in second && first.put.id === second.put.id).toBe(true);
	});

	it('adds an entry when a step is completed', () => {
		const step: Step = {
			id: 's1',
			goalId: 'g',
			title: 'Train the robot',
			status: 'doing',
			order: 0
		};
		const result = changeStepStatus(step, 'done', '2026-10-31');
		expect(result.step.status).toBe('done');
		expect(result.win).toEqual({
			id: 'step-s1',
			date: '2026-10-31',
			text: 'Finished a big step: Train the robot',
			source: 'step-completed'
		});
		expect(changeStepStatus(result.step, 'done', '2026-11-01').win).toBeUndefined();
		expect(changeStepStatus(step, 'todo', '2026-10-31').win).toBeUndefined();
	});

	it('also takes wins added by hand', () => {
		expect(manualWin('m1', '2026-10-31', '').ok).toBe(false);
		expect(manualWin('m1', '2026-10-31', ' Fixed the hinge ')).toEqual({
			ok: true,
			win: { id: 'm1', date: '2026-10-31', text: 'Fixed the hinge', source: 'manual' }
		});
	});

	it('lists newest first and picks out a week', () => {
		const wins: Win[] = [
			{ id: 'a', date: '2026-10-20', text: 'a', source: 'manual' },
			{ id: 'b', date: '2026-10-31', text: 'b', source: 'manual' },
			{ id: 'c', date: '2026-10-27', text: 'c', source: 'evening' }
		];
		expect(sortWinsNewestFirst(wins).map((w) => w.id)).toEqual(['b', 'c', 'a']);
		expect(winsInWeek(wins, '2026-10-26').map((w) => w.id)).toEqual(['b', 'c']);
	});
});
