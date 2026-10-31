<script lang="ts">
	import BlockerList from '#lib/components/BlockerList.svelte';
	import WaitingList from '#lib/components/WaitingList.svelte';
	import { listOpenBlockers, listOpenWaiting } from '#lib/db/repo.ts';
	import { sortByAge, type AgeOrder } from '#lib/rules/carryOver.ts';
	import { isFollowUpDue } from '#lib/rules/waiting.ts';
	import { clock } from '#lib/state/clock.svelte.ts';
	import { live } from '#lib/state/live.svelte.ts';

	let order = $state<AgeOrder>('oldest');
	const today = $derived(clock.today);
	const blockers = live(
		() => listOpenBlockers(clock.today),
		[],
		() => clock.today
	);
	const waiting = live(() => listOpenWaiting(), []);
	const sortedBlockers = $derived(sortByAge(blockers.current, (b) => b.createdOn, order));
	const sortedWaiting = $derived(sortByAge(waiting.current, (w) => w.since, order));
	const dueCount = $derived(waiting.current.filter((w) => isFollowUpDue(w, today)).length);
</script>

<svelte:head><title>Blockers and waiting · Get It Done</title></svelte:head>

<h1>Blockers and waiting</h1>
<p class="muted">
	Everything still open, from every day. Items stay here until they're dealt with.
</p>

<div class="field sort">
	<label for="order">Sort by age</label>
	<select id="order" bind:value={order}>
		<option value="oldest">Oldest first</option>
		<option value="newest">Newest first</option>
	</select>
</div>

<section class="card" aria-labelledby="b-h">
	<h2 id="b-h">Blockers <span class="muted small">({blockers.current.length} open)</span></h2>
	<BlockerList blockers={sortedBlockers} {today} />
</section>

<section class="card" aria-labelledby="w-h">
	<h2 id="w-h">
		Waiting on <span class="muted small"
			>({waiting.current.length} open{dueCount ? `, ${dueCount} ready for a follow-up` : ''})</span
		>
	</h2>
	<WaitingList items={sortedWaiting} {today} />
</section>

<style>
	.sort {
		max-width: 16rem;
		margin-bottom: 1rem;
	}
</style>
