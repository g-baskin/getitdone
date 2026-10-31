<script lang="ts">
	import ParkPicker from '#lib/components/ParkPicker.svelte';
	import { db } from '#lib/db/db.ts';
	import {
		activateProject,
		createProject,
		finishProject,
		parkProject,
		updateProject
	} from '#lib/db/repo.ts';
	import {
		activeProjects,
		hasRoomForActive,
		MAX_ACTIVE_PROJECTS,
		PARK_REASON_REQUIRED,
		parkedProjects
	} from '#lib/rules/projects.ts';
	import { live } from '#lib/state/live.svelte.ts';
	import type { Project } from '#lib/types.ts';

	const projects = live(async () => (await db.projects.toArray()).sort(byName), []);
	const active = $derived(activeProjects(projects.current));
	const parked = $derived(parkedProjects(projects.current));
	const closed = $derived(projects.current.filter((p) => p.status === 'done'));
	const room = $derived(hasRoomForActive(projects.current));

	let status = $state('');
	let newName = $state('');
	let newNext = $state('');
	let newError = $state('');
	let newMode = $state<'choose' | 'park-one' | 'add-parked' | null>(null);
	let newParkedReason = $state('');
	/** Parked project waiting for a slot. */
	let activating = $state<Project | null>(null);
	let parkingId = $state<string | null>(null);
	let parkReason = $state('');
	let parkError = $state('');

	function byName(a: Project, b: Project) {
		return a.name.localeCompare(b.name);
	}

	async function addProject(event: SubmitEvent) {
		event.preventDefault();
		newError = '';
		if (!newName.trim()) {
			newError = 'Give the project a name.';
			return;
		}
		if (!room) {
			newMode = 'choose';
			return;
		}
		await createProject(newName, newNext, { mode: 'active' });
		done(`Added "${newName.trim()}" to active projects.`);
	}

	async function addWithPark(projectId: string, reason: string) {
		const result = await createProject(newName, newNext, {
			mode: 'active',
			park: { projectId, reason }
		});
		if (result.ok) done(`Added "${newName.trim()}" and parked one to make room.`);
	}

	async function addAsParked(event: SubmitEvent) {
		event.preventDefault();
		if (!newParkedReason.trim()) {
			newError = PARK_REASON_REQUIRED;
			return;
		}
		const result = await createProject(newName, newNext, {
			mode: 'parked',
			reason: newParkedReason
		});
		if (result.ok) done(`Added "${newName.trim()}" to parked projects.`);
	}

	function done(message: string) {
		status = message;
		newName = '';
		newNext = '';
		newError = '';
		newMode = null;
		newParkedReason = '';
	}

	async function makeActive(project: Project) {
		if (room) {
			await activateProject(project.id);
			status = `"${project.name}" is active again.`;
		} else {
			activating = project;
		}
	}

	async function activateWithPark(projectId: string, reason: string) {
		if (!activating) return;
		const result = await activateProject(activating.id, { projectId, reason });
		if (result.ok) status = `"${activating.name}" is active; the other one is parked.`;
		activating = null;
	}

	async function confirmPark(event: SubmitEvent, project: Project) {
		event.preventDefault();
		const result = await parkProject(project.id, parkReason);
		if (!result.ok) {
			parkError = PARK_REASON_REQUIRED;
			return;
		}
		status = `"${project.name}" is parked.`;
		parkingId = null;
		parkReason = '';
		parkError = '';
	}

	function startParking(id: string) {
		parkingId = id;
		parkReason = '';
		parkError = '';
	}
</script>

<svelte:head><title>Projects · Get It Done</title></svelte:head>

<h1>Projects</h1>
<p class="muted">
	Up to {MAX_ACTIVE_PROJECTS} active at once. Everything else waits in Parked, with a reason.
</p>
<div role="status">
	{#if status}<p class="note">{status}</p>{/if}
</div>

<section class="card" aria-labelledby="active-h">
	<h2 id="active-h">
		Active <span class="muted small">({active.length} of {MAX_ACTIVE_PROJECTS})</span>
	</h2>
	{#if active.length}
		<ul class="items">
			{#each active as project (project.id)}
				<li data-testid="active-project">
					<div class="field">
						<label for="name-{project.id}">Project name</label>
						<input
							id="name-{project.id}"
							value={project.name}
							onchange={(e) =>
								e.currentTarget.value.trim() &&
								updateProject(project.id, { name: e.currentTarget.value.trim() })}
							autocomplete="off"
						/>
					</div>
					<div class="field">
						<label for="next-{project.id}">Next step</label>
						<input
							id="next-{project.id}"
							value={project.nextStep}
							onchange={(e) => updateProject(project.id, { nextStep: e.currentTarget.value })}
							autocomplete="off"
						/>
					</div>
					{#if parkingId === project.id}
						<form class="inline-form" onsubmit={(e) => confirmPark(e, project)} novalidate>
							<label for="reason-{project.id}">Why can it wait?</label>
							<input
								id="reason-{project.id}"
								bind:value={parkReason}
								aria-invalid={parkError ? 'true' : undefined}
								aria-describedby={parkError ? `reason-error-${project.id}` : undefined}
								autocomplete="off"
							/>
							{#if parkError}<p class="error" id="reason-error-{project.id}">{parkError}</p>{/if}
							<div class="actions">
								<button class="btn" type="submit">Park it</button>
								<button class="btn quiet" type="button" onclick={() => (parkingId = null)}>
									Cancel
								</button>
							</div>
						</form>
					{:else}
						<div class="actions">
							<button
								class="btn secondary small"
								type="button"
								onclick={() => startParking(project.id)}
							>
								Park<span class="visually-hidden">: {project.name}</span>
							</button>
							<button
								class="btn secondary small"
								type="button"
								onclick={() => finishProject(project.id)}
							>
								Done<span class="visually-hidden">: {project.name}</span>
							</button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">No active projects. Add one below.</p>
	{/if}
</section>

<section class="card" aria-labelledby="add-h">
	<h2 id="add-h">Add a project</h2>
	<form onsubmit={addProject} novalidate>
		<div class="grid-2">
			<div>
				<label for="new-name">Name</label>
				<input
					id="new-name"
					bind:value={newName}
					aria-invalid={newError && !newName.trim() ? 'true' : undefined}
					aria-describedby={newError ? 'new-error' : undefined}
					autocomplete="off"
				/>
			</div>
			<div>
				<label for="new-next">Next step <span class="hint">Optional</span></label>
				<input id="new-next" bind:value={newNext} autocomplete="off" />
			</div>
		</div>
		{#if newError}<p class="error" id="new-error">{newError}</p>{/if}
		{#if !newMode}
			<div class="actions"><button class="btn" type="submit">Add project</button></div>
		{/if}
	</form>
	{#if newMode === 'choose'}
		<div class="note">
			<p>Three projects are already active. What should happen with "{newName.trim()}"?</p>
			<div class="row">
				<button class="btn" type="button" onclick={() => (newMode = 'park-one')}>
					Park one to make room
				</button>
				<button class="btn secondary" type="button" onclick={() => (newMode = 'add-parked')}>
					Add it to Parked
				</button>
				<button class="btn quiet" type="button" onclick={() => (newMode = null)}>Cancel</button>
			</div>
		</div>
	{:else if newMode === 'park-one'}
		<ParkPicker
			{active}
			incomingName={newName.trim()}
			onconfirm={addWithPark}
			oncancel={() => (newMode = null)}
		/>
	{:else if newMode === 'add-parked'}
		<form class="inline-form" onsubmit={addAsParked} novalidate>
			<label for="new-parked-reason">Why can it wait?</label>
			<input id="new-parked-reason" bind:value={newParkedReason} autocomplete="off" />
			<div class="actions">
				<button class="btn" type="submit">Add to Parked</button>
				<button class="btn quiet" type="button" onclick={() => (newMode = null)}>Cancel</button>
			</div>
		</form>
	{/if}
</section>

<section class="card" aria-labelledby="parked-h">
	<h2 id="parked-h">Parked</h2>
	{#if activating}
		<ParkPicker
			{active}
			incomingName={activating.name}
			onconfirm={activateWithPark}
			oncancel={() => (activating = null)}
		/>
	{/if}
	{#if parked.length}
		<ul class="items">
			{#each parked as project (project.id)}
				<li data-testid="parked-project">
					<strong>{project.name}</strong>
					{#if project.parkedReason}<p class="muted small">Parked: {project.parkedReason}</p>{/if}
					{#if project.nextStep}<p class="small">Next step: {project.nextStep}</p>{/if}
					<div class="actions">
						<button class="btn secondary small" type="button" onclick={() => makeActive(project)}>
							Make active<span class="visually-hidden">: {project.name}</span>
						</button>
						<button class="btn quiet small" type="button" onclick={() => finishProject(project.id)}>
							Close it<span class="visually-hidden">: {project.name}</span>
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="empty">Nothing parked.</p>
	{/if}
</section>

{#if closed.length}
	<details class="card">
		<summary>Done or closed ({closed.length})</summary>
		<ul class="items">
			{#each closed as project (project.id)}
				<li class="row between">
					<span>{project.name}</span>
					<button class="btn quiet small" type="button" onclick={() => makeActive(project)}>
						Reopen<span class="visually-hidden">: {project.name}</span>
					</button>
				</li>
			{/each}
		</ul>
	</details>
{/if}

<style>
	.inline-form {
		margin-top: 0.75rem;
	}
	.between {
		justify-content: space-between;
	}
	summary {
		cursor: pointer;
		font-weight: 600;
		min-height: var(--tap);
		display: flex;
		align-items: center;
	}
	.note p {
		margin-bottom: 0.5rem;
	}
	p {
		margin-bottom: 0.25rem;
	}
</style>
