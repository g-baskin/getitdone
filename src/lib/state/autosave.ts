/** Debounces a save; `flush` runs a pending save right away (e.g. when leaving the page). */
export function debounced(fn: () => Promise<void> | void, ms = 400) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	const run = () => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			timer = undefined;
			void fn();
		}, ms);
	};
	run.flush = () => {
		if (timer === undefined) return;
		clearTimeout(timer);
		timer = undefined;
		void fn();
	};
	return run;
}
