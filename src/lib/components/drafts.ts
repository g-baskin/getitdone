import type { Blocker, WaitingItem } from '../types.ts';

export type BlockerDraft = Pick<Blocker, 'what' | 'who' | 'type' | 'ifThenPlan' | 'nextStep'>;
export type WaitingDraft = Pick<
	WaitingItem,
	'what' | 'fromWhom' | 'since' | 'followUpOn' | 'notes'
>;
