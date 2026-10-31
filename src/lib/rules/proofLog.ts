import type { DailyPage, ISODate, Step, StepStatus, Win } from '../types.ts';
import { addDays } from '../dates.ts';

/** Stable ids make automatic entries idempotent: saving the evening twice never duplicates a win. */
export function eveningWinId(date: ISODate): string {
	return `evening-${date}`;
}

export function stepWinId(stepId: string): string {
	return `step-${stepId}`;
}

export type WinChange = { put: Win } | { remove: string };

/** Recording an evening win adds (or updates) that day's Proof Log entry. */
export function eveningWinChange(page: DailyPage): WinChange {
	const text = page.evening.win?.trim();
	const id = eveningWinId(page.date);
	if (!text) return { remove: id };
	return { put: { id, date: page.date, text, source: 'evening' } };
}

export function stepCompletedText(title: string): string {
	return `Finished a big step: ${title.trim()}`;
}

/** Completing a step adds a Proof Log entry; reopening it keeps the entry, since the work happened. */
export function changeStepStatus(
	step: Step,
	status: StepStatus,
	today: ISODate
): { step: Step; win?: Win } {
	const next = { ...step, status };
	if (status === 'done' && step.status !== 'done') {
		return {
			step: next,
			win: {
				id: stepWinId(step.id),
				date: today,
				text: stepCompletedText(step.title),
				source: 'step-completed'
			}
		};
	}
	return { step: next };
}

export const WIN_TEXT_REQUIRED = 'Write the win down, even a small one.';

export function manualWin(
	id: string,
	date: ISODate,
	text: string
): { ok: true; win: Win } | { ok: false; error: string } {
	const trimmed = text.trim();
	if (!trimmed) return { ok: false, error: WIN_TEXT_REQUIRED };
	return { ok: true, win: { id, date, text: trimmed, source: 'manual' } };
}

export function sortWinsNewestFirst(wins: Win[]): Win[] {
	return [...wins].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

export function winsInWeek(wins: Win[], weekOf: ISODate): Win[] {
	const end = addDays(weekOf, 6);
	return sortWinsNewestFirst(wins.filter((w) => w.date >= weekOf && w.date <= end));
}

export function winSourceLabel(source: Win['source']): string {
	switch (source) {
		case 'evening':
			return 'Evening';
		case 'step-completed':
			return 'Big step';
		case 'manual':
			return 'Added';
	}
}
