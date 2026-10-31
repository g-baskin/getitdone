import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db.ts';
import { importData, isDatabaseEmpty, resetAllData, RESET_CONFIRM_WORD } from './backup.ts';
import { buildDemoData } from './demo.ts';
import {
	activateProject,
	addFocusBlock,
	addStep,
	applyParkedDecisions,
	createGoal,
	createProject,
	listOpenBlockers,
	listOpenWaiting,
	loadDay,
	loadReview,
	resolveBlocker,
	saveEvening,
	saveMorning,
	savePage,
	setStepStatus,
	setWaitingStatus
} from './repo.ts';
import { emptyDailyPage } from '../rules/pages.ts';

const TODAY = '2026-10-31';

beforeEach(async () => {
	await resetAllData(RESET_CONFIRM_WORD);
});

describe('daily pages', () => {
	it('loading a day writes nothing until something is saved', async () => {
		const day = await loadDay(TODAY);
		expect(day.exists).toBe(false);
		expect(await isDatabaseEmpty()).toBe(true);
	});

	it("pre-fills from last evening and asks about yesterday's unfinished one thing", async () => {
		const prev = emptyDailyPage('2026-10-29');
		prev.oneThing = { text: 'Fix the hinge', done: false };
		prev.evening.tomorrowOneThing = 'Pour a test cup';
		await savePage(prev);
		const day = await loadDay(TODAY);
		expect(day.page.oneThing.text).toBe('Pour a test cup');
		expect(day.askAbout?.text).toBe('Fix the hinge');

		await savePage({ ...day.page, yesterdayChoice: 'drop' });
		expect((await loadDay(TODAY)).askAbout).toBeNull();
	});

	it('saving an evening win adds it to the Proof Log, once', async () => {
		const page = emptyDailyPage(TODAY);
		page.evening.win = 'Fixed the hinge';
		await savePage(page);
		await savePage(page);
		expect(await db.wins.toArray()).toEqual([
			{ id: `evening-${TODAY}`, date: TODAY, text: 'Fixed the hinge', source: 'evening' }
		]);
		page.evening.win = '';
		await savePage(page);
		expect(await db.wins.count()).toBe(0);
	});

	it('a finished focus block adds to today', async () => {
		expect(await addFocusBlock(TODAY)).toBe(1);
		expect(await addFocusBlock(TODAY)).toBe(2);
		expect((await db.pages.get(TODAY))?.energy.focusBlocks).toBe(2);
	});
});

describe('projects', () => {
	it('enforces three active and parks one with a reason to make room', async () => {
		for (const name of ['A', 'B', 'C']) {
			expect((await createProject(name, '', { mode: 'active' })).ok).toBe(true);
		}
		expect(await createProject('D', '', { mode: 'active' })).toEqual({
			ok: false,
			error: 'needs-park'
		});
		const a = (await db.projects.toArray()).find((p) => p.name === 'A')!;
		const result = await createProject('D', '', {
			mode: 'active',
			park: { projectId: a.id, reason: 'After the launch' }
		});
		expect(result.ok).toBe(true);
		const all = await db.projects.toArray();
		expect(
			all
				.filter((p) => p.status === 'active')
				.map((p) => p.name)
				.sort()
		).toEqual(['B', 'C', 'D']);
		expect(all.find((p) => p.name === 'A')).toMatchObject({
			status: 'parked',
			parkedReason: 'After the launch'
		});

		expect(await activateProject(a.id)).toEqual({ ok: false, error: 'needs-park' });
	});
});

describe('goal steps', () => {
	it('completing a step adds a Proof Log entry', async () => {
		const goal = await createGoal({ title: 'Open the shop', deadline: '', why: '' });
		const added = await addStep(goal.id, 'Train the robot');
		expect(added.ok).toBe(true);
		if (!added.ok) return;
		await setStepStatus(added.step.id, 'done', TODAY);
		expect(await db.wins.get(`step-${added.step.id}`)).toMatchObject({
			source: 'step-completed',
			text: 'Finished a big step: Train the robot'
		});
	});

	it('keeps one active goal when a new one starts', async () => {
		await createGoal({ title: 'One', deadline: '', why: '' });
		await createGoal({ title: 'Two', deadline: '', why: '' });
		expect((await db.goals.toArray()).filter((g) => g.active).map((g) => g.title)).toEqual(['Two']);
	});
});

describe('carry-over through the database', () => {
	it('open items appear on later days until resolved, received or dropped', async () => {
		await importData(buildDemoData('2026-10-28'));
		expect((await listOpenBlockers(TODAY)).length).toBe(3);
		expect((await listOpenWaiting()).length).toBe(3);
		await resolveBlocker('demo-blocker-1', TODAY);
		await setWaitingStatus('demo-waiting-1', 'received');
		await setWaitingStatus('demo-waiting-2', 'dropped');
		expect((await listOpenBlockers('2026-11-01')).map((b) => b.id)).toEqual([
			'demo-blocker-2',
			'demo-blocker-3'
		]);
		expect((await listOpenWaiting()).map((w) => w.id)).toEqual(['demo-waiting-3']);
	});
});

describe('weekly review decisions', () => {
	it('drops and restarts parked projects without passing three active', async () => {
		await importData(buildDemoData(TODAY));
		const { review } = await loadReview('2026-10-26');
		review.parkedDecisions = [{ projectId: 'demo-project-4', name: 'x', decision: 'restart' }];
		expect((await applyParkedDecisions(review)).noRoom).toEqual(['Asteroid delivery service']);
		review.parkedDecisions[0]!.decision = 'drop';
		expect((await applyParkedDecisions(review)).dropped).toEqual(['Asteroid delivery service']);
		expect((await db.projects.get('demo-project-4'))?.status).toBe('done');
	});
});

describe('new weekly review', () => {
	it('suggests the week wins and lists parked projects', async () => {
		const data = buildDemoData(TODAY);
		data.reviews = [];
		await importData(data);
		const { review, exists } = await loadReview('2026-10-26');
		expect(exists).toBe(false);
		expect(review.parkedDecisions.map((d) => d.projectId)).toEqual(['demo-project-4']);
		expect(review.topWins[0]).toBe('Chose Nebula Teal for the walls');
	});
});

describe('saving one part of the day keeps the rest', () => {
	it('the evening check-in keeps focus blocks added while it was open', async () => {
		const page = emptyDailyPage(TODAY);
		page.oneThing.text = 'Fix the hinge';
		await savePage(page);
		const evening = await loadDay(TODAY);
		await addFocusBlock(TODAY);
		await saveEvening(TODAY, { ...evening.page.evening, win: 'Hinge fixed' }, true);
		const stored = await db.pages.get(TODAY);
		expect(stored?.energy.focusBlocks).toBe(1);
		expect(stored?.oneThing).toMatchObject({ text: 'Fix the hinge', done: true });
		expect(stored?.evening).toMatchObject({ win: 'Hinge fixed', didOneThing: true });
		expect(await db.wins.get(`evening-${TODAY}`)).toMatchObject({ text: 'Hinge fixed' });
	});

	it('finishing the morning keeps focus blocks added while it was open', async () => {
		const draft = (await loadDay(TODAY)).page;
		await addFocusBlock(TODAY);
		await addFocusBlock(TODAY);
		draft.oneThing.text = 'Paint the sign';
		await saveMorning(draft);
		const stored = await db.pages.get(TODAY);
		expect(stored?.energy.focusBlocks).toBe(2);
		expect(stored?.oneThing.text).toBe('Paint the sign');
	});
});
