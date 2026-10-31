<script lang="ts">
	import { onDestroy, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import WeeklySheet from '#lib/components/WeeklySheet.svelte';
	import { addDays, formatLong, formatMonthDay, isValidISODate, mondayOf } from '#lib/dates.ts';
	import { db } from '#lib/db/db.ts';
	import { applyParkedDecisions, loadReview, saveReview } from '#lib/db/repo.ts';
	import { printNow } from '#lib/print.ts';
	import { activeGoal, stepsFor } from '#lib/rules/goal.ts';
	import { winsInWeek } from '#lib/rules/proofLog.ts';
	import {
		clampPercent,
		clampScore,
		INTENTION_LABELS,
		RATING_KEYS,
		RATING_LABELS,
		weekOf
	} from '#lib/rules/weekly.ts';
	import { debounced } from '#lib/state/autosave.ts';
	import { clock } from '#lib/state/clock.svelte.ts';
	import { live } from '#lib/state/live.svelte.ts';
	import type { ParkedChoice, WeeklyReview } from '#lib/types.ts';

	const week = $derived.by(() => {
		const w = page.url.searchParams.get('week');
		return w && isValidISODate(w) ? mondayOf(w) : weekOf(clock.today);
	});
	const isCurrentWeek = $derived(week === weekOf(clock.today));

	let review = $state<WeeklyReview | null>(null);
	let saveStatus = $state('');
	let applyStatus = $state('');

	const wins = live(() => db.wins.toArray(), []);
	const goal = live(async () => activeGoal(await db.goals.toArray()) ?? null, null);
	const steps = live(() => db.steps.toArray(), []);
	const goalSteps = $derived(goal.current ? stepsFor(steps.current, goal.current.id) : []);
	const weekWins = $derived(winsInWeek(wins.current, week));
	const stepTitle = $derived(
		steps.current.find((s) => s.id === review?.nextWeekStepId)?.title ?? ''
	);
	const intentionKeys = ['self', 'people', 'skills', 'service'] as const;
	const choices: { value: ParkedChoice; label: string }[] = [
		{ value: 'keep', label: 'Keep parked' },
		{ value: 'restart', label: 'Restart' },
		{ value: 'drop', label: 'Drop' }
	];

	$effect(() => {
		const w = week;
		let cancelled = false;
		untrack(() => save.flush());
		loadReview(w).then((r) => {
			if (!cancelled) review = r.review;
		});
		return () => {
			cancelled = true;
		};
	});

	const save = debounced(async () => {
		if (!review) return;
		await saveReview($state.snapshot(review));
		saveStatus = 'Saved';
	});

	function changed() {
		saveStatus = '';
		save();
	}

	function useWin(text: string) {
		if (!review) return;
		const i = review.topWins.findIndex((w) => !w.trim());
		if (i >= 0) review.topWins[i] = text;
		changed();
	}

	async function apply() {
		if (!review) return;
		save.flush();
		const result = await applyParkedDecisions($state.snapshot(review));
		const parts: string[] = [];
		if (result.restarted.length) parts.push(`Restarted: ${result.restarted.join(', ')}.`);
		if (result.dropped.length) parts.push(`Dropped: ${result.dropped.join(', ')}.`);
		if (result.noRoom.length)
			parts.push(
				`No room yet for ${result.noRoom.join(', ')}: three projects are active. Park one on the Projects page first.`
			);
		applyStatus = parts.join(' ') || 'Nothing to change. Parked projects stay parked.';
	}

	async function print() {
		save.flush();
		await printNow();
	}

	onDestroy(() => save.flush());
</script>

<svelte:window onbeforeunload={() => save.flush()} />
<svelte:head><title>Weekly review · Get It Done</title></svelte:head>

<div class="screen-only">
	<div class="title-row">
		<h1>Weekly review</h1>
		<span class="muted small" role="status">{saveStatus}</span>
	</div>
	<p class="muted">About 15 minutes. Look back, then choose next week's focus.</p>

	<nav class="week-nav" aria-label="Choose a week">
		<a class="btn quiet small" href={resolve(`/review?week=${addDays(week, -7)}`)}>Previous week</a>
		<strong>Week of {formatLong(week)} – {formatMonthDay(addDays(week, 6))}</strong>
		{#if !isCurrentWeek}
			<a class="btn quiet small" href={resolve(`/review?week=${addDays(week, 7)}`)}>Next week</a>
		{/if}
	</nav>

	{#if review}
		<div oninput={changed} onchange={changed}>
			<section class="card" aria-labelledby="who-h">
				<h2 id="who-h">Who I want to be next week</h2>
				<div class="grid-2">
					{#each intentionKeys as key (key)}
						<div>
							<label for="int-{key}">{INTENTION_LABELS[key]}</label>
							<input id="int-{key}" bind:value={review.intentions[key]} autocomplete="off" />
						</div>
					{/each}
				</div>
			</section>

			<section class="card" aria-labelledby="ratings-h">
				<h2 id="ratings-h">How the week went</h2>
				<p class="muted small">1 is low, 10 is high. Notes are optional.</p>
				{#each RATING_KEYS as key (key)}
					<div class="rating">
						<div>
							<label for="score-{key}">{RATING_LABELS[key].label}</label>
							<span class="hint">{RATING_LABELS[key].hint}</span>
						</div>
						<select
							id="score-{key}"
							value={review.ratings[key].score === null ? '' : String(review.ratings[key].score)}
							onchange={(e) => {
								if (review) review.ratings[key].score = clampScore(e.currentTarget.value);
							}}
						>
							<option value="">–</option>
							{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as n (n)}
								<option value={String(n)}>{n}</option>
							{/each}
						</select>
						<div class="rating-note">
							<label class="visually-hidden" for="note-{key}">{RATING_LABELS[key].label} note</label
							>
							<input
								id="note-{key}"
								placeholder="Note"
								value={review.ratings[key].note ?? ''}
								oninput={(e) => {
									if (review) review.ratings[key].note = e.currentTarget.value || undefined;
								}}
								autocomplete="off"
							/>
						</div>
					</div>
				{/each}
			</section>

			<section class="card" aria-labelledby="time-h">
				<h2 id="time-h">Where the time went</h2>
				<label for="percent">About what share of this week went to your main output?</label>
				<div class="row">
					<input
						id="percent"
						class="percent"
						type="number"
						inputmode="numeric"
						min="0"
						max="100"
						value={review.mainOutputPercent ?? ''}
						oninput={(e) => {
							if (review) review.mainOutputPercent = clampPercent(e.currentTarget.value);
						}}
					/>
					<span aria-hidden="true">%</span>
				</div>
				<p class="hint">Main output is the work that actually moves your goal.</p>
			</section>

			<section class="card" aria-labelledby="parked-h">
				<h2 id="parked-h">Parked projects</h2>
				{#if review.parkedDecisions.length}
					{#each review.parkedDecisions as decision (decision.projectId)}
						<fieldset class="decision">
							<legend>{decision.name}</legend>
							<div class="row">
								{#each choices as c (c.value)}
									<label class="check choice">
										<input
											type="radio"
											name="decision-{decision.projectId}"
											value={c.value}
											bind:group={decision.decision}
										/>
										{c.label}
									</label>
								{/each}
							</div>
						</fieldset>
					{/each}
					<button class="btn secondary" type="button" onclick={apply}>Apply these decisions</button>
					<div role="status">
						{#if applyStatus}<p class="note">{applyStatus}</p>{/if}
					</div>
				{:else}
					<p class="empty">Nothing is parked.</p>
				{/if}
			</section>

			<section class="card" aria-labelledby="wins-h">
				<h2 id="wins-h">Top 3 wins</h2>
				{#each [0, 1, 2] as i (i)}
					<div class="field">
						<label for="topwin-{i}">Win {i + 1}</label>
						<input id="topwin-{i}" bind:value={review.topWins[i]} autocomplete="off" />
					</div>
				{/each}
				{#if weekWins.length}
					<h3 class="suggest-h">From this week's Proof Log</h3>
					<ul class="items">
						{#each weekWins as win (win.id)}
							<li class="row between">
								<span>{win.text}</span>
								<button
									class="btn quiet small"
									type="button"
									onclick={() => useWin(win.text)}
									disabled={review.topWins.includes(win.text) ||
										review.topWins.every((w) => w.trim())}
								>
									Use<span class="visually-hidden">: {win.text}</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</section>

			<section class="card" aria-labelledby="next-h">
				<h2 id="next-h">Next week</h2>
				<div class="field">
					<label for="focus">Main focus</label>
					<input id="focus" bind:value={review.nextWeekFocus} autocomplete="off" />
				</div>
				<div class="field">
					<label for="next-step">The goal step it moves forward</label>
					<select id="next-step" bind:value={review.nextWeekStepId}>
						<option value={undefined}>Not linked</option>
						{#each goalSteps as step (step.id)}
							<option value={step.id}>{step.title}</option>
						{/each}
					</select>
				</div>
			</section>
		</div>

		<div class="actions">
			<button class="btn secondary" type="button" onclick={print}>Print or save as PDF</button>
		</div>
	{:else}
		<p class="muted" role="status">Opening the review…</p>
	{/if}
</div>

{#if review}
	<div class="print-only">
		<WeeklySheet {review} {stepTitle} />
	</div>
{/if}

<style>
	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.week-nav {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1rem;
		align-items: center;
		margin-bottom: 1rem;
	}
	.rating {
		display: grid;
		grid-template-columns: 1fr 5.5rem;
		gap: 0.25rem 0.75rem;
		align-items: center;
		padding: 0.6rem 0;
		border-top: 1px solid var(--border);
	}
	.rating label {
		margin: 0;
	}
	.rating-note {
		grid-column: 1 / -1;
	}
	.percent {
		width: 7rem;
	}
	.decision {
		border: 0;
		border-top: 1px solid var(--border);
		padding: 0.5rem 0;
		margin: 0;
	}
	.decision legend {
		font-weight: 700;
		padding: 0.5rem 0 0.25rem;
	}
	.choice {
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0 0.9rem;
		font-weight: 500;
	}
	.suggest-h {
		margin-top: 1rem;
	}
	.between {
		justify-content: space-between;
	}
</style>
