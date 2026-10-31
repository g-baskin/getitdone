<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BlockerList from '#lib/components/BlockerList.svelte';
	import OneThingLink from '#lib/components/OneThingLink.svelte';
	import WaitingList from '#lib/components/WaitingList.svelte';
	import { relativeDayName } from '#lib/dates.ts';
	import { db } from '#lib/db/db.ts';
	import { listOpenBlockers, listOpenWaiting, loadDay, saveMorning } from '#lib/db/repo.ts';
	import { activeGoal, stepsFor } from '#lib/rules/goal.ts';
	import { MINIMUM_DAY_NOTE } from '#lib/rules/minimumDay.ts';
	import { applyYesterdayChoice, morningSteps, type MorningStep } from '#lib/rules/morning.ts';
	import { applyLinkValue, goalLinkNote, oneThingError } from '#lib/rules/oneThing.ts';
	import { clock } from '#lib/state/clock.svelte.ts';
	import { live } from '#lib/state/live.svelte.ts';
	import type { DailyPage, ISODate, OneThing, YesterdayChoice } from '#lib/types.ts';

	const STEP_TITLES: Record<MorningStep, string> = {
		yesterday: 'Before you start',
		word: "Today's word",
		oneThing: "Today's one thing",
		why: 'Why it matters',
		top3: "What's important today",
		review: 'Blockers and waiting'
	};

	let base: DailyPage | null = null;
	let draft = $state<DailyPage | null>(null);
	let askAbout = $state<OneThing | null>(null);
	let prevDate = $state<ISODate | null>(null);
	let stepId = $state<MorningStep>('word');
	let error = $state<string | null>(null);
	let saving = $state(false);
	let heading: HTMLHeadingElement | undefined = $state();
	let oneThingInput: HTMLTextAreaElement | undefined = $state();
	let shrinkSelected = false;

	const today = $derived(clock.today);
	const projects = live(() => db.projects.toArray(), []);
	const goal = live(async () => activeGoal(await db.goals.toArray()) ?? null, null);
	const allSteps = live(() => db.steps.toArray(), []);
	const blockers = live(
		() => listOpenBlockers(clock.today),
		[],
		() => clock.today
	);
	const waiting = live(() => listOpenWaiting(), []);
	const goalSteps = $derived(goal.current ? stepsFor(allSteps.current, goal.current.id) : []);

	const steps = $derived(morningSteps(draft?.minimumDay ?? false, askAbout !== null));
	const current = $derived<MorningStep>(steps.includes(stepId) ? stepId : 'oneThing');
	const index = $derived(steps.indexOf(current));
	const isLast = $derived(index === steps.length - 1);
	const note = $derived(draft ? goalLinkNote(draft.oneThing) : null);

	$effect(() => {
		loadDay(clock.today).then((day) => {
			base = day.page;
			draft = structuredClone(day.page);
			askAbout = day.askAbout;
			prevDate = day.previous?.date ?? null;
			stepId = morningSteps(day.page.minimumDay, day.askAbout !== null)[0] ?? 'oneThing';
		});
	});

	async function goTo(step: MorningStep) {
		stepId = step;
		error = null;
		await tick();
		// Arriving to shrink yesterday's one thing: select it so it's ready to cut down.
		if (step === 'oneThing' && draft?.yesterdayChoice === 'shrink' && !shrinkSelected) {
			shrinkSelected = true;
			oneThingInput?.focus();
			oneThingInput?.select();
		} else {
			heading?.focus();
		}
	}

	function chooseYesterday(choice: YesterdayChoice) {
		if (!base || !draft || !askAbout) return;
		const next = applyYesterdayChoice(base, choice, askAbout);
		// Keep anything already chosen on later steps, except the one thing itself.
		draft = { ...$state.snapshot(draft), oneThing: next.oneThing, yesterdayChoice: choice };
		shrinkSelected = false;
		const after = steps[index + 1];
		if (after) void goTo(after);
	}

	async function next(event?: SubmitEvent) {
		event?.preventDefault();
		if (!draft) return;
		if (current === 'oneThing') {
			error = oneThingError(draft.oneThing.text);
			if (error) {
				oneThingInput?.focus();
				return;
			}
		}
		if (isLast) return finish();
		const after = steps[index + 1];
		if (after) await goTo(after);
	}

	function back() {
		const before = steps[index - 1];
		if (before) void goTo(before);
	}

	async function finish() {
		if (!draft) return;
		error = oneThingError(draft.oneThing.text);
		if (error) {
			await goTo('oneThing');
			error = oneThingError(draft.oneThing.text);
			return;
		}
		saving = true;
		const page = $state.snapshot(draft);
		page.oneThing.text = page.oneThing.text.trim();
		await saveMorning(page);
		await goto(resolve('/'));
	}

	function oneThingKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			void next();
		}
	}
</script>

<svelte:head><title>Morning · Get It Done</title></svelte:head>

{#if draft}
	<div class="morning">
		<div class="top">
			<p class="muted small" aria-live="polite">Step {index + 1} of {steps.length}</p>
			<label class="check small-check">
				<input type="checkbox" bind:checked={draft.minimumDay} />
				Minimum day
			</label>
		</div>
		<div class="progress" aria-hidden="true">
			<span style:width="{((index + 1) / steps.length) * 100}%"></span>
		</div>
		{#if draft.minimumDay}<p class="note">{MINIMUM_DAY_NOTE}</p>{/if}

		<h1 bind:this={heading} tabindex="-1">{STEP_TITLES[current]}</h1>

		{#if current === 'yesterday' && askAbout}
			<div class="card">
				<p>
					From {prevDate ? relativeDayName(prevDate, today).toLowerCase() : 'last time'}, still
					open:
				</p>
				<p class="yesterday-text">{askAbout.text}</p>
				<p class="muted">What would help today?</p>
				<div class="choices">
					<button class="btn" type="button" onclick={() => chooseYesterday('carry')}>
						Carry it over
					</button>
					<button class="btn secondary" type="button" onclick={() => chooseYesterday('shrink')}>
						Shrink it
					</button>
					<button class="btn secondary" type="button" onclick={() => chooseYesterday('drop')}>
						Drop it
					</button>
				</div>
				<p class="hint">
					Carry it over keeps it as today's one thing. Shrink it lets you cut it down to a piece you
					can finish today. Drop it lets it go so you can pick something new.
				</p>
			</div>
		{:else if current === 'review'}
			<p class="muted">These carry over until they're dealt with. Update anything that changed.</p>
			<section class="card" aria-labelledby="m-blockers">
				<h2 id="m-blockers">Blockers</h2>
				<BlockerList blockers={blockers.current} {today} />
			</section>
			<section class="card" aria-labelledby="m-waiting">
				<h2 id="m-waiting">Waiting on</h2>
				<WaitingList items={waiting.current} {today} />
			</section>
			<div class="actions">
				<button class="btn quiet" type="button" onclick={back}>Back</button>
				<button class="btn" type="button" onclick={() => finish()} disabled={saving}>
					Finish and see today
				</button>
			</div>
		{:else}
			<form class="card" onsubmit={next} novalidate>
				{#if current === 'word'}
					<label for="m-word">One word for how you want to show up today</label>
					<input
						id="m-word"
						bind:value={draft.todaysWord}
						placeholder="Steady"
						autocomplete="off"
					/>
				{:else if current === 'oneThing'}
					<label for="m-one-thing">
						Which task, once it's done, would make the rest of today lighter?
						{#if draft.yesterdayChoice === 'shrink'}
							<span class="hint">Make it smaller: keep only the part you can finish today.</span>
						{/if}
					</label>
					<textarea
						id="m-one-thing"
						class="one-input"
						bind:this={oneThingInput}
						bind:value={draft.oneThing.text}
						onkeydown={oneThingKeydown}
						rows="2"
						aria-invalid={error ? 'true' : undefined}
						aria-describedby={error ? 'm-one-thing-error' : undefined}
						placeholder="Finish the first draft of the menu"></textarea>
					{#if error}<p class="error" id="m-one-thing-error" role="alert">{error}</p>{/if}
					{#if !draft.minimumDay}
						<div class="field">
							<OneThingLink
								id="m-link"
								oneThing={draft.oneThing}
								steps={goalSteps}
								projects={projects.current}
								onchange={(v) => {
									if (draft) draft.oneThing = applyLinkValue(draft.oneThing, v);
								}}
							/>
						</div>
						{#if note}<p class="note">{note}</p>{/if}
					{/if}
				{:else if current === 'why'}
					<div class="field">
						<label for="m-who">Who's counting on me</label>
						<input id="m-who" bind:value={draft.whoIsCountingOnMe} autocomplete="off" />
					</div>
					<div class="field">
						<label for="m-why">Why it matters</label>
						<input id="m-why" bind:value={draft.whyItMatters} autocomplete="off" />
					</div>
				{:else if current === 'top3'}
					<p class="muted">Besides the one thing, up to three results that matter today.</p>
					{#each [0, 1, 2] as i (i)}
						<div class="field">
							<label for="m-important-{i}">Important {i + 1}</label>
							<input id="m-important-{i}" bind:value={draft.important[i]} autocomplete="off" />
						</div>
					{/each}
				{/if}
				<div class="actions">
					{#if index > 0}
						<button class="btn quiet" type="button" onclick={back}>Back</button>
					{/if}
					<button class="btn" type="submit" disabled={saving}>
						{isLast ? 'Finish and see today' : 'Next'}
					</button>
				</div>
			</form>
		{/if}
		<p class="small"><a href={resolve('/')}>Skip to today's page</a></p>
	</div>
{:else}
	<p class="muted" role="status">Getting your morning ready…</p>
{/if}

<style>
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.top p {
		margin: 0;
	}
	.small-check {
		font-weight: 600;
		font-size: 0.95rem;
	}
	.progress {
		height: 6px;
		background: var(--border);
		border-radius: 999px;
		overflow: hidden;
		margin-bottom: 1rem;
	}
	.progress span {
		display: block;
		height: 100%;
		background: var(--accent);
	}
	h1:focus {
		outline: none;
	}
	.yesterday-text {
		font-size: 1.3rem;
		font-weight: 700;
	}
	.choices {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}
	.one-input {
		font-size: 1.4rem;
		font-weight: 700;
		min-height: 4.5rem;
	}
</style>
