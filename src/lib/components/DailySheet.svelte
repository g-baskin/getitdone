<script lang="ts">
	import { formatLong, formatMonthDay } from '../dates.ts';
	import { blockerTypeLabel } from '../rules/blockers.ts';
	import { isFollowUpDue } from '../rules/waiting.ts';
	import type { Blocker, DailyPage, ISODate, Project, WaitingItem } from '../types.ts';

	let {
		page,
		today,
		projects = [],
		blockers = [],
		waiting = [],
		linkLabel = ''
	}: {
		/** null prints the blank template. */
		page: DailyPage | null;
		today: ISODate;
		projects?: Project[];
		blockers?: Blocker[];
		waiting?: WaitingItem[];
		linkLabel?: string;
	} = $props();

	const MAX_ROWS = 4;
	const MIN_ROWS = 3;
	const minimum = $derived(page?.minimumDay ?? false);

	function rows<T>(items: T[]): (T | null)[] {
		const shown: (T | null)[] = items.slice(0, MAX_ROWS);
		while (shown.length < MIN_ROWS) shown.push(null);
		return shown;
	}

	const projectRows = $derived.by(() => {
		const out: (Project | null)[] = projects.slice(0, 3);
		while (out.length < 3) out.push(null);
		return out;
	});
	const blockerRows = $derived(rows(blockers));
	const waitingRows = $derived(rows(waiting));
	const focus = $derived(page?.energy.focusBlocks ?? 0);
	const circles = $derived(Math.max(4, Math.min(focus, 8)));
	const NOTE_LINES = Array.from({ length: 14 }, (_, i) => i);

	function projectNext(p: Project): string {
		return p.nextStep ? ` → ${p.nextStep}` : '';
	}

	function blockerNext(b: Blocker): string {
		if (!b.nextStep) return '';
		const label = b.type === 'fear' ? 'Brave step' : 'Next';
		return `${b.ifThenPlan ? ' ' : ''}${label}: ${b.nextStep}`;
	}
</script>

<article class="sheet" data-testid="daily-sheet" aria-label="Printable daily page">
	<header class="top">
		<div class="date">
			{#if page}{formatLong(page.date).toUpperCase()}{:else}<span class="fill w-date"></span>{/if}
		</div>
		{#if !minimum}
			<div class="word">
				<span class="lbl">Today's word</span>
				<span class="fill w-word">{page?.todaysWord ?? ''}</span>
			</div>
		{/if}
	</header>

	<section class="one">
		<div class="h">Today's one thing</div>
		<div class="one-row">
			<div class="one-text">{page?.oneThing.text ?? ''}</div>
			<span class="box big" aria-label="Done">{page?.oneThing.done ? '✓' : ''}</span>
		</div>
		{#if !minimum}
			{#if linkLabel}<div class="small">Moves forward: {linkLabel}</div>{/if}
			<div class="pair">
				<div class="line">
					<span class="lbl">Why it matters</span>
					<span class="fill grow clip">{page?.whyItMatters ?? ''}</span>
				</div>
				<div class="line">
					<span class="lbl">Who's counting on me</span>
					<span class="fill grow clip">{page?.whoIsCountingOnMe ?? ''}</span>
				</div>
			</div>
		{/if}
	</section>

	{#if !minimum}
		<section class="cols">
			<div>
				<div class="h">Working on (max 3)</div>
				<ol class="lines">
					{#each projectRows as project, i (i)}
						<li>
							<span class="n">{i + 1}.</span>
							<span class="fill grow clip">
								{#if project}<strong>{project.name}</strong>{projectNext(project)}{/if}
							</span>
						</li>
					{/each}
				</ol>
			</div>
			<div>
				<div class="h">What's important today (top 3)</div>
				<ol class="lines">
					{#each [0, 1, 2] as i (i)}
						<li>
							<span class="n">{i + 1}.</span>
							<span class="fill grow clip">{page?.important[i] ?? ''}</span>
						</li>
					{/each}
				</ol>
			</div>
		</section>

		<section>
			<div class="h">Blockers</div>
			<table>
				<colgroup><col class="c-what" /><col class="c-type" /><col class="c-plan" /></colgroup>
				<thead>
					<tr>
						<th scope="col">What / who</th>
						<th scope="col">Type</th>
						<th scope="col">If ___, then I'll ___</th>
					</tr>
				</thead>
				<tbody>
					{#each blockerRows as b, i (b?.id ?? `blank-${i}`)}
						<tr>
							<td
								><div class="clamp">
									{#if b}{b.what}<span class="muted">{b.who ? ` · ${b.who}` : ''}</span>{/if}
								</div></td
							>
							<td>{b ? blockerTypeLabel(b.type) : ''}</td>
							<td
								><div class="clamp">
									{#if b}{b.ifThenPlan}<span class="muted">{blockerNext(b)}</span>{/if}
								</div></td
							>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if blockers.length > MAX_ROWS}
				<div class="more">+ {blockers.length - MAX_ROWS} more on the Blockers screen</div>
			{/if}
		</section>

		<section>
			<div class="h">Waiting on</div>
			<table>
				<colgroup
					><col class="c-wwhat" /><col class="c-from" /><col class="c-date" /><col
						class="c-date"
					/></colgroup
				>
				<thead>
					<tr>
						<th scope="col">What</th>
						<th scope="col">From whom</th>
						<th scope="col">Since</th>
						<th scope="col">Follow up on</th>
					</tr>
				</thead>
				<tbody>
					{#each waitingRows as w, i (w?.id ?? `blank-${i}`)}
						{@const due = w ? isFollowUpDue(w, today) : false}
						<tr class:due>
							<td><div class="clamp one-line">{w?.what ?? ''}</div></td>
							<td><div class="clamp one-line">{w?.fromWhom ?? ''}</div></td>
							<td>{w ? formatMonthDay(w.since) : ''}</td>
							<td
								>{#if w}{formatMonthDay(w.followUpOn)}{#if due}&nbsp;▲ due{/if}{/if}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if waiting.length > MAX_ROWS}
				<div class="more">
					+ {waiting.length - MAX_ROWS} more on the Blockers and waiting screen
				</div>
			{/if}
		</section>

		<section class="energy">
			<span class="h inline">Energy</span>
			<span class="line"
				><span class="lbl">Sleep</span>
				<span class="fill w-num">{page?.energy.sleepHours ?? ''}</span> h</span
			>
			<span class="line"
				><span class="lbl">Moved</span>
				<span class="box">{page?.energy.moved ? '✓' : ''}</span></span
			>
			<span class="line">
				<span class="lbl">Focus blocks</span>
				{#each Array.from({ length: circles }, (_, i) => i) as i (i)}
					<span class="dot" class:on={i < focus}></span>
				{/each}
			</span>
		</section>
	{/if}

	<section class="tonight">
		<div class="h">Tonight</div>
		<div class="pair">
			<div class="line">
				<span class="lbl">Did the one thing?</span>
				<span class="box">{page?.evening.didOneThing ? '✓' : ''}</span>
			</div>
			<div class="line">
				<span class="lbl">Win</span> <span class="fill grow clip">{page?.evening.win ?? ''}</span>
			</div>
		</div>
		{#if !minimum}
			<div class="line">
				<span class="lbl">Lesson</span>
				<span class="fill grow clip">{page?.evening.lesson ?? ''}</span>
			</div>
			<div class="line">
				<span class="lbl">Tomorrow's one thing</span>
				<span class="fill grow clip">{page?.evening.tomorrowOneThing ?? ''}</span>
			</div>
		{/if}
	</section>

	<section class="notes">
		<div class="h">Notes</div>
		{#each NOTE_LINES as i (i)}<div class="note-line"></div>{/each}
	</section>
</article>

<style>
	/* Letter is 8.5 x 11in; with 0.5in margins the sheet gets 7.5 x 10in. Fixed height keeps it to one page. */
	.sheet {
		width: 7.5in;
		height: 9.9in;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 0.14in;
		font-family: var(--font);
		font-size: 10.5pt;
		line-height: 1.3;
		color: #000;
		background: #fff;
	}
	section {
		break-inside: avoid;
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 0.3in;
		border-bottom: 2px solid #000;
		padding-bottom: 0.06in;
	}
	.date {
		font-weight: 800;
		font-size: 13pt;
		letter-spacing: 0.04em;
	}
	.word {
		display: flex;
		align-items: flex-end;
		gap: 0.08in;
	}
	.h {
		font-size: 8.5pt;
		font-weight: 800;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin-bottom: 0.04in;
	}
	.h.inline {
		margin: 0 0.1in 0 0;
	}
	.lbl {
		font-size: 9pt;
		font-weight: 700;
		white-space: nowrap;
	}
	.small {
		font-size: 9pt;
	}
	.muted {
		color: #333;
	}
	.fill {
		display: inline-block;
		border-bottom: 1px solid #000;
		min-height: 1.25em;
		vertical-align: bottom;
	}
	.grow {
		flex: 1;
		min-width: 0;
	}
	.clip {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.w-date {
		width: 2.6in;
	}
	.w-word {
		width: 1.8in;
	}
	.w-num {
		width: 0.45in;
		text-align: center;
	}
	.line {
		display: flex;
		align-items: flex-end;
		gap: 0.08in;
		min-height: 0.28in;
		min-width: 0;
	}
	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.25in;
	}
	.one {
		border: 2px solid #000;
		border-radius: 6px;
		padding: 0.08in 0.12in 0.1in;
	}
	.one-row {
		display: flex;
		gap: 0.15in;
		align-items: flex-start;
	}
	.one-text {
		flex: 1;
		font-size: 17pt;
		font-weight: 800;
		line-height: 1.2;
		min-height: 2.4em;
		max-height: 2.4em;
		overflow: hidden;
		border-bottom: 1px solid #000;
		background-image: none;
	}
	.box {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 0.2in;
		height: 0.2in;
		border: 1.5px solid #000;
		font-weight: 800;
		flex: none;
	}
	.box.big {
		width: 0.32in;
		height: 0.32in;
		font-size: 14pt;
	}
	.cols {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.3in;
	}
	.lines {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.lines li {
		display: flex;
		align-items: flex-end;
		gap: 0.06in;
		height: 0.3in;
	}
	.n {
		font-weight: 700;
		width: 0.16in;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
	}
	th {
		text-align: left;
		font-size: 8.5pt;
		font-weight: 700;
		border-bottom: 1.5px solid #000;
		padding: 0.02in 0.05in;
	}
	td {
		border-bottom: 1px solid #000;
		padding: 0.03in 0.05in;
		height: 0.34in;
		vertical-align: top;
		font-size: 9.5pt;
	}
	.clamp {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.clamp.one-line {
		-webkit-line-clamp: 1;
		line-clamp: 1;
	}
	.c-what {
		width: 34%;
	}
	.c-type {
		width: 12%;
	}
	.c-wwhat {
		width: 42%;
	}
	.c-from {
		width: 28%;
	}
	.c-date {
		width: 15%;
	}
	tr.due td {
		font-weight: 800;
	}
	.more {
		font-size: 8.5pt;
		margin-top: 0.03in;
	}
	.energy {
		display: flex;
		align-items: flex-end;
		gap: 0.35in;
		border-top: 1.5px solid #000;
		border-bottom: 1.5px solid #000;
		padding: 0.06in 0;
	}
	.dot {
		display: inline-block;
		width: 0.17in;
		height: 0.17in;
		border: 1.5px solid #000;
		border-radius: 50%;
		margin-left: 0.03in;
	}
	/* Filled with a thick border so it shows even when background printing is off. */
	.dot.on {
		border-width: 0.085in;
	}
	.tonight .line {
		margin-top: 0.04in;
	}
	.notes {
		flex: 1;
		min-height: 0;
		overflow: hidden;
	}
	.note-line {
		height: 0.3in;
		border-bottom: 1px solid #999;
	}
</style>
