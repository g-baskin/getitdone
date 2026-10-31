import { liveQuery } from 'dexie';

/**
 * A reactive view of an IndexedDB query that updates when the data changes.
 * Dexie runs the query asynchronously, so reactive inputs must be read in `deps`.
 * Call during component setup.
 */
export function live<T>(querier: () => Promise<T> | T, initial: T, deps?: () => unknown) {
	let current = $state.raw(initial);
	let ready = $state(false);

	$effect(() => {
		deps?.();
		const sub = liveQuery(querier).subscribe({
			next: (value) => {
				current = value;
				ready = true;
			},
			error: (err: unknown) => console.error('Could not read local data', err)
		});
		return () => sub.unsubscribe();
	});

	return {
		get current() {
			return current;
		},
		get ready() {
			return ready;
		}
	};
}
