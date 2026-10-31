<script lang="ts">
	import { formatShort } from '#lib/dates.ts';
	import { db } from '#lib/db/db.ts';
	import { addManualWin, deleteWin } from '#lib/db/repo.ts';
	import { sortWinsNewestFirst, winSourceLabel } from '#lib/rules/proofLog.ts';
	import { clock } from '#lib/state/clock.svelte.ts';
	import { live } from '#lib/state/live.svelte.ts';
	import type { Win } from '#lib/types.ts';

	const wins = live(async () => sortWinsNewestFirst(await db.wins.toArray()), []);
	let text = $state('');
	let date = $state(clock.today);
	let error = $state('');
	let status = $state('');

	async function add(event: SubmitEvent) {
		event.preventDefault();
		const result = await addManualWin(date || clock.today, text);
		if (!result.ok) {
			error = result.error;
			return;
		}
		error = '';
		status = 'Added to your Proof Log.';
		text = '';
	}

	function remove(win: Win) {
		if (confirm(`Remove "${win.text}" from the Proof Log?`)) void deleteWin(win.id);
	}
</script>

<svelte:head><title>Proof Log · Get It Done</title></svelte:head>

<h1>Proof Log</h1>
<p class="muted">
	Real evidence that you get things done. Evening wins and finished big steps land here.
</p>

<form class="card" onsubmit={add} novalidate>
	<div class="grid-2">
		<div>
			<label for="win-text">Add a win</label>
			<input
				id="win-text"
				bind:value={text}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={error ? 'win-error' : undefined}
				autocomplete="off"
			/>
		</div>
		<div>
			<label for="win-date">Date</label>
			<input id="win-date" type="date" bind:value={date} max={clock.today} />
		</div>
	</div>
	{#if error}<p class="error" id="win-error">{error}</p>{/if}
	<div class="actions"><button class="btn" type="submit">Add win</button></div>
	<p class="small muted" role="status">{status}</p>
</form>

<section class="card" aria-labelledby="wins-h">
	<h2 id="wins-h">Wins <span class="muted small">({wins.current.length})</span></h2>
	{#if wins.current.length}
		<ul class="items">
			{#each wins.current as win (win.id)}
				<li class="win" data-testid="win">
					<div>
						<p class="win-text">{win.text}</p>
						<p class="muted small">
							{formatShort(win.date)} · <span class="tag">{winSourceLabel(win.source)}</span>
						</p>
					</div>
					<button class="btn quiet small" type="button" onclick={() => remove(win)}>
						Remove<span class="visually-hidden">: {win.text}</span>
					</button>
				</li>
			{/each}
		</ul>
	{:else if wins.ready}
		<p class="empty">Your first win will show up here. Small ones count.</p>
	{/if}
</section>

<style>
	.win {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: flex-start;
	}
	.win p {
		margin: 0;
	}
	.win-text {
		font-weight: 600;
	}
</style>
