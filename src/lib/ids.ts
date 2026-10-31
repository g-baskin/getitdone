/** Random id. Uses getRandomValues so it also works on plain-http LAN addresses, unlike randomUUID. */
export function newId(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function nowStamp(now: Date = new Date()): string {
	return now.toISOString();
}
