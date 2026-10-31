<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import BlockerList from '#lib/components/BlockerList.svelte';
	import DailySheet from '#lib/components/DailySheet.svelte';
	import OneThingLink from '#lib/components/OneThingLink.svelte';
	import WaitingList from '#lib/components/WaitingList.svelte';
	import { formatLong } from '#lib/dates.ts';
	import { db } from '#lib/db/db.ts';
	import {
		listOpenBlockers,
		listOpenWaiting,
		loadDay,
		savePage,
		updateProject
	} from '#lib/db/repo.ts';
	import { printNow } from '#lib/print.ts';
	import { activeGoal, stepsFor } from '#lib/rules/goal.ts';
	import { MINIMUM_DAY_NOTE, visibleSections } from '#lib/rules/minimumDay.ts';
	import { applyLinkValue, goalLinkNote } from '#lib/rules/oneThing.ts';
	import { isPlanned, setOneThingDone } from '#lib/rules/pages.ts';
	import { activeProjects } from '#lib/rules/projects.ts';
	import { shouldSuggestReview, weekOf } from '#lib/rules/weekly.ts';
	import { debounced } from '#lib/state/autosave.ts';
	import { clock } from '#lib/state/clock.svelte.ts';
	import { live } from '#lib/state/live.svelte.ts';
	import { focusTimer } from '#lib/state/timer.svelte.ts';
	import type { DailyPage } from '#lib/types.ts';

	let page = $state<DailyPage | null>(null);
	let dayExists = $state(true);
	// Focus blocks that finished before this screen opened are already in the stored page.
	let seenFinished = focusTimer.finishedCount;
	let saveStatus = $state('');
	let printMode = $state<'today' | 'blank'>('today');

	const today = $derived(clock.today);
	const projects = live(() => db.projects.toArray(), []);
	const goal = live(async () => activeGoal(await db.goals.toArray()) ?? null, null);
	const steps = live(() => db.steps.toArray(), []);
	const blockers = live(
		() => listOpenBlockers(clock.today),
		[],
		() => clock.today
	);
	const waiting = live(() => listOpenWaiting(), []);
	const review = live(
		() => db.reviews.get(weekOf(clock.today)),
		undefined,
		() => clock.today
	);

	const active = $derived(activeProjects(projects.current));
	const goalSteps = $derived(goal.current ? stepsFor(steps.current, goal.current.id) : []);
	const show = $derived(visibleSections(page?.minimumDay ?? false));
	const note = $derived(page ? goalLinkNote(page.oneThing) : null);
	const suggestReview = $derived(review.ready && shouldSuggestReview(today, review.current));
	const linkLabel = $derived.by(() => {
		const o = page?.oneThing;
		if (o?.stepId) return steps.current.find((s) => s.id === o.stepId)?.title ?? '';
		if (o?.projectId) return projects.current.find((p) => p.id === o.projectId)?.name ?? '';
		return '';
	});

	$effect(() => {
		const date = clock.today;
		let cancelled = false;
		// A pending save reads `page`; keep that read out of this effect's dependencies.
		untrack(() => save.flush());
		loadDay(date).then((d) => {
			if (cancelled) return;
			page = d.page;
			dayExists = d.exists;
		});
		return () => {
			cancelled = true;
		};
	});

	const save = debounced(async () => {
		if (!page) return;
		await savePage($state.snapshot(page));
		dayExists = true;
		saveStatus = 'Saved';
	});

	// This screen saves the whole page, so a block finished while it's open is added here too.
	$effect(() => {
		const finished = focusTimer.finishedCount;
		untrack(() => {
			if (finished <= seenFinished || !page) return;
			setFocusBlocks(page.energy.focusBlocks + (finished - seenFinished));
			seenFinished = finished;
		});
	});

	function changed() {
		saveStatus = '';
		save();
	}

	function setDone(done: boolean) {
		if (!page) return;
		page = setOneThingDone(page, done);
		changed();
	}

	function setLink(value: string) {
		if (!page) return;
		page.oneThing = applyLinkValue(page.oneThing, value);
		changed();
	}

	function setFocusBlocks(n: number) {
		if (!page) return;
		page.energy.focusBlocks = Math.max(0, Math.min(20, n));
		changed();
	}

	function setSleep(value: string) {
		if (!page) return;
		const n = Number(value);
		page.energy.sleepHours =
			value === '' || !Number.isFinite(n) ? undefined : Math.max(0, Math.min(24, n));
	}

	async function print(mode: 'today' | 'blank') {
		save.flush();
		printMode = mode;
		await printNow();
	}

	onDestroy(() => save.flush());
</script>

<svelte:window onafterprint={() => (printMode = 'today')} onbeforeunload={() => save.flush()} />

<svelte:head><title>Today · Get It Done</title></svelte:head>

{#if page}
	<div class="screen-only">
		<div class="title-row">
			<h1>{formatLong(today)}</h1>
			<span class="muted small" role="status">{saveStatus}</span>
		</div>

		{#if !isPlanned(page) || !dayExists}
			<div class="banner">
				<p>
					{isPlanned(page)
						? 'Your one thing is pencilled in from last night. Take five minutes to set up the day.'
						: "Ready to pick today's one thing? It takes about five minutes."}
				</p>
				<a class="btn" href={resolve('/morning')}>Start the morning</a>
			</div>
		{/if}
		{#if suggestReview}
			<div class="banner">
				<p>It's Sunday. The weekly review is ready whenever you are.</p>
				<a class="btn secondary" href={resolve('/review')}>Open the weekly review</a>
			</div>
		{/if}

		<div class="card" oninput={changed} onchange={changed}>
			<label class="check">
				<input type="checkbox" bind:checked={page.minimumDay} />
				Minimum day
			</label>
			{#if page.minimumDay}<p class="note">{MINIMUM_DAY_NOTE}</p>{/if}
			{#if show.has('word')}
				<div class="field">
					<label for="word">Today's word</label>
					<input id="word" bind:value={page.todaysWord} placeholder="Steady" autocomplete="off" />
				</div>
			{/if}
		</div>

		<section class="card one-thing" oninput={changed}>
			<label id="one-thing-label" for="one-thing" class="one-label">Today's one thing</label>
			<textarea
				id="one-thing"
				class="one-input"
				bind:value={page.oneThing.text}
				rows="2"
				placeholder="The task that clears the way for the rest of today"></textarea>
			<label class="check">
				<input
					type="checkbox"
					checked={page.oneThing.done}
					onchange={(e) => setDone(e.currentTarget.checked)}
				/>
				Done
			</label>
			{#if show.has('whyWho')}
				<OneThingLink
					id="one-thing-link"
					oneThing={page.oneThing}
					steps={goalSteps}
					projects={projects.current}
					onchange={setLink}
				/>
				{#if note}<p class="note">{note}</p>{/if}
				<div class="grid-2 spaced">
					<div>
						<label for="why">Why it matters</label>
						<input id="why" bind:value={page.whyItMatters} autocomplete="off" />
					</div>
					<div>
						<label for="who">Who's counting on me</label>
						<input id="who" bind:value={page.whoIsCountingOnMe} autocomplete="off" />
					</div>
				</div>
			{/if}
		</section>

		{#if show.has('workingOn')}
			<section class="card" aria-labelledby="working-on">
				<h2 id="working-on">Working on <span class="muted small">({active.length} of 3)</span></h2>
				{#if active.length}
					<ul class="items">
						{#each active as project (project.id)}
							<li>
								<label for="next-{project.id}">{project.name}: next step</label>
								<input
									id="next-{project.id}"
									value={project.nextStep}
									onchange={(e) => updateProject(project.id, { nextStep: e.currentTarget.value })}
									autocomplete="off"
								/>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="empty">No active projects yet.</p>
				{/if}
				<a href={resolve('/projects')}>Manage projects</a>
			</section>
		{/if}

		{#if show.has('important')}
			<section class="card" aria-labelledby="important" oninput={changed}>
				<h2 id="important">What's important today</h2>
				<ol class="important">
					{#each [0, 1, 2] as i (i)}
						<li>
							<label class="visually-hidden" for="important-{i}">Important {i + 1}</label>
							<input id="important-{i}" bind:value={page.important[i]} autocomplete="off" />
						</li>
					{/each}
				</ol>
			</section>
		{/if}

		{#if show.has('blockers')}
			<section class="card" aria-labelledby="blockers">
				<h2 id="blockers">Blockers</h2>
				<BlockerList blockers={blockers.current} {today} />
			</section>
		{/if}

		{#if show.has('waiting')}
			<section class="card" aria-labelledby="waiting">
				<h2 id="waiting">Waiting on</h2>
				<WaitingList items={waiting.current} {today} />
			</section>
		{/if}

		{#if show.has('energy')}
			<section class="card" aria-labelledby="energy" oninput={changed} onchange={changed}>
				<h2 id="energy">Energy</h2>
				<div class="row energy">
					<div>
						<label for="sleep">Sleep (hours)</label>
						<input
							id="sleep"
							type="number"
							inputmode="decimal"
							min="0"
							max="24"
							step="0.5"
							value={page.energy.sleepHours ?? ''}
							oninput={(e) => setSleep(e.currentTarget.value)}
						/>
					</div>
					<label class="check moved">
						<input type="checkbox" bind:checked={page.energy.moved} />
						Moved my body
					</label>
					<div>
						<span class="label" id="blocks-label">Focus blocks</span>
						<div class="row" role="group" aria-labelledby="blocks-label">
							<button
								class="btn secondary small"
								type="button"
								onclick={() => setFocusBlocks(page!.energy.focusBlocks - 1)}
								aria-label="One fewer focus block">−</button
							>
							<output aria-live="polite" class="count">{page.energy.focusBlocks}</output>
							<button
								class="btn secondary small"
								type="button"
								onclick={() => setFocusBlocks(page!.energy.focusBlocks + 1)}
								aria-label="One more focus block">+</button
							>
							<a href={resolve('/focus')}>Start a block</a>
						</div>
					</div>
				</div>
			</section>
		{/if}

		<section class="card" aria-labelledby="tonight" oninput={changed}>
			<h2 id="tonight">Tonight</h2>
			<label class="check">
				<input
					type="checkbox"
					checked={page.evening.didOneThing ?? false}
					onchange={(e) => setDone(e.currentTarget.checked)}
				/>
				Did the one thing
			</label>
			{#if show.has('win')}
				<div class="field">
					<label for="win">Win <span class="hint">Saved to your Proof Log.</span></label>
					<input id="win" bind:value={page.evening.win} autocomplete="off" />
				</div>
			{/if}
			{#if show.has('lesson')}
				<div class="field">
					<label for="lesson">Lesson</label>
					<input id="lesson" bind:value={page.evening.lesson} autocomplete="off" />
				</div>
			{/if}
			{#if show.has('tomorrow')}
				<div class="field">
					<label for="tomorrow">Tomorrow's one thing</label>
					<input id="tomorrow" bind:value={page.evening.tomorrowOneThing} autocomplete="off" />
				</div>
			{/if}
			<p class="small"><a href={resolve('/evening')}>Open the evening check-in</a></p>
		</section>

		<div class="actions">
			<button class="btn secondary" type="button" onclick={() => print('today')}>
				Print or save as PDF
			</button>
			<button class="btn secondary" type="button" onclick={() => print('blank')}>
				Print blank page
			</button>
		</div>
	</div>

	<div class="print-only">
		{#if printMode === 'blank'}
			<DailySheet page={null} {today} />
		{:else}
			<DailySheet
				{page}
				{today}
				projects={active}
				blockers={blockers.current}
				waiting={waiting.current}
				{linkLabel}
			/>
		{/if}
	</div>
{:else}
	<p class="muted" role="status">Opening today's page…</p>
{/if}

<style>
	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}
	.one-thing {
		border: 2px solid var(--accent);
		box-shadow: 0 2px 10px rgb(31 92 79 / 0.1);
	}
	.one-label {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--accent-strong);
	}
	.one-input {
		font-size: 1.6rem;
		font-weight: 700;
		line-height: 1.25;
		min-height: 5rem;
		border-width: 2px;
	}
	.spaced {
		margin-top: 0.75rem;
	}
	.important {
		margin: 0;
		padding-left: 1.5rem;
	}
	.important li + li {
		margin-top: 0.5rem;
	}
	.energy {
		gap: 1rem 1.5rem;
		align-items: flex-end;
	}
	.energy input[type='number'] {
		width: 7rem;
	}
	.count {
		min-width: 2rem;
		text-align: center;
		font-weight: 700;
		font-size: 1.2rem;
	}
</style>
