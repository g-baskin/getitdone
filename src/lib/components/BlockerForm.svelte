<script lang="ts">
	import {
		BLOCKER_TYPES,
		blockerPrompts,
		blockerWhatError,
		IF_THEN_PLACEHOLDER,
		nextStepLabel
	} from '../rules/blockers.ts';
	import type { BlockerType } from '../types.ts';
	import type { BlockerDraft } from './drafts.ts';

	let {
		initial,
		submitLabel = 'Add blocker',
		onsave,
		oncancel
	}: {
		initial?: BlockerDraft;
		submitLabel?: string;
		onsave: (draft: BlockerDraft) => Promise<void> | void;
		oncancel?: () => void;
	} = $props();

	const id = $props.id();
	// The form edits its own copy; the saved item updates once the form is submitted.
	const start = () => ({
		what: initial?.what ?? '',
		who: initial?.who ?? '',
		type: initial?.type ?? ('person' as BlockerType),
		ifThenPlan: initial?.ifThenPlan ?? '',
		nextStep: initial?.nextStep ?? ''
	});
	let draft = $state(start());
	let error = $state<string | null>(null);
	let whatInput: HTMLInputElement | undefined = $state();

	const prompts = $derived(blockerPrompts(draft));

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		error = blockerWhatError(draft.what);
		if (error) {
			whatInput?.focus();
			return;
		}
		await onsave({
			what: draft.what.trim(),
			who: draft.who.trim() || undefined,
			type: draft.type,
			ifThenPlan: draft.ifThenPlan.trim(),
			nextStep: draft.nextStep.trim() || undefined
		});
		if (!initial) draft = start();
	}
</script>

<form class="blocker-form" onsubmit={submit} novalidate>
	<div class="grid-2">
		<div class="field">
			<label for="{id}-what">What's in the way?</label>
			<input
				id="{id}-what"
				bind:this={whatInput}
				bind:value={draft.what}
				aria-invalid={error ? 'true' : undefined}
				aria-describedby={error ? `${id}-what-error` : undefined}
				autocomplete="off"
			/>
			{#if error}<p class="error" id="{id}-what-error">{error}</p>{/if}
		</div>
		<div class="field">
			<label for="{id}-who">Who <span class="hint">Optional</span></label>
			<input id="{id}-who" bind:value={draft.who} autocomplete="off" />
		</div>
	</div>
	<div class="field">
		<label for="{id}-type">Type</label>
		<select id="{id}-type" bind:value={draft.type}>
			{#each BLOCKER_TYPES as t (t.value)}
				<option value={t.value}>{t.label}</option>
			{/each}
		</select>
	</div>
	<div class="field">
		<label for="{id}-plan">If-then plan</label>
		<textarea
			id="{id}-plan"
			bind:value={draft.ifThenPlan}
			placeholder={IF_THEN_PLACEHOLDER}
			rows="2"
			aria-describedby={prompts.plan ? `${id}-plan-prompt` : undefined}></textarea>
		{#if prompts.plan}<p class="prompt" id="{id}-plan-prompt">{prompts.plan}</p>{/if}
	</div>
	<div class="field">
		<label for="{id}-next">
			{prompts.fear ?? nextStepLabel(draft.type)}
			{#if !prompts.fear}<span class="hint">Optional</span>{/if}
		</label>
		<input id="{id}-next" bind:value={draft.nextStep} autocomplete="off" />
	</div>
	<div class="actions">
		<button class="btn" type="submit">{submitLabel}</button>
		{#if oncancel}<button class="btn quiet" type="button" onclick={oncancel}>Cancel</button>{/if}
	</div>
</form>
