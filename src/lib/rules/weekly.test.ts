import { describe, expect, it } from 'vitest';
import type { Project, Win } from '../types.ts';
import {
	clampPercent,
	clampScore,
	shouldSuggestReview,
	startWeeklyReview,
	syncParkedDecisions,
	weekOf
} from './weekly.ts';

const project = (id: string, status: Project['status']): Project => ({
	id,
	name: id,
	status,
	nextStep: '',
	updatedAt: ''
});

describe('weekly review', () => {
	it('is suggested on Sundays and keyed by Monday', () => {
		expect(shouldSuggestReview('2026-11-01', undefined)).toBe(true);
		expect(shouldSuggestReview('2026-10-31', undefined)).toBe(false);
		expect(weekOf('2026-11-01')).toBe('2026-10-26');
	});

	it('starts with every parked project set to keep and the week wins suggested', () => {
		const wins: Win[] = [
			{ id: '1', date: '2026-10-30', text: 'One', source: 'manual' },
			{ id: '2', date: '2026-10-29', text: 'Two', source: 'evening' }
		];
		const review = startWeeklyReview(
			'2026-10-26',
			[project('a', 'parked'), project('b', 'active')],
			wins
		);
		expect(review.parkedDecisions).toEqual([{ projectId: 'a', name: 'a', decision: 'keep' }]);
		expect(review.topWins).toEqual(['One', 'Two', '']);
		expect(review.ratings.clarity.score).toBeNull();
	});

	it('keeps earlier decisions when more projects are parked', () => {
		const out = syncParkedDecisions(
			[{ projectId: 'a', name: 'a', decision: 'drop' }],
			[project('a', 'parked'), project('c', 'parked')]
		);
		expect(out.map((d) => [d.projectId, d.decision])).toEqual([
			['a', 'drop'],
			['c', 'keep']
		]);
	});

	it('keeps ratings within 1-10 and time within 0-100%', () => {
		expect(clampScore('')).toBeNull();
		expect(clampScore(0)).toBe(1);
		expect(clampScore(11)).toBe(10);
		expect(clampScore('7')).toBe(7);
		expect(clampPercent(140)).toBe(100);
		expect(clampPercent(-5)).toBe(0);
		expect(clampPercent('abc')).toBeNull();
	});
});
