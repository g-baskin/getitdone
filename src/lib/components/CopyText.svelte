<script lang="ts">
	let { text, label = 'Copy' }: { text: string; label?: string } = $props();

	let status = $state('');
	let showFallback = $state(false);
	let area: HTMLTextAreaElement | undefined = $state();
	const id = $props.id();

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			status = 'Copied. Paste it wherever you talk to them.';
			showFallback = false;
		} catch {
			// Clipboard access needs https or localhost; fall back to selecting the text.
			showFallback = true;
			status = 'Select the text below and copy it.';
			queueMicrotask(() => area?.select());
		}
	}
</script>

<div class="copy">
	<button type="button" class="btn secondary small" onclick={copy}>{label}</button>
	<span class="muted small" role="status">{status}</span>
	{#if showFallback}
		<label class="visually-hidden" for="{id}-text">Message to copy</label>
		<textarea id="{id}-text" bind:this={area} readonly rows="3">{text}</textarea>
	{/if}
</div>

<style>
	.copy {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}
	textarea {
		flex-basis: 100%;
	}
</style>
