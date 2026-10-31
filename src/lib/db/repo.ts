import { db, type GetItDoneDB } from './db.ts';
import { newId, nowStamp } from '../ids.ts';
import { openBlockers, openWaiting } from '../rules/carryOver.ts';
import {
	activeGoal,
	addStep as planStep,
	makeActive,
	moveStep as planMove
} from '../rules/goal.ts';
import { shouldAskAboutYesterday, unfinishedOneThing } from '../rules/morning.ts';
import { newDailyPage } from '../rules/pages.ts';
import {
	activateProject as planActivation,
	addParked,
	finishProject as planFinish,
	newProject,
	parkProject as planPark,
	type ParkChoice,
	type ProjectResult
} from '../rules/projects.ts';
import { changeStepStatus, eveningWinChange, manualWin, winsInWeek } from '../rules/proofLog.ts';
import { startWeeklyReview, syncParkedDecisions } from '../rules/weekly.ts';
import type {
	Blocker,
	DailyPage,
	Goal,
	ISODate,
	OneThing,
	Project,
	Step,
	StepStatus,
	WaitingItem,
	WaitingStatus,
	WeeklyReview,
	Win
} from '../types.ts';

/* ---------- Daily pages ---------- */

export async function getPage(date: ISODate, d: GetItDoneDB = db): Promise<DailyPage | undefined> {
	return d.pages.get(date);
}

export async function getPreviousPage(
	date: ISODate,
	d: GetItDoneDB = db
): Promise<DailyPage | undefined> {
	return d.pages.where('date').below(date).last();
}

export interface DayDraft {
	page: DailyPage;
	/** True when today's page is already stored. */
	exists: boolean;
	previous: DailyPage | undefined;
	/** Yesterday's unfinished one thing, when the morning flow should ask about it. */
	askAbout: OneThing | null;
}

/** Today's stored page, or a fresh one with last evening's pick pre-filled. Nothing is written. */
export async function loadDay(date: ISODate, d: GetItDoneDB = db): Promise<DayDraft> {
	const [stored, previous] = await Promise.all([getPage(date, d), getPreviousPage(date, d)]);
	const page = stored ?? newDailyPage(date, previous);
	const askAbout = shouldAskAboutYesterday(previous, stored) ? unfinishedOneThing(previous) : null;
	return { page: structuredClone(page), exists: Boolean(stored), previous, askAbout };
}

/** Saves the page and keeps its evening win in the Proof Log in step, atomically. */
export async function savePage(page: DailyPage, d: GetItDoneDB = db): Promise<void> {
	const change = eveningWinChange(page);
	await d.transaction('rw', d.pages, d.wins, async () => {
		await d.pages.put(page);
		if ('put' in change) await d.wins.put(change.put);
		else await d.wins.delete(change.remove);
	});
}

/** Each finished focus block adds one to the day's count. */
export async function addFocusBlock(date: ISODate, d: GetItDoneDB = db): Promise<number> {
	return d.transaction('rw', d.pages, async () => {
		const stored = await d.pages.get(date);
		const page = stored ?? newDailyPage(date, await getPreviousPage(date, d));
		page.energy = { ...page.energy, focusBlocks: (page.energy.focusBlocks ?? 0) + 1 };
		await d.pages.put(page);
		return page.energy.focusBlocks;
	});
}

/* ---------- Projects ---------- */

async function applyProjectResult(result: ProjectResult, d: GetItDoneDB): Promise<ProjectResult> {
	if (result.ok) await d.projects.bulkPut(result.changes);
	return result;
}

export async function listProjects(d: GetItDoneDB = db): Promise<Project[]> {
	return (await d.projects.toArray()).sort(
		(a, b) => a.updatedAt.localeCompare(b.updatedAt) || a.name.localeCompare(b.name)
	);
}

export type NewProjectChoice =
	{ mode: 'active'; park?: ParkChoice } | { mode: 'parked'; reason: string };

export async function createProject(
	name: string,
	nextStep: string,
	choice: NewProjectChoice,
	d: GetItDoneDB = db
): Promise<ProjectResult> {
	return d.transaction('rw', d.projects, async () => {
		const now = nowStamp();
		const draft = newProject(newId(), name, nextStep, now);
		const result =
			choice.mode === 'active'
				? planActivation(await d.projects.toArray(), draft, now, choice.park)
				: addParked(draft, choice.reason, now);
		return applyProjectResult(result, d);
	});
}

export async function activateProject(
	id: string,
	park?: ParkChoice,
	d: GetItDoneDB = db
): Promise<ProjectResult> {
	return d.transaction('rw', d.projects, async () => {
		const all = await d.projects.toArray();
		const target = all.find((p) => p.id === id);
		if (!target) return { ok: false, error: 'invalid-park-target' } as const;
		return applyProjectResult(planActivation(all, target, nowStamp(), park), d);
	});
}

export async function parkProject(
	id: string,
	reason: string,
	d: GetItDoneDB = db
): Promise<ProjectResult> {
	return d.transaction('rw', d.projects, async () => {
		const target = await d.projects.get(id);
		if (!target) return { ok: false, error: 'invalid-park-target' } as const;
		return applyProjectResult(planPark(target, reason, nowStamp()), d);
	});
}

export async function finishProject(id: string, d: GetItDoneDB = db): Promise<void> {
	await d.transaction('rw', d.projects, async () => {
		const target = await d.projects.get(id);
		if (target) await d.projects.put(planFinish(target, nowStamp()));
	});
}

export async function updateProject(
	id: string,
	patch: Partial<Pick<Project, 'name' | 'nextStep' | 'parkedReason'>>,
	d: GetItDoneDB = db
): Promise<void> {
	await d.projects.update(id, { ...patch, updatedAt: nowStamp() });
}

/* ---------- Goal and steps ---------- */

export async function getActiveGoal(d: GetItDoneDB = db): Promise<Goal | undefined> {
	return activeGoal(await d.goals.toArray());
}

/** Creates a goal and makes it the only active one. Earlier goals are kept, inactive. */
export async function createGoal(
	input: Pick<Goal, 'title' | 'deadline' | 'why'>,
	d: GetItDoneDB = db
): Promise<Goal> {
	return d.transaction('rw', d.goals, async () => {
		const goal: Goal = {
			id: newId(),
			title: input.title.trim(),
			deadline: input.deadline,
			why: input.why.trim(),
			active: true
		};
		const others = makeActive(await d.goals.toArray(), goal.id);
		await d.goals.bulkPut([...others, goal]);
		return goal;
	});
}

export async function updateGoal(
	id: string,
	patch: Partial<Pick<Goal, 'title' | 'deadline' | 'why'>>,
	d: GetItDoneDB = db
): Promise<void> {
	await d.goals.update(id, patch);
}

export async function addStep(goalId: string, title: string, d: GetItDoneDB = db) {
	return d.transaction('rw', d.steps, async () => {
		const result = planStep(await d.steps.toArray(), goalId, title, newId());
		if (result.ok) await d.steps.add(result.step);
		return result;
	});
}

export async function updateStep(
	id: string,
	patch: Partial<Pick<Step, 'title' | 'targetDate'>>,
	d: GetItDoneDB = db
): Promise<void> {
	await d.steps.update(id, patch);
}

/** Completing a step also adds a Proof Log entry, in the same transaction. */
export async function setStepStatus(
	id: string,
	status: StepStatus,
	today: ISODate,
	d: GetItDoneDB = db
): Promise<void> {
	await d.transaction('rw', d.steps, d.wins, async () => {
		const step = await d.steps.get(id);
		if (!step) return;
		const result = changeStepStatus(step, status, today);
		await d.steps.put(result.step);
		if (result.win) await d.wins.put(result.win);
	});
}

export async function moveStep(
	goalId: string,
	stepId: string,
	dir: -1 | 1,
	d: GetItDoneDB = db
): Promise<void> {
	await d.transaction('rw', d.steps, async () => {
		const changes = planMove(await d.steps.toArray(), goalId, stepId, dir);
		if (changes.length) await d.steps.bulkPut(changes);
	});
}

export async function deleteStep(id: string, d: GetItDoneDB = db): Promise<void> {
	await d.steps.delete(id);
}

/* ---------- Blockers and waiting ---------- */

export async function listOpenBlockers(today: ISODate, d: GetItDoneDB = db): Promise<Blocker[]> {
	return openBlockers(await d.blockers.toArray(), today);
}

export async function listOpenWaiting(d: GetItDoneDB = db): Promise<WaitingItem[]> {
	return openWaiting(await d.waiting.toArray());
}

export async function addBlocker(
	input: Omit<Blocker, 'id' | 'resolvedOn'>,
	d: GetItDoneDB = db
): Promise<Blocker> {
	const blocker: Blocker = { ...input, id: newId(), what: input.what.trim() };
	await d.blockers.add(blocker);
	return blocker;
}

export async function updateBlocker(
	id: string,
	patch: Partial<Omit<Blocker, 'id'>>,
	d: GetItDoneDB = db
): Promise<void> {
	await d.blockers.update(id, patch);
}

export async function resolveBlocker(id: string, today: ISODate, d: GetItDoneDB = db) {
	await d.blockers.update(id, { resolvedOn: today });
}

export async function addWaiting(
	input: Omit<WaitingItem, 'id' | 'status'>,
	d: GetItDoneDB = db
): Promise<WaitingItem> {
	const item: WaitingItem = { ...input, id: newId(), status: 'waiting', what: input.what.trim() };
	await d.waiting.add(item);
	return item;
}

export async function updateWaiting(
	id: string,
	patch: Partial<Omit<WaitingItem, 'id'>>,
	d: GetItDoneDB = db
): Promise<void> {
	await d.waiting.update(id, patch);
}

export async function setWaitingStatus(id: string, status: WaitingStatus, d: GetItDoneDB = db) {
	await d.waiting.update(id, { status });
}

/* ---------- Proof Log ---------- */

export async function listWins(d: GetItDoneDB = db): Promise<Win[]> {
	return d.wins.toArray();
}

export async function addManualWin(date: ISODate, text: string, d: GetItDoneDB = db) {
	const result = manualWin(newId(), date, text);
	if (result.ok) await d.wins.add(result.win);
	return result;
}

export async function deleteWin(id: string, d: GetItDoneDB = db): Promise<void> {
	await d.wins.delete(id);
}

/* ---------- Weekly review ---------- */

/** The stored review, or a new one that lists parked projects and suggests the week's wins. */
export async function loadReview(
	week: ISODate,
	d: GetItDoneDB = db
): Promise<{ review: WeeklyReview; exists: boolean }> {
	const [stored, projects, wins] = await Promise.all([
		d.reviews.get(week),
		d.projects.toArray(),
		d.wins.toArray()
	]);
	if (stored) {
		return {
			review: { ...stored, parkedDecisions: syncParkedDecisions(stored.parkedDecisions, projects) },
			exists: true
		};
	}
	return { review: startWeeklyReview(week, projects, winsInWeek(wins, week)), exists: false };
}

export async function saveReview(review: WeeklyReview, d: GetItDoneDB = db): Promise<void> {
	await d.reviews.put(review);
}

export interface ApplyDecisionsResult {
	restarted: string[];
	dropped: string[];
	/** Projects that couldn't restart because three are already active. */
	noRoom: string[];
}

/** Applies "restart" and "drop" choices. Restarting never goes past three active projects. */
export async function applyParkedDecisions(
	review: WeeklyReview,
	d: GetItDoneDB = db
): Promise<ApplyDecisionsResult> {
	return d.transaction('rw', d.projects, async () => {
		const out: ApplyDecisionsResult = { restarted: [], dropped: [], noRoom: [] };
		for (const decision of review.parkedDecisions) {
			const all = await d.projects.toArray();
			const project = all.find((p) => p.id === decision.projectId);
			if (!project || project.status !== 'parked') continue;
			if (decision.decision === 'drop') {
				await d.projects.put(planFinish(project, nowStamp()));
				out.dropped.push(project.name);
			} else if (decision.decision === 'restart') {
				const result = planActivation(all, project, nowStamp());
				if (result.ok) {
					await d.projects.bulkPut(result.changes);
					out.restarted.push(project.name);
				} else {
					out.noRoom.push(project.name);
				}
			}
		}
		return out;
	});
}
