import { addDays, mondayOf } from '../dates.ts';
import { eveningWinId, stepCompletedText, stepWinId } from '../rules/proofLog.ts';
import type { AppData, ISODate } from '../types.ts';

/** Obviously fictional sample data, dated relative to `today`. Never real people or goals. */
export function buildDemoData(today: ISODate, now: Date = new Date()): AppData {
	const d = (n: number) => addDays(today, n);
	const stamp = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();
	const week = mondayOf(today);
	const yesterday = d(-1);

	return {
		goals: [
			{
				id: 'demo-goal',
				title: 'Open the Teleporting Teapot Shop on the Moon',
				deadline: d(60),
				why: 'Tea tastes better in low gravity.',
				active: true
			}
		],
		steps: [
			{
				id: 'demo-step-1',
				goalId: 'demo-goal',
				title: 'Find a crater with good foot traffic',
				status: 'done',
				order: 0
			},
			{
				id: 'demo-step-2',
				goalId: 'demo-goal',
				title: 'Train the robot barista',
				status: 'doing',
				targetDate: d(10),
				order: 1
			},
			{
				id: 'demo-step-3',
				goalId: 'demo-goal',
				title: 'Get a permit from the Lunar Council',
				status: 'todo',
				targetDate: d(25),
				order: 2
			},
			{
				id: 'demo-step-4',
				goalId: 'demo-goal',
				title: 'Design the floating menu',
				status: 'todo',
				order: 3
			},
			{
				id: 'demo-step-5',
				goalId: 'demo-goal',
				title: 'Host the grand opening',
				status: 'todo',
				targetDate: d(60),
				order: 4
			}
		],
		projects: [
			{
				id: 'demo-project-1',
				name: 'Robot barista training',
				status: 'active',
				nextStep: 'Teach it to ask "one lump or two?"',
				updatedAt: stamp(300)
			},
			{
				id: 'demo-project-2',
				name: 'Lunar Council permit',
				status: 'active',
				nextStep: 'Fill in form 42-B',
				updatedAt: stamp(200)
			},
			{
				id: 'demo-project-3',
				name: 'Floating menu',
				status: 'active',
				nextStep: 'Sketch three layouts',
				updatedAt: stamp(100)
			},
			{
				id: 'demo-project-4',
				name: 'Asteroid delivery service',
				status: 'parked',
				nextStep: 'Price out a small rocket',
				parkedReason: 'Wait until the shop is open.',
				updatedAt: stamp(400)
			}
		],
		pages: [
			{
				date: yesterday,
				oneThing: { text: "Pick the shop's paint color", projectId: 'demo-project-3', done: true },
				whyItMatters: 'The painters arrive on Monday.',
				whoIsCountingOnMe: 'The painting crew',
				todaysWord: 'Decisive',
				important: ['Call the crater landlord', 'Test the teapot hinge', ''],
				energy: { sleepHours: 7, moved: true, focusBlocks: 3 },
				evening: {
					didOneThing: true,
					win: 'Chose Nebula Teal for the walls',
					lesson: 'Small choices go faster with a time limit.',
					tomorrowOneThing: "Finish the robot barista's tea-pouring routine"
				},
				minimumDay: false
			},
			{
				date: today,
				oneThing: {
					text: "Finish the robot barista's tea-pouring routine",
					stepId: 'demo-step-2',
					done: false
				},
				whyItMatters: 'The grand opening depends on it.',
				whoIsCountingOnMe: 'Captain Crumpet and the shop crew',
				todaysWord: 'Steady',
				important: [
					'Reply to the Lunar Council',
					'Order 500 zero-gravity cups',
					'Water the space ferns'
				],
				energy: { sleepHours: 7.5, moved: true, focusBlocks: 2 },
				evening: {},
				minimumDay: false,
				yesterdayChoice: undefined
			}
		],
		blockers: [
			{
				id: 'demo-blocker-1',
				what: 'Permit form needs an official stamp',
				who: 'Lunar Council',
				type: 'decision',
				ifThenPlan: "If the stamp isn't ready by Wednesday, then I'll visit the council office.",
				nextStep: 'Email the clerk a polite reminder',
				createdOn: d(-3)
			},
			{
				id: 'demo-blocker-2',
				what: 'Nervous about pitching the menu to Professor Sprocket',
				who: 'Professor Sprocket',
				type: 'fear',
				ifThenPlan: "If I start putting it off, then I'll send a two-line email first.",
				nextStep: 'Write the first sentence of the pitch',
				createdOn: d(-1)
			},
			{
				id: 'demo-blocker-3',
				what: "Don't know how to calibrate the steam valve",
				type: 'skill',
				ifThenPlan: '',
				createdOn: today
			}
		],
		waiting: [
			{
				id: 'demo-waiting-1',
				what: 'the signed crater lease',
				fromWhom: 'Dr. Moonbeam',
				since: d(-9),
				followUpOn: d(-2),
				status: 'waiting'
			},
			{
				id: 'demo-waiting-2',
				what: 'zero-gravity cup samples',
				fromWhom: 'Galactic Cups Inc.',
				since: d(-4),
				followUpOn: d(3),
				status: 'waiting'
			},
			{
				id: 'demo-waiting-3',
				what: 'feedback on the menu sketches',
				fromWhom: 'Captain Crumpet',
				since: d(-1),
				followUpOn: d(1),
				status: 'waiting',
				notes: 'Asked in the shop group chat.'
			}
		],
		wins: [
			{
				id: eveningWinId(yesterday),
				date: yesterday,
				text: 'Chose Nebula Teal for the walls',
				source: 'evening'
			},
			{
				id: stepWinId('demo-step-1'),
				date: d(-5),
				text: stepCompletedText('Find a crater with good foot traffic'),
				source: 'step-completed'
			},
			{
				id: 'demo-win-1',
				date: d(-2),
				text: 'The robot barista said hello without beeping',
				source: 'manual'
			},
			{
				id: 'demo-win-2',
				date: d(-12),
				text: 'Wrote the first draft of the teapot catalogue',
				source: 'manual'
			}
		],
		reviews: [
			{
				weekOf: week,
				intentions: {
					self: 'Calm and focused, even when the rocket is late',
					people: 'Patient with the crew and quick to say thanks',
					skills: 'Steam valve repair and short, clear pitches',
					service: 'Make the first cup of moon tea feel special'
				},
				ratings: {
					clarity: { score: 8, note: 'The goal steps helped.' },
					energy: { score: 6, note: 'Two late nights fixing the teapot.' },
					drive: { score: 8 },
					output: { score: 7, note: 'Menu work slipped.' },
					impact: { score: 7 },
					courage: { score: 5, note: 'Still avoiding the pitch.' }
				},
				mainOutputPercent: 60,
				parkedDecisions: [
					{ projectId: 'demo-project-4', name: 'Asteroid delivery service', decision: 'keep' }
				],
				topWins: [
					'Chose Nebula Teal for the walls',
					'The robot barista said hello without beeping',
					'Found the perfect crater'
				],
				nextWeekFocus: 'Get the permit approved',
				nextWeekStepId: 'demo-step-3'
			}
		]
	};
}
