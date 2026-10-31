<script lang="ts">
	import { linkValue } from '../rules/oneThing.ts';
	import type { OneThing, Project, Step } from '../types.ts';

	let {
		oneThing,
		steps,
		projects,
		onchange,
		id
	}: {
		oneThing: OneThing;
		steps: Step[];
		projects: Project[];
		onchange: (value: string) => void;
		id: string;
	} = $props();

	const value = $derived(linkValue(oneThing));
	// Keep a link visible even if the step was finished or the project parked since.
	const openSteps = $derived(steps.filter((s) => s.status !== 'done' || s.id === oneThing.stepId));
	const shownProjects = $derived(
		projects.filter((p) => p.status === 'active' || p.id === oneThing.projectId)
	);
</script>

<label for={id}
	>Moves forward <span class="hint">Optional: link it to a big step or a project.</span></label
>
<select {id} {value} onchange={(e) => onchange(e.currentTarget.value)}>
	<option value="">Not linked</option>
	{#if openSteps.length}
		<optgroup label="Big steps">
			{#each openSteps as step (step.id)}
				<option value="step:{step.id}">{step.title}</option>
			{/each}
		</optgroup>
	{/if}
	{#if shownProjects.length}
		<optgroup label="Projects">
			{#each shownProjects as project (project.id)}
				<option value="project:{project.id}">{project.name}</option>
			{/each}
		</optgroup>
	{/if}
</select>
