import { describe, expect, it } from 'vitest';
import {
	addDays,
	daysBetween,
	formatLong,
	isSunday,
	isValidISODate,
	mondayOf,
	relativeDayName,
	toISODate
} from './dates.ts';

describe('local dates', () => {
	it('uses the local calendar date, so a new day starts at local midnight', () => {
		expect(toISODate(new Date(2026, 9, 31, 23, 59))).toBe('2026-10-31');
		expect(toISODate(new Date(2026, 10, 1, 0, 0))).toBe('2026-11-01');
	});

	it('adds days and counts the gap across month, year and DST boundaries', () => {
		expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
		expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
		expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
		expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
		expect(daysBetween('2026-11-02', '2026-10-31')).toBe(-2);
	});

	it('finds Monday and Sunday for the weekly review', () => {
		expect(mondayOf('2026-10-31')).toBe('2026-10-26'); // Saturday
		expect(mondayOf('2026-11-01')).toBe('2026-10-26'); // Sunday closes the week
		expect(mondayOf('2026-10-26')).toBe('2026-10-26');
		expect(isSunday('2026-11-01')).toBe(true);
		expect(isSunday('2026-10-31')).toBe(false);
	});

	it('validates and formats dates', () => {
		expect(isValidISODate('2026-02-30')).toBe(false);
		expect(isValidISODate('2026-02-28')).toBe(true);
		expect(isValidISODate('31/10/2026')).toBe(false);
		expect(formatLong('2026-10-31')).toBe('Saturday, October 31');
		expect(relativeDayName('2026-10-30', '2026-10-31')).toBe('Yesterday');
		expect(relativeDayName('2026-10-27', '2026-10-31')).toBe('Tuesday');
	});
});
