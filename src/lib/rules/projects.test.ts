import { describe, expect, it } from 'vitest';
import type { Project } from '../types.ts';
import {
	activateProject,
	activeProjects,
	addParked,
	MAX_ACTIVE_PROJECTS,
	newProject,
	parkProject
} from './projects.ts';

const NOW = '2026-10-31T09:00:00.000Z';
const p = (id: string, status: Project['status']): Project => ({
	id,
	name: `Project ${id}`,
	status,
	nextStep: '',
	updatedAt: '2026-10-01T00:00:00.000Z'
});

describe('rule 2: three active projects', () => {
	const three = [p('a', 'active'), p('b', 'active'), p('c', 'active'), p('d', 'parked')];

	it('allows activating while there is room', () => {
		const result = activateProject([p('a', 'active')], p('d', 'parked'), NOW);
		expect(result.ok && result.changes.map((c) => [c.id, c.status])).toEqual([['d', 'active']]);
	});

	it('refuses a fourth active project unless one is parked', () => {
		expect(MAX_ACTIVE_PROJECTS).toBe(3);
		expect(activateProject(three, p('d', 'parked'), NOW)).toEqual({
			ok: false,
			error: 'needs-park'
		});
	});

	it('requires a reason to park one to make room', () => {
		expect(activateProject(three, p('d', 'parked'), NOW, { projectId: 'a', reason: ' ' })).toEqual({
			ok: false,
			error: 'reason-required'
		});
	});

	it('only parks a project that is currently active', () => {
		expect(activateProject(three, p('d', 'parked'), NOW, { projectId: 'd', reason: 'x' })).toEqual({
			ok: false,
			error: 'invalid-park-target'
		});
	});

	it('parks one with a reason and activates the other, keeping three active', () => {
		const result = activateProject(three, p('d', 'parked'), NOW, {
			projectId: 'b',
			reason: 'Waiting on the new budget'
		});
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		const byId = new Map(three.map((x) => [x.id, x]));
		for (const c of result.changes) byId.set(c.id, c);
		const after = [...byId.values()];
		expect(activeProjects(after).map((x) => x.id)).toEqual(['a', 'c', 'd']);
		expect(byId.get('b')).toMatchObject({
			status: 'parked',
			parkedReason: 'Waiting on the new budget'
		});
		expect(byId.get('d')?.parkedReason).toBeUndefined();
	});

	it('treats a brand-new project like any other activation', () => {
		const fresh = newProject('n', 'New idea', 'Sketch it', NOW);
		expect(activateProject(three, fresh, NOW)).toEqual({ ok: false, error: 'needs-park' });
	});

	it('needs a reason whenever something is parked', () => {
		expect(parkProject(p('a', 'active'), '', NOW)).toEqual({ ok: false, error: 'reason-required' });
		expect(addParked(newProject('n', 'Later', '', NOW), '', NOW)).toEqual({
			ok: false,
			error: 'reason-required'
		});
		const ok = parkProject(p('a', 'active'), ' Not this month ', NOW);
		expect(ok.ok && ok.changes[0]?.parkedReason).toBe('Not this month');
	});
});
