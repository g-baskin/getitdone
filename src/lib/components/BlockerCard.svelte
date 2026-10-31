<script lang="ts">
	import BlockerForm from './BlockerForm.svelte';
	import type { BlockerDraft } from './drafts.ts';
	import { resolveBlocker, updateBlocker } from '../db/repo.ts';
	import {
		blockerAgeLabel,
		blockerPrompts,
		blockerTypeLabel,
		nextStepLabel
	} from '../rules/blockers.ts';
	import type { Blocker, ISODate } from '../types.ts';

	let { blocker, today }: { blocker: Blocker; today: ISODate } = $props();

	let editing = $state(false);
	const prompts = $derived(blockerPrompts(blocker));

	async function save(draft: BlockerDraft) {
		await updateBlocker(blocker.id, draft);
		editing = false;
	}
</script>

<li class="blocker" data-testid="blocker">
	{#if editing}
		<BlockerForm
			initial={blocker}
			submitLabel="Save blocker"
			onsave={save}
			oncancel={() => (editing = false)}
		/>
	{:else}
		<div class="head">
			<strong>{blocker.what}</strong>
			<span class="tag">{blockerTypeLabel(blocker.type)}</span>
		</div>
		<p class="muted small">
			{#if blocker.who}{blocker.who} ·
			{/if}{blockerAgeLabel(blocker, today)}
		</p>
		{#if blocker.ifThenPlan}
			<p class="plan">{blocker.ifThenPlan}</p>
		{:else}
			<p class="prompt">{prompts.plan}</p>
		{/if}
		{#if blocker.nextStep}
			<p class="small"><strong>{nextStepLabel(blocker.type)}:</strong> {blocker.nextStep}</p>
		{:else if prompts.fear}
			<p class="prompt">{prompts.fear}</p>
		{/if}
		<div class="row">
			<button class="btn secondary small" type="button" onclick={() => (editing = true)}>
				Edit<span class="visually-hidden">: {blocker.what}</span>
			</button>
			<button
				class="btn secondary small"
				type="button"
				onclick={() => resolveBlocker(blocker.id, today)}
			>
				Resolved<span class="visually-hidden">: {blocker.what}</span>
			</button>
		</div>
	{/if}
</li>

<style>
	.head {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
		justify-content: space-between;
	}
	.plan {
		margin: 0.25rem 0 0.4rem;
	}
	p {
		margin-bottom: 0.4rem;
	}
</style>
