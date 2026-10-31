/** Small UI preferences kept in localStorage; reset clears these too. */
export const STORAGE_KEYS = {
	timer: 'getitdone:focus-timer',
	lastExport: 'getitdone:last-export'
} as const;

export function clearLocalKeys(): void {
	for (const key of Object.values(STORAGE_KEYS)) localStorage.removeItem(key);
}
