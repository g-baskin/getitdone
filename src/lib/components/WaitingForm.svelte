<script lang="ts">
	import { addDays } from '../dates.ts';
	import type { ISODate } from '../types.ts';
	import type { WaitingDraft } from './drafts.ts';

	let {
		initial,
		today,
		submitLabel = 'Add waiting item',
		onsave,
		oncancel
	}: {
		initial?: WaitingDraft;
		today: ISODate;
		submitLabel?: string;
		onsave: (draft: WaitingDraft) => Promise<void> | void;
		oncancel?: () => void;
	} = $props();

	const id = $props.id();
	const start = () => ({
		what: initial?.what ?? '',
		fromWhom: initial?.fromWhom ?? '',
		since: initial?.since ?? today,
		followUpOn: initial?.followUpOn ?? addDays(today, 3),
		notes: initial?.notes ?? ''
	});
	let draft = $state(start());
	let errors = $state<{ what?: string; fromWhom?: string; dates?: string }>({});
	let firstInput: HTMLInputElement | undefined = $state();

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		errors = {
			what: draft.what.trim() ? undefined : 'Say what you are waiting for.',
			fromWhom: draft.fromWhom.trim() ? undefined : 'Say who it is coming from.',
			dates: draft.since && draft.followUpOn ? undefined : 'Pick both dates.'
		};
		if (errors.what || errors.fromWhom || errors.dates) {
			firstInput?.focus();
			return;
		}
		await onsave({
			what: draft.what.trim(),
			fromWhom: draft.fromWhom.trim(),
			since: draft.since,
			followUpOn: draft.followUpOn,
			notes: draft.notes.trim() || undefined
		});
		if (!initial) draft = start();
	}
</script>

<form onsubmit={submit} novalidate>
	<div class="grid-2">
		<div class="field">
			<label for="{id}-what">Waiting for</label>
			<input
				id="{id}-what"
				bind:this={firstInput}
				bind:value={draft.what}
				placeholder="the signed lease"
				aria-invalid={errors.what ? 'true' : undefined}
				aria-describedby={errors.what ? `${id}-what-error` : undefined}
				autocomplete="off"
			/>
			{#if errors.what}<p class="error" id="{id}-what-error">{errors.what}</p>{/if}
		</div>
		<div class="field">
			<label for="{id}-from">From whom</label>
			<input
				id="{id}-from"
				bind:value={draft.fromWhom}
				aria-invalid={errors.fromWhom ? 'true' : undefined}
				aria-describedby={errors.fromWhom ? `${id}-from-error` : undefined}
				autocomplete="off"
			/>
			{#if errors.fromWhom}<p class="error" id="{id}-from-error">{errors.fromWhom}</p>{/if}
		</div>
		<div class="field">
			<label for="{id}-since">Waiting since</label>
			<input id="{id}-since" type="date" bind:value={draft.since} max={today} />
		</div>
		<div class="field">
			<label for="{id}-follow">Follow up on</label>
			<input id="{id}-follow" type="date" bind:value={draft.followUpOn} />
		</div>
	</div>
	{#if errors.dates}<p class="error">{errors.dates}</p>{/if}
	<div class="field">
		<label for="{id}-notes">Notes <span class="hint">Optional</span></label>
		<input id="{id}-notes" bind:value={draft.notes} autocomplete="off" />
	</div>
	<div class="actions">
		<button class="btn" type="submit">{submitLabel}</button>
		{#if oncancel}<button class="btn quiet" type="button" onclick={oncancel}>Cancel</button>{/if}
	</div>
</form>
