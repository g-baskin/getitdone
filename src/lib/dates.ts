import type { ISODate } from './types.ts';

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

/** The local calendar date of `d`. A new day starts at local midnight. */
export function toISODate(d: Date): ISODate {
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(now: Date = new Date()): ISODate {
	return toISODate(now);
}

export function isValidISODate(s: unknown): s is ISODate {
	if (typeof s !== 'string') return false;
	const m = ISO_RE.exec(s);
	if (!m) return false;
	const d = parseISODate(s);
	return toISODate(d) === s;
}

/** Local midnight of the given date. */
export function parseISODate(s: ISODate): Date {
	const m = ISO_RE.exec(s);
	if (!m) throw new Error(`Not a YYYY-MM-DD date: ${s}`);
	return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function utcDay(s: ISODate): number {
	const m = ISO_RE.exec(s);
	if (!m) throw new Error(`Not a YYYY-MM-DD date: ${s}`);
	// Calendar arithmetic in UTC so daylight-saving shifts never add or lose a day.
	return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / DAY_MS;
}

export function addDays(s: ISODate, n: number): ISODate {
	const d = new Date((utcDay(s) + n) * DAY_MS);
	return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: ISODate, to: ISODate): number {
	return utcDay(to) - utcDay(from);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekday(s: ISODate): number {
	return new Date(utcDay(s) * DAY_MS).getUTCDay();
}

export function isSunday(s: ISODate): boolean {
	return weekday(s) === 0;
}

/** Monday of the Monday-to-Sunday week that contains `s`. */
export function mondayOf(s: ISODate): ISODate {
	const offset = (weekday(s) + 6) % 7;
	return addDays(s, -offset);
}

function fmt(s: ISODate, opts: Intl.DateTimeFormatOptions): string {
	return new Date(utcDay(s) * DAY_MS).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}

/** "Saturday, October 31" */
export function formatLong(s: ISODate): string {
	return fmt(s, { weekday: 'long', month: 'long', day: 'numeric' });
}

/** "Sat, Oct 31" */
export function formatShort(s: ISODate): string {
	return fmt(s, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "Oct 31" */
export function formatMonthDay(s: ISODate): string {
	return fmt(s, { month: 'short', day: 'numeric' });
}

/** "Saturday" */
export function formatWeekday(s: ISODate): string {
	return fmt(s, { weekday: 'long' });
}

/** "Yesterday", "Friday", or "Friday, Oct 23" for older dates. */
export function relativeDayName(s: ISODate, today: ISODate): string {
	const diff = daysBetween(s, today);
	if (diff === 0) return 'Today';
	if (diff === 1) return 'Yesterday';
	if (diff > 1 && diff < 7) return formatWeekday(s);
	return formatShort(s);
}
