<script lang="ts">
	import { resolve } from '$app/paths';
	import { loadDay, saveEvening } from '#lib/db/repo.ts';
	import { eveningFields, MINIMUM_DAY_NOTE } from '#lib/rules/minimumDay.ts';
	import { setOneThingDone } from '#lib/rules/pages.ts';
	import { clock } from '#lib/state/clock.svelte.ts';
	import type { DailyPage } from '#lib/types.ts';

	let page = $state<DailyPage | null>(null);
	let saved = $state(false);
	let saving = $state(false);

	const fields = $derived(new Set(eveningFields(page?.minimumDay ?? false)));
	const did = $derived(page?.evening.didOneThing);

	$effect(() => {
		loadDay(clock.today).then((d) => {
			page = d.page;
		});
	});

	function setDid(value: boolean) {
		if (!page) return;
		page = setOneThingDone(page, value);
		saved = false;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!page) return;
		saving = true;
		const snapshot = $state.snapshot(page);
		for (const key of ['win', 'lesson', 'tomorrowOneThing'] as const) {
			const v = snapshot.evening[key]?.trim();
			snapshot.evening[key] = v || undefined;
		}
		await saveEvening(snapshot.date, snapshot.evening, snapshot.evening.didOneThing);
		page = snapshot;
		saving = false;
		saved = true;
	}
</script>

<svelte:head><title>Evening · Get It Done</title></svelte:head>

<h1>Evening check-in</h1>
<p class="muted">About two minutes. Close the day, then let it go.</p>

{#if page}
	<form class="card" onsubmit={submit} oninput={() => (saved = false)} novalidate>
		{#if page.minimumDay}<p class="note">{MINIMUM_DAY_NOTE}</p>{/if}
		{#if page.oneThing.text}
			<p>Today's one thing: <strong>{page.oneThing.text}</strong></p>
		{/if}
		<fieldset>
			<legend class="label">Did the one thing happen?</legend>
			<div class="row">
				<label class="check choice">
					<input type="radio" name="did" checked={did === true} onchange={() => setDid(true)} />
					Yes
				</label>
				<label class="check choice">
					<input type="radio" name="did" checked={did === false} onchange={() => setDid(false)} />
					Not today
				</label>
			</div>
			{#if did === false}
				<p class="note">
					That's okay. Tomorrow morning you can carry it over, shrink it, or drop it.
				</p>
			{/if}
		</fieldset>

		{#if fields.has('win')}
			<div class="field">
				<label for="e-win"
					>One win from today <span class="hint">Big or small, it counts.</span></label
				>
				<input id="e-win" bind:value={page.evening.win} autocomplete="off" />
			</div>
		{/if}
		{#if fields.has('lesson')}
			<div class="field">
				<label for="e-lesson"
					>One lesson <span class="hint">What would you keep or change?</span></label
				>
				<input id="e-lesson" bind:value={page.evening.lesson} autocomplete="off" />
			</div>
		{/if}
		{#if fields.has('tomorrow')}
			<div class="field">
				<label for="e-tomorrow">
					Tomorrow's one thing <span class="hint"
						>Pencil it in. You can change it in the morning.</span
					>
				</label>
				<input id="e-tomorrow" bind:value={page.evening.tomorrowOneThing} autocomplete="off" />
			</div>
		{/if}
		<div class="actions">
			<button class="btn" type="submit" disabled={saving}>Save check-in</button>
			<a class="btn quiet" href={resolve('/')}>Back to today</a>
		</div>
		<p role="status" class="saved">
			{#if saved}
				Saved.{#if page.evening.win}
					Your win is in the <a href={resolve('/proof')}>Proof Log</a>.{/if} Rest well.
			{/if}
		</p>
	</form>
{:else}
	<p class="muted" role="status">Opening today's page…</p>
{/if}

<style>
	fieldset {
		border: 0;
		padding: 0;
		margin: 0 0 0.75rem;
	}
	.choice {
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0 1rem;
	}
	.saved {
		margin: 0.75rem 0 0;
		font-weight: 600;
	}
</style>
