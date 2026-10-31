import type { Project } from '../types.ts';

export const MAX_ACTIVE_PROJECTS = 3;
export const PARK_REASON_REQUIRED = 'Add a short reason so future you knows why it can wait.';

export type ProjectError =
	'needs-park' | 'reason-required' | 'invalid-park-target' | 'name-required';

export type ProjectResult = { ok: true; changes: Project[] } | { ok: false; error: ProjectError };

export interface ParkChoice {
	projectId: string;
	reason: string;
}

export function activeProjects(projects: Project[]): Project[] {
	return projects.filter((p) => p.status === 'active');
}

export function parkedProjects(projects: Project[]): Project[] {
	return projects.filter((p) => p.status === 'parked');
}

export function hasRoomForActive(projects: Project[], exceptId?: string): boolean {
	return activeProjects(projects).filter((p) => p.id !== exceptId).length < MAX_ACTIVE_PROJECTS;
}

export function parkProject(project: Project, reason: string, now: string): ProjectResult {
	const trimmed = reason.trim();
	if (!trimmed) return { ok: false, error: 'reason-required' };
	return {
		ok: true,
		changes: [{ ...project, status: 'parked', parkedReason: trimmed, updatedAt: now }]
	};
}

/**
 * Makes `target` active (it may be a brand-new project). With three already active,
 * one of them has to be parked, with a reason, in the same change.
 */
export function activateProject(
	projects: Project[],
	target: Project,
	now: string,
	park?: ParkChoice
): ProjectResult {
	if (!target.name.trim()) return { ok: false, error: 'name-required' };
	const othersActive = activeProjects(projects).filter((p) => p.id !== target.id);
	const activated: Project = {
		...target,
		status: 'active',
		parkedReason: undefined,
		updatedAt: now
	};
	if (othersActive.length < MAX_ACTIVE_PROJECTS) return { ok: true, changes: [activated] };

	if (!park) return { ok: false, error: 'needs-park' };
	const toPark = othersActive.find((p) => p.id === park.projectId);
	if (!toPark) return { ok: false, error: 'invalid-park-target' };
	// Parking one only frees a slot when exactly three are active; keep the limit if data was already over it.
	if (othersActive.length - 1 >= MAX_ACTIVE_PROJECTS) return { ok: false, error: 'needs-park' };
	const parked = parkProject(toPark, park.reason, now);
	if (!parked.ok) return parked;
	return { ok: true, changes: [...parked.changes, activated] };
}

export function newProject(
	id: string,
	name: string,
	nextStep: string,
	now: string,
	status: Project['status'] = 'parked'
): Project {
	return { id, name: name.trim(), status, nextStep: nextStep.trim(), updatedAt: now };
}

/** Adds a new project to Parked straight away; parking always needs a reason. */
export function addParked(project: Project, reason: string, now: string): ProjectResult {
	if (!project.name.trim()) return { ok: false, error: 'name-required' };
	return parkProject(project, reason, now);
}

export function finishProject(project: Project, now: string): Project {
	return { ...project, status: 'done', updatedAt: now };
}
