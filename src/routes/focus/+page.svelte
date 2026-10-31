<script lang="ts">
	import { loadDay } from '#lib/db/repo.ts';
	import { formatClock } from '#lib/rules/timer.ts';
	import { clock } from '#lib/state/clock.svelte.ts';
	import { focusTimer } from '#lib/state/timer.svelte.ts';

	let intention = $state(focusTimer.state.phase === 'idle' ? focusTimer.state.nextIntention : '');
	let nextIntention = $state('');
	let blocksToday = $state(0);
	let oneThing = $state('');

	const phase = $derived(focusTimer.state.phase);
	const remaining = $derived(focusTimer.remaining);
	const currentIntention = $derived(
		focusTimer.state.phase === 'focus' ? focusTimer.state.intention : ''
	);

	$effect(() => {
		// Re-read today's count whenever a block finishes or the day rolls over.
		void focusTimer.finishedCount;
		loadDay(clock.today).then((d) => {
			blocksToday = d.page.energy.focusBlocks;
			oneThing = d.page.oneThing.text;
		});
	});

	const announce = $derived(
		phase === 'reset'
			? 'Block finished and added to today. Time for a two-minute reset.'
			: phase === 'focus'
				? 'Focus block started.'
				: ''
	);

	$effect(() => {
		const label =
			phase === 'focus'
				? `${formatClock(remaining)} focus`
				: phase === 'reset' && remaining > 0
					? `${formatClock(remaining)} reset`
					: '';
		document.title = label ? `${label} · Get It Done` : 'Focus · Get It Done';
	});

	function start(event: SubmitEvent) {
		event.preventDefault();
		focusTimer.start(intention || oneThing);
	}

	function startNext(event: SubmitEvent) {
		event.preventDefault();
		focusTimer.start(nextIntention);
		nextIntention = '';
	}
</script>

<h1>Focus</h1>
<p class="muted">50 minutes on one thing, then a 2-minute reset.</p>
<p class="visually-hidden" aria-live="polite">{announce}</p>

<div class="card timer-card">
	{#if phase === 'idle'}
		<form onsubmit={start} novalidate>
			<label for="f-intention">What is this block for?</label>
			<input
				id="f-intention"
				bind:value={intention}
				placeholder={oneThing || 'Write the first page'}
				autocomplete="off"
			/>
			<div class="actions">
				<button class="btn" type="submit">Start 50 minutes</button>
			</div>
		</form>
	{:else if phase === 'focus'}
		<p class="label">Focus block</p>
		<div class="clock" role="timer" aria-live="off">{formatClock(remaining)}</div>
		{#if currentIntention}<p class="intention">For: {currentIntention}</p>{/if}
		<div class="actions">
			{#if focusTimer.running}
				<button class="btn secondary" type="button" onclick={() => focusTimer.pause()}>Pause</button
				>
			{:else}
				<button class="btn" type="button" onclick={() => focusTimer.resume()}>Resume</button>
			{/if}
			<button class="btn quiet" type="button" onclick={() => focusTimer.stop()}
				>Stop this block</button
			>
		</div>
		<p class="muted small">Stopping early is fine. Full blocks are added to today's count.</p>
	{:else}
		<p class="label">Reset</p>
		{#if remaining > 0}
			<div class="clock" role="timer" aria-live="off">{formatClock(remaining)}</div>
		{:else}
			<p class="ready">Reset done. Start when you're ready.</p>
		{/if}
		<ul class="reset-list">
			<li>Breathe slowly for a few breaths.</li>
			<li>Stand up, stretch, look at something far away.</li>
			<li>Then decide what the next block is for.</li>
		</ul>
		<form onsubmit={startNext} novalidate>
			<label for="f-next">What's the next block for?</label>
			<input id="f-next" bind:value={nextIntention} autocomplete="off" />
			<div class="actions">
				<button class="btn" type="submit">Start next block</button>
				<button class="btn quiet" type="button" onclick={() => focusTimer.stop(nextIntention)}>
					Done for now
				</button>
			</div>
		</form>
	{/if}
</div>

<p>Focus blocks today: <strong data-testid="blocks-today">{blocksToday}</strong></p>

<style>
	.timer-card {
		text-align: left;
	}
	.clock {
		font-size: clamp(3.5rem, 18vw, 6rem);
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		margin: 0.25rem 0 0.5rem;
	}
	.intention {
		font-size: 1.15rem;
		font-weight: 600;
	}
	.ready {
		font-size: 1.3rem;
		font-weight: 700;
	}
	.reset-list {
		padding-left: 1.25rem;
		margin: 0.5rem 0 1rem;
	}
	.reset-list li + li {
		margin-top: 0.25rem;
	}
</style>
