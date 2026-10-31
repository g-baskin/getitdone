<script lang="ts">
	import { PARK_REASON_REQUIRED } from '../rules/projects.ts';
	import type { Project } from '../types.ts';

	let {
		active,
		incomingName,
		onconfirm,
		oncancel
	}: {
		active: Project[];
		incomingName: string;
		onconfirm: (projectId: string, reason: string) => Promise<void> | void;
		oncancel: () => void;
	} = $props();

	const id = $props.id();
	let choice = $state('');
	let reason = $state('');
	let error = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!choice) {
			error = 'Pick the project that can wait.';
			return;
		}
		if (!reason.trim()) {
			error = PARK_REASON_REQUIRED;
			return;
		}
		error = '';
		await onconfirm(choice, reason.trim());
	}
</script>

<form class="park" onsubmit={submit} novalidate aria-labelledby="{id}-title">
	<h3 id="{id}-title">Three projects are already active</h3>
	<p class="muted">To make room for "{incomingName}", pick one that can wait for now.</p>
	<fieldset>
		<legend class="label">Park which one?</legend>
		{#each active as project (project.id)}
			<label class="check">
				<input type="radio" name="{id}-park" value={project.id} bind:group={choice} />
				{project.name}
			</label>
		{/each}
	</fieldset>
	<div class="field">
		<label for="{id}-reason">Why can it wait?</label>
		<input
			id="{id}-reason"
			bind:value={reason}
			placeholder="Pick it back up after the launch"
			aria-describedby={error ? `${id}-error` : undefined}
			aria-invalid={error && !reason.trim() ? 'true' : undefined}
			autocomplete="off"
		/>
	</div>
	{#if error}<p class="error" id="{id}-error" role="alert">{error}</p>{/if}
	<div class="actions">
		<button class="btn" type="submit">Park it and make room</button>
		<button class="btn quiet" type="button" onclick={oncancel}>Cancel</button>
	</div>
</form>

<style>
	.park {
		background: var(--accent-soft);
		border-radius: var(--radius);
		padding: 1rem;
		margin: 0.75rem 0;
	}
	fieldset {
		border: 0;
		padding: 0;
		margin: 0 0 0.5rem;
	}
</style>
