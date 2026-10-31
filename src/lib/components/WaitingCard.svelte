<script lang="ts">
	import CopyText from './CopyText.svelte';
	import WaitingForm from './WaitingForm.svelte';
	import type { WaitingDraft } from './drafts.ts';
	import { formatShort } from '../dates.ts';
	import { setWaitingStatus, updateWaiting } from '../db/repo.ts';
	import {
		followUpMessage,
		isFollowUpDue,
		isFollowUpToday,
		waitingLabel
	} from '../rules/waiting.ts';
	import type { ISODate, WaitingItem } from '../types.ts';

	let { item, today }: { item: WaitingItem; today: ISODate } = $props();

	let editing = $state(false);
	const due = $derived(isFollowUpDue(item, today));
	const dueToday = $derived(isFollowUpToday(item, today));

	async function save(draft: WaitingDraft) {
		await updateWaiting(item.id, draft);
		editing = false;
	}
</script>

<li class:overdue={due && !editing} data-testid="waiting" data-overdue={due ? 'true' : undefined}>
	{#if editing}
		<WaitingForm
			initial={item}
			{today}
			submitLabel="Save"
			onsave={save}
			oncancel={() => (editing = false)}
		/>
	{:else}
		<div class="head">
			<strong>{item.what}</strong>
			<span class="muted small">from {item.fromWhom}</span>
		</div>
		<p class="small">
			{waitingLabel(item, today)} · follow up {formatShort(item.followUpOn)}
			{#if due}<strong> · time to follow up</strong>{:else if dueToday}<strong>
					· follow-up day</strong
				>{/if}
		</p>
		{#if item.notes}<p class="small muted">{item.notes}</p>{/if}
		{#if due}
			<p class="message small">{followUpMessage(item)}</p>
			<CopyText text={followUpMessage(item)} label="Copy follow-up message" />
		{/if}
		<div class="row buttons">
			<button class="btn secondary small" type="button" onclick={() => (editing = true)}>
				Edit<span class="visually-hidden">: {item.what}</span>
			</button>
			<button
				class="btn secondary small"
				type="button"
				onclick={() => setWaitingStatus(item.id, 'received')}
			>
				Received<span class="visually-hidden">: {item.what}</span>
			</button>
			<button
				class="btn quiet small"
				type="button"
				onclick={() => setWaitingStatus(item.id, 'dropped')}
			>
				Drop<span class="visually-hidden">: {item.what}</span>
			</button>
		</div>
	{/if}
</li>

<style>
	.head {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.5rem;
		align-items: baseline;
	}
	p {
		margin: 0.25rem 0;
	}
	.message {
		font-style: italic;
	}
	.buttons {
		margin-top: 0.5rem;
	}
</style>
