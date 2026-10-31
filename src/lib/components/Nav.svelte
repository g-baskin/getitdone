<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { formatClock } from '../rules/timer.ts';
	import { focusTimer } from '../state/timer.svelte.ts';

	const links = [
		{ href: resolve('/'), label: 'Today' },
		{ href: resolve('/morning'), label: 'Morning' },
		{ href: resolve('/evening'), label: 'Evening' },
		{ href: resolve('/focus'), label: 'Focus' },
		{ href: resolve('/projects'), label: 'Projects' },
		{ href: resolve('/goal'), label: 'Goal' },
		{ href: resolve('/blockers'), label: 'Blockers & waiting' },
		{ href: resolve('/proof'), label: 'Proof Log' },
		{ href: resolve('/review'), label: 'Weekly review' },
		{ href: resolve('/settings'), label: 'Settings' }
	];

	const timerLabel = $derived(
		focusTimer.state.phase === 'focus'
			? `${formatClock(focusTimer.remaining)}${focusTimer.running ? '' : ' paused'}`
			: focusTimer.state.phase === 'reset' && focusTimer.remaining > 0
				? `reset ${formatClock(focusTimer.remaining)}`
				: ''
	);
</script>

<header class="app-header screen-only">
	<div class="bar">
		<a class="brand" href={resolve('/')}>Get It Done</a>
		{#if timerLabel}
			<a class="timer" href={resolve('/focus')}>Focus {timerLabel}</a>
		{/if}
	</div>
	<nav aria-label="Main">
		<ul>
			{#each links as link (link.href)}
				<li>
					<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}
						>{link.label}</a
					>
				</li>
			{/each}
		</ul>
	</nav>
</header>

<style>
	.app-header {
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		position: sticky;
		top: 0;
		z-index: 10;
	}
	.bar {
		max-width: 46rem;
		margin: 0 auto;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem 0;
	}
	.brand {
		font-weight: 800;
		font-size: 1.1rem;
		color: var(--text);
		text-decoration: none;
		min-height: var(--tap);
		display: inline-flex;
		align-items: center;
	}
	.timer {
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		background: var(--accent-soft);
		border-radius: 999px;
		padding: 0.35rem 0.8rem;
		text-decoration: none;
	}
	nav ul {
		max-width: 46rem;
		margin: 0 auto;
		list-style: none;
		display: flex;
		gap: 0.25rem;
		padding: 0 0.75rem 0.4rem;
		overflow-x: auto;
		scrollbar-width: thin;
	}
	nav a {
		display: inline-flex;
		align-items: center;
		min-height: var(--tap);
		padding: 0 0.7rem;
		border-radius: 999px;
		white-space: nowrap;
		color: var(--muted);
		text-decoration: none;
		font-weight: 600;
		font-size: 0.95rem;
	}
	nav a:hover {
		background: var(--accent-soft);
		color: var(--text);
	}
	nav a[aria-current='page'] {
		background: var(--accent);
		color: #fff;
	}
	@media (min-width: 52rem) {
		nav ul {
			flex-wrap: wrap;
			overflow: visible;
		}
	}
</style>
