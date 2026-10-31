<script lang="ts">
	import { onMount } from 'svelte';
	import { formatShort, toISODate } from '#lib/dates.ts';
	import {
		backupFileName,
		exportBackup,
		importData,
		isDatabaseEmpty,
		isResetConfirmed,
		parseBackup,
		resetAllData,
		RESET_CONFIRM_WORD,
		serializeBackup,
		type Backup
	} from '#lib/db/backup.ts';
	import { buildDemoData } from '#lib/db/demo.ts';
	import { clock } from '#lib/state/clock.svelte.ts';
	import { clearLocalKeys, STORAGE_KEYS } from '#lib/state/storageKeys.ts';
	import { TABLE_NAMES, type TableName } from '#lib/types.ts';

	const TABLE_LABELS: Record<TableName, string> = {
		goals: 'goals',
		steps: 'big steps',
		projects: 'projects',
		pages: 'daily pages',
		blockers: 'blockers',
		waiting: 'waiting items',
		wins: 'wins',
		reviews: 'weekly reviews'
	};

	let lastExport = $state<string | null>(null);
	let exportStatus = $state('');
	// Raw (not proxied): IndexedDB can't store Svelte's deep-state proxies.
	let pending = $state.raw<{
		backup: Backup;
		counts: Record<TableName, number>;
		name: string;
	} | null>(null);
	let importError = $state('');
	let importStatus = $state('');
	let fileInput: HTMLInputElement | undefined = $state();
	let empty = $state<boolean | null>(null);
	let demoStatus = $state('');
	let persisted = $state<boolean | null>(null);
	let typed = $state('');
	let resetStatus = $state('');

	const canReset = $derived(isResetConfirmed(typed));

	onMount(() => {
		lastExport = localStorage.getItem(STORAGE_KEYS.lastExport);
		void refreshEmpty();
		void navigator.storage?.persisted?.().then((p) => (persisted = p));
	});

	async function refreshEmpty() {
		empty = await isDatabaseEmpty();
	}

	async function download() {
		const backup = await exportBackup();
		const blob = new Blob([serializeBackup(backup)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = backupFileName(clock.today);
		document.body.append(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		lastExport = toISODate(new Date());
		localStorage.setItem(STORAGE_KEYS.lastExport, lastExport);
		exportStatus = 'Backup downloaded. Keep it somewhere safe, outside this browser.';
	}

	async function chooseFile(event: Event) {
		importError = '';
		importStatus = '';
		pending = null;
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		const result = parseBackup(await file.text());
		if (!result.ok) {
			importError = result.error;
			return;
		}
		pending = { backup: result.backup, counts: result.counts, name: file.name };
	}

	async function confirmImport() {
		if (!pending) return;
		try {
			await importData(pending.backup.data);
			importStatus = `Restored from ${pending.name}.`;
			pending = null;
			if (fileInput) fileInput.value = '';
			await refreshEmpty();
		} catch (e) {
			importError = e instanceof Error ? e.message : 'The backup could not be restored.';
		}
	}

	async function loadDemo() {
		if (!(await isDatabaseEmpty())) {
			demoStatus = 'Demo data only goes into an empty app.';
			return;
		}
		await importData(buildDemoData(clock.today));
		demoStatus = 'Demo data loaded. Everything in it is made up.';
		await refreshEmpty();
	}

	async function askPersist() {
		persisted = (await navigator.storage?.persist?.()) ?? false;
	}

	async function reset(event: SubmitEvent) {
		event.preventDefault();
		if (!canReset) return;
		await resetAllData(typed);
		clearLocalKeys();
		lastExport = null;
		typed = '';
		resetStatus = 'All data erased. The app is empty again.';
		await refreshEmpty();
	}
</script>

<svelte:head><title>Settings · Get It Done</title></svelte:head>

<h1>Settings</h1>

<section class="card" aria-labelledby="data-h">
	<h2 id="data-h">Where your data lives</h2>
	<p>
		Everything you enter stays in this browser on this device. Nothing is sent anywhere: no account,
		no sync, no tracking. Clearing this site's data in your browser settings erases it, so keep a
		backup.
	</p>
	{#if persisted === true}
		<p class="small muted">
			This browser has agreed to keep your data unless you clear it yourself.
		</p>
	{:else if persisted === false}
		<p class="small muted">The browser may clear data from sites you rarely visit.</p>
		<button class="btn secondary small" type="button" onclick={askPersist}>
			Ask the browser to keep my data
		</button>
	{/if}
</section>

<section class="card" aria-labelledby="export-h">
	<h2 id="export-h">Back up</h2>
	<p>Download everything as one JSON file.</p>
	<p class="small muted">
		Last backup from this browser: {lastExport ? formatShort(lastExport) : 'none yet'}
	</p>
	<button class="btn" type="button" onclick={download}>Download backup</button>
	<p class="small" role="status">{exportStatus}</p>
</section>

<section class="card" aria-labelledby="import-h">
	<h2 id="import-h">Restore from a backup</h2>
	<p>Restoring replaces everything currently in the app with the backup.</p>
	<label for="import-file">Backup file (.json)</label>
	<input
		id="import-file"
		type="file"
		accept="application/json,.json"
		bind:this={fileInput}
		onchange={chooseFile}
		aria-describedby={importError ? 'import-error' : undefined}
	/>
	{#if importError}<p class="error" id="import-error" role="alert">{importError}</p>{/if}
	{#if pending}
		<div class="note" data-testid="import-preview">
			<p>
				<strong>{pending.name}</strong>{#if pending.backup.exportedAt}, saved {formatShort(
						toISODate(new Date(pending.backup.exportedAt))
					)}{/if}, contains:
			</p>
			<ul>
				{#each TABLE_NAMES as t (t)}
					<li>{pending.counts[t]} {TABLE_LABELS[t]}</li>
				{/each}
			</ul>
			<div class="actions">
				<button class="btn" type="button" onclick={confirmImport}>
					Replace my data with this backup
				</button>
				<button class="btn quiet" type="button" onclick={() => (pending = null)}>Cancel</button>
			</div>
		</div>
	{/if}
	<p class="small" role="status">{importStatus}</p>
</section>

<section class="card" aria-labelledby="demo-h">
	<h2 id="demo-h">Try it with demo data</h2>
	<p>
		Fills an empty app with a made-up example (a teapot shop on the Moon) so you can look around.
	</p>
	<button class="btn secondary" type="button" onclick={loadDemo} disabled={empty === false}>
		Load demo data
	</button>
	{#if empty === false && !demoStatus}
		<p class="small muted">Available when the app is empty.</p>
	{/if}
	<p class="small" role="status">{demoStatus}</p>
</section>

<section class="card danger-zone" aria-labelledby="reset-h">
	<h2 id="reset-h">Erase everything</h2>
	<p>This deletes every page, project, goal and win in this browser. Download a backup first.</p>
	<form onsubmit={reset} novalidate>
		<label for="reset-confirm">Type {RESET_CONFIRM_WORD} to confirm</label>
		<input id="reset-confirm" bind:value={typed} autocomplete="off" spellcheck="false" />
		<div class="actions">
			<button class="btn danger" type="submit" disabled={!canReset}>Erase all data</button>
		</div>
	</form>
	<p class="small" role="status">{resetStatus}</p>
</section>

<style>
	.danger-zone {
		border-color: #e3b4b4;
	}
	.note ul {
		margin: 0.25rem 0 0;
		padding-left: 1.25rem;
	}
	input[type='file'] {
		display: block;
		min-height: var(--tap);
		margin-bottom: 0.5rem;
	}
</style>
