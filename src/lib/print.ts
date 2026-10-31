import { tick } from 'svelte';

/** Opens the browser's print dialog ("Save as PDF" lives there too) after the sheet has rendered. */
export async function printNow(): Promise<void> {
	await tick();
	window.print();
}
