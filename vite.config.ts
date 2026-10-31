import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// Defence in depth for "data stays local": the browser itself refuses any outside request.
			csp: {
				mode: 'hash',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self'],
					'img-src': ['self', 'data:', 'blob:'],
					'font-src': ['self'],
					'connect-src': ['self'],
					'manifest-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self']
				}
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		include: ['src/**/*.test.ts'],
		environment: 'node',
		setupFiles: ['fake-indexeddb/auto']
	}
});
