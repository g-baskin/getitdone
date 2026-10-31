<script lang="ts">
	import WaitingCard from './WaitingCard.svelte';
	import WaitingForm from './WaitingForm.svelte';
	import type { WaitingDraft } from './drafts.ts';
	import { addWaiting } from '../db/repo.ts';
	import type { ISODate, WaitingItem } from '../types.ts';

	let {
		items,
		today,
		emptyText = 'Not waiting on anyone right now.'
	}: { items: WaitingItem[]; today: ISODate; emptyText?: string } = $props();

	let adding = $state(false);
	let status = $state('');

	async function add(draft: WaitingDraft) {
		await addWaiting(draft);
		status = `Added "${draft.what}".`;
		adding = false;
	}
</script>

{#if items.length}
	<ul class="items">
		{#each items as item (item.id)}
			<WaitingCard {item} {today} />
		{/each}
	</ul>
{:else}
	<p class="empty">{emptyText}</p>
{/if}
<p class="visually-hidden" role="status">{status}</p>
{#if adding}
	<div class="add">
		<h3>New waiting item</h3>
		<WaitingForm {today} onsave={add} oncancel={() => (adding = false)} />
	</div>
{:else}
	<button class="btn secondary small" type="button" onclick={() => (adding = true)}>
		Add something you're waiting on
	</button>
{/if}

<style>
	.add {
		border-top: 1px solid var(--border);
		padding-top: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
