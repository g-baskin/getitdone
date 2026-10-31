<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import Nav from '#lib/components/Nav.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a class="skip-link screen-only" href="#main">Skip to content</a>
<Nav />
<main id="main" class="page" tabindex="-1">
	{@render children()}
</main>

<style>
	.skip-link {
		position: absolute;
		left: 0.5rem;
		top: -3rem;
		background: var(--accent);
		color: #fff;
		padding: 0.6rem 1rem;
		border-radius: 8px;
		z-index: 20;
	}
	.skip-link:focus {
		top: 0.5rem;
	}
	main:focus {
		outline: none;
	}
</style>
