<script lang="ts">
	import BlockerCard from './BlockerCard.svelte';
	import BlockerForm from './BlockerForm.svelte';
	import type { BlockerDraft } from './drafts.ts';
	import { addBlocker } from '../db/repo.ts';
	import type { Blocker, ISODate } from '../types.ts';

	let {
		blockers,
		today,
		emptyText = 'Nothing in the way right now.'
	}: { blockers: Blocker[]; today: ISODate; emptyText?: string } = $props();

	let adding = $state(false);
	let status = $state('');

	async function add(draft: BlockerDraft) {
		await addBlocker({ ...draft, createdOn: today });
		status = `Added "${draft.what}". It stays on your page until it's resolved.`;
		adding = false;
	}
</script>

{#if blockers.length}
	<ul class="items">
		{#each blockers as blocker (blocker.id)}
			<BlockerCard {blocker} {today} />
		{/each}
	</ul>
{:else}
	<p class="empty">{emptyText}</p>
{/if}
<p class="visually-hidden" role="status">{status}</p>
{#if adding}
	<div class="add">
		<h3>New blocker</h3>
		<BlockerForm onsave={add} oncancel={() => (adding = false)} />
	</div>
{:else}
	<button class="btn secondary small" type="button" onclick={() => (adding = true)}>
		Add a blocker
	</button>
{/if}

<style>
	.add {
		border-top: 1px solid var(--border);
		padding-top: 0.75rem;
		margin-top: 0.5rem;
	}
</style>
