<script lang="ts">
	import { addDays, formatLong, formatMonthDay } from '../dates.ts';
	import { INTENTION_LABELS, RATING_KEYS, RATING_LABELS } from '../rules/weekly.ts';
	import type { WeeklyReview } from '../types.ts';

	let { review, stepTitle = '' }: { review: WeeklyReview; stepTitle?: string } = $props();

	const intentionKeys = ['self', 'people', 'skills', 'service'] as const;
	const SCALE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	const parkedRows = $derived.by(() => {
		const out: (WeeklyReview['parkedDecisions'][number] | null)[] = review.parkedDecisions.slice(
			0,
			5
		);
		while (out.length < 3) out.push(null);
		return out;
	});
	const NOTE_LINES = Array.from({ length: 10 }, (_, i) => i);
</script>

<article class="sheet" data-testid="weekly-sheet" aria-label="Printable weekly review">
	<header class="top">
		<div class="title">WEEKLY REVIEW</div>
		<div class="week">
			Week of {formatLong(review.weekOf)} – {formatMonthDay(addDays(review.weekOf, 6))}
		</div>
	</header>

	<section>
		<div class="h">Who I want to be next week</div>
		<div class="grid">
			{#each intentionKeys as key (key)}
				<div class="line">
					<span class="lbl">{INTENTION_LABELS[key]}</span>
					<span class="fill grow clip">{review.intentions[key]}</span>
				</div>
			{/each}
		</div>
	</section>

	<section>
		<div class="h">How the week went (1 to 10)</div>
		<table>
			<colgroup><col class="c-area" /><col class="c-score" /><col /></colgroup>
			<thead>
				<tr><th scope="col">Area</th><th scope="col">Score</th><th scope="col">Note</th></tr>
			</thead>
			<tbody>
				{#each RATING_KEYS as key (key)}
					{@const r = review.ratings[key]}
					<tr>
						<td><strong>{RATING_LABELS[key].label}</strong></td>
						<td class="score">
							{#if r.score !== null}<strong>{r.score}</strong> / 10{:else}{#each SCALE as n (n)}<span
										class="num">{n}</span
									>{/each}{/if}
						</td>
						<td><div class="clip">{r.note ?? ''}</div></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<section class="line">
		<span class="h inline">Where the time went</span>
		<span>About</span>
		<span class="fill w-num">{review.mainOutputPercent ?? ''}</span>
		<span>% of my week went to my main output.</span>
	</section>

	<section>
		<div class="h">Parked projects</div>
		<table>
			<colgroup
				><col /><col class="c-choice" /><col class="c-choice" /><col class="c-choice" /></colgroup
			>
			<thead>
				<tr>
					<th scope="col">Project</th><th scope="col">Keep parked</th><th scope="col">Restart</th
					><th scope="col">Drop</th>
				</tr>
			</thead>
			<tbody>
				{#each parkedRows as row, i (row?.projectId ?? `blank-${i}`)}
					<tr>
						<td><div class="clip">{row?.name ?? ''}</div></td>
						{#each ['keep', 'restart', 'drop'] as const as choice (choice)}
							<td><span class="box">{row?.decision === choice ? '✓' : ''}</span></td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
		{#if review.parkedDecisions.length > 5}
			<div class="more">+ {review.parkedDecisions.length - 5} more in the app</div>
		{/if}
	</section>

	<section>
		<div class="h">Top 3 wins</div>
		<ol class="lines">
			{#each [0, 1, 2] as i (i)}
				<li>
					<span class="n">{i + 1}.</span><span class="fill grow clip">{review.topWins[i]}</span>
				</li>
			{/each}
		</ol>
	</section>

	<section>
		<div class="h">Next week</div>
		<div class="line">
			<span class="lbl">Main focus</span><span class="fill grow clip">{review.nextWeekFocus}</span>
		</div>
		<div class="line">
			<span class="lbl">The goal step it moves</span><span class="fill grow clip">{stepTitle}</span>
		</div>
	</section>

	<section class="notes">
		<div class="h">Notes</div>
		{#each NOTE_LINES as i (i)}<div class="note-line"></div>{/each}
	</section>
</article>

<style>
	.sheet {
		width: 7.5in;
		height: 9.9in;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 0.16in;
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
		border-bottom: 2px solid #000;
		padding-bottom: 0.06in;
	}
	.title {
		font-weight: 800;
		font-size: 14pt;
		letter-spacing: 0.06em;
	}
	.week {
		font-weight: 600;
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
	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.02in;
	}
	.line {
		display: flex;
		align-items: flex-end;
		gap: 0.08in;
		min-height: 0.3in;
		min-width: 0;
	}
	.fill {
		display: inline-block;
		border-bottom: 1px solid #000;
		min-height: 1.25em;
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
	.w-num {
		width: 0.5in;
		text-align: center;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
	}
	th {
		text-align: left;
		font-size: 8.5pt;
		border-bottom: 1.5px solid #000;
		padding: 0.02in 0.05in;
	}
	td {
		border-bottom: 1px solid #000;
		padding: 0.03in 0.05in;
		height: 0.3in;
		font-size: 9.5pt;
	}
	.c-area {
		width: 22%;
	}
	.c-score {
		width: 36%;
	}
	.c-choice {
		width: 14%;
	}
	.score .num {
		display: inline-block;
		width: 0.22in;
		text-align: center;
		font-size: 8.5pt;
	}
	.box {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 0.2in;
		height: 0.2in;
		border: 1.5px solid #000;
		font-weight: 800;
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
	.more {
		font-size: 8.5pt;
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
