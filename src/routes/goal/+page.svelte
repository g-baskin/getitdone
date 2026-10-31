<script lang="ts">
	import { db } from '#lib/db/db.ts';
	import {
		addStep,
		createGoal,
		deleteStep,
		moveStep,
		setStepStatus,
		updateGoal,
		updateStep
	} from '#lib/db/repo.ts';
	import {
		activeGoal,
		canAddStep,
		MAX_STEPS,
		STEP_LIMIT_NOTE,
		STEP_STATUSES,
		stepsFor
	} from '#lib/rules/goal.ts';
	import { clock } from '#lib/state/clock.svelte.ts';
	import { live } from '#lib/state/live.svelte.ts';
	import type { Goal, StepStatus } from '#lib/types.ts';

	const goals = live(() => db.goals.toArray(), []);
	const steps = live(() => db.steps.toArray(), []);
	const goal = $derived(activeGoal(goals.current));
	const goalSteps = $derived(goal ? stepsFor(steps.current, goal.id) : []);
	const canAdd = $derived(goal ? canAddStep(steps.current, goal.id) : false);

	let status = $state('');
	let newStep = $state('');
	let stepError = $state('');
	let startingNew = $state(false);
	let form = $state({ title: '', deadline: '', why: '' });
	let formError = $state('');

	async function create(event: SubmitEvent) {
		event.preventDefault();
		if (!form.title.trim()) {
			formError = 'Give the goal a short name.';
			return;
		}
		await createGoal({ title: form.title, deadline: form.deadline, why: form.why });
		form = { title: '', deadline: '', why: '' };
		formError = '';
		startingNew = false;
		status = 'Goal saved. Add up to five big steps.';
	}

	async function add(event: SubmitEvent) {
		event.preventDefault();
		if (!goal) return;
		const result = await addStep(goal.id, newStep);
		if (!result.ok) {
			stepError = result.error === 'limit' ? STEP_LIMIT_NOTE : 'Name the step first.';
			return;
		}
		stepError = '';
		status = `Added "${result.step.title}".`;
		newStep = '';
	}

	async function changeStatus(stepId: string, title: string, value: StepStatus) {
		await setStepStatus(stepId, value, clock.today);
		if (value === 'done') status = `Nice. "${title}" is done and added to your Proof Log.`;
	}

	function saveGoal(g: Goal, patch: Partial<Pick<Goal, 'title' | 'deadline' | 'why'>>) {
		void updateGoal(g.id, patch);
	}
</script>

<svelte:head><title>Goal · Get It Done</title></svelte:head>

<h1>Goal and big steps</h1>
<p class="muted">One goal at a time, broken into no more than five big steps.</p>
<div role="status">
	{#if status}<p class="note">{status}</p>{/if}
</div>

{#if goals.ready && goal && !startingNew}
	<section class="card" aria-labelledby="goal-h">
		<h2 id="goal-h" class="visually-hidden">Current goal</h2>
		<div class="field">
			<label for="g-title">Goal</label>
			<input
				id="g-title"
				class="goal-title"
				value={goal.title}
				onchange={(e) =>
					e.currentTarget.value.trim() && saveGoal(goal, { title: e.currentTarget.value.trim() })}
				autocomplete="off"
			/>
		</div>
		<div class="grid-2 field">
			<div>
				<label for="g-deadline">Deadline</label>
				<input
					id="g-deadline"
					type="date"
					value={goal.deadline}
					onchange={(e) => saveGoal(goal, { deadline: e.currentTarget.value })}
				/>
			</div>
			<div>
				<label for="g-why">Why it matters <span class="hint">One line</span></label>
				<input
					id="g-why"
					value={goal.why}
					onchange={(e) => saveGoal(goal, { why: e.currentTarget.value })}
					autocomplete="off"
				/>
			</div>
		</div>
	</section>

	<section class="card" aria-labelledby="steps-h">
		<h2 id="steps-h">
			Big steps <span class="muted small">({goalSteps.length} of {MAX_STEPS})</span>
		</h2>
		{#if goalSteps.length}
			<ol class="items steps">
				{#each goalSteps as step, i (step.id)}
					<li data-testid="step" class:done={step.status === 'done'}>
						<div class="field">
							<label for="s-title-{step.id}">Step {i + 1}</label>
							<input
								id="s-title-{step.id}"
								value={step.title}
								onchange={(e) =>
									e.currentTarget.value.trim() &&
									updateStep(step.id, { title: e.currentTarget.value.trim() })}
								autocomplete="off"
							/>
						</div>
						<div class="row step-row">
							<div>
								<label for="s-status-{step.id}">Status</label>
								<select
									id="s-status-{step.id}"
									value={step.status}
									onchange={(e) =>
										changeStatus(step.id, step.title, e.currentTarget.value as StepStatus)}
								>
									{#each STEP_STATUSES as s (s.value)}
										<option value={s.value}>{s.label}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="s-date-{step.id}">Target date <span class="hint">Optional</span></label>
								<input
									id="s-date-{step.id}"
									type="date"
									value={step.targetDate ?? ''}
									onchange={(e) =>
										updateStep(step.id, { targetDate: e.currentTarget.value || undefined })}
								/>
							</div>
						</div>
						<div class="row">
							<button
								class="btn quiet small"
								type="button"
								disabled={i === 0}
								onclick={() => moveStep(goal.id, step.id, -1)}
							>
								Move up<span class="visually-hidden">: {step.title}</span>
							</button>
							<button
								class="btn quiet small"
								type="button"
								disabled={i === goalSteps.length - 1}
								onclick={() => moveStep(goal.id, step.id, 1)}
							>
								Move down<span class="visually-hidden">: {step.title}</span>
							</button>
							<button
								class="btn quiet small"
								type="button"
								onclick={() => {
									if (confirm(`Remove the step "${step.title}"?`)) void deleteStep(step.id);
								}}
							>
								Remove<span class="visually-hidden">: {step.title}</span>
							</button>
						</div>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="empty">No steps yet. What are the big pieces between here and the goal?</p>
		{/if}

		{#if canAdd}
			<form class="add-step" onsubmit={add} novalidate>
				<label for="new-step">New big step</label>
				<div class="row nowrap">
					<input
						id="new-step"
						bind:value={newStep}
						aria-invalid={stepError ? 'true' : undefined}
						aria-describedby={stepError ? 'step-error' : undefined}
						autocomplete="off"
					/>
					<button class="btn" type="submit">Add step</button>
				</div>
				{#if stepError}<p class="error" id="step-error">{stepError}</p>{/if}
			</form>
		{:else}
			<p class="note">{STEP_LIMIT_NOTE}</p>
		{/if}
	</section>

	<p>
		<button class="btn quiet" type="button" onclick={() => (startingNew = true)}>
			Start a different goal
		</button>
	</p>
{:else if goals.ready}
	<form class="card" onsubmit={create} novalidate>
		<h2>{goal ? 'A new goal' : 'Set your goal'}</h2>
		{#if goal}
			<p class="muted small">"{goal.title}" will be kept, but it won't be active anymore.</p>
		{/if}
		<div class="field">
			<label for="ng-title">What's the goal?</label>
			<input
				id="ng-title"
				bind:value={form.title}
				placeholder="Open the Teleporting Teapot Shop"
				aria-invalid={formError ? 'true' : undefined}
				aria-describedby={formError ? 'ng-error' : undefined}
				autocomplete="off"
			/>
			{#if formError}<p class="error" id="ng-error">{formError}</p>{/if}
		</div>
		<div class="grid-2 field">
			<div>
				<label for="ng-deadline">Deadline <span class="hint">Optional</span></label>
				<input id="ng-deadline" type="date" bind:value={form.deadline} />
			</div>
			<div>
				<label for="ng-why">Why it matters <span class="hint">One line</span></label>
				<input id="ng-why" bind:value={form.why} autocomplete="off" />
			</div>
		</div>
		<div class="actions">
			<button class="btn" type="submit">Save goal</button>
			{#if goal}<button class="btn quiet" type="button" onclick={() => (startingNew = false)}>
					Cancel
				</button>{/if}
		</div>
	</form>
{/if}

<style>
	.goal-title {
		font-size: 1.25rem;
		font-weight: 700;
	}
	.steps {
		padding: 0;
	}
	.step-row {
		align-items: flex-end;
		margin: 0.5rem 0;
	}
	.step-row > div {
		flex: 1 1 10rem;
	}
	li.done input[id^='s-title'] {
		text-decoration: line-through;
		color: var(--muted);
	}
	.add-step {
		margin-top: 1rem;
	}
	.nowrap {
		flex-wrap: nowrap;
	}
</style>
