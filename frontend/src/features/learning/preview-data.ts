import type { Lesson } from './model'

export const previewLessons: Lesson[] = [
  {
    id: 'sample-handoff', department: 'company', topic: 'Shift handoffs', title: 'A handoff the next shift can use',
    why: 'A clear handoff lets the next team start serving instead of reconstructing what happened.', minutes: 5,
    sections: [
      { heading: 'Leave the situation, not a story', body: 'Start with what changed during the shift: stock that is low, equipment that needs attention, a customer follow-up, or a promise someone made. Keep names and details only where the next shift needs them.' },
      { heading: 'Name the next action', body: 'For each open item, say what should happen next and who is taking it. A note like “cups are low” is less useful than “Sam will check the back stock before the morning rush.”' },
      { heading: 'Close the loop', body: 'The incoming lead should read the handoff, ask about anything unclear, and mark resolved items. Keep unresolved items visible until someone owns the next step.' },
    ],
    takeaways: ['Record changes while they are fresh.', 'Give every open item an owner and next action.', 'Confirm the next lead has seen the handoff.'],
    watchouts: ['Long notes that bury the one urgent issue.', 'Assuming a message was read because it was sent.'],
    quiz: [
      { question: 'Which note is more useful to the next shift?', options: ['“We had a busy afternoon.”', '“Oat milk is low; Avery will check back stock before opening.”', '“Someone should handle the supplies.”'], answer: 1, explanation: 'It states the issue, owner, and next action.' },
      { question: 'What should happen to an unresolved item?', options: ['Keep it visible until someone owns the next step.', 'Remove it at the end of the shift.', 'Wait for someone to ask about it.'], answer: 0, explanation: 'Open work needs a visible owner and follow-through.' },
      { question: 'What closes a handoff?', options: ['Sending the message.', 'Adding more detail.', 'The incoming lead reading and clarifying it.'], answer: 2, explanation: 'A handoff is complete when the next team can act on it.' },
    ],
    sources: [], createdAt: '2026-09-22T10:00:00.000Z',
  },
  {
    id: 'sample-campaign', department: 'marketing', topic: 'Campaign results', title: 'Read a campaign beyond the views',
    why: 'A post can look popular without bringing people into a store.', minutes: 4,
    sections: [
      { heading: 'Start with the goal', body: 'Before looking at the numbers, name what the campaign was meant to change. A launch announcement, a fundraiser, and a repeat-visit offer need different measures.' },
      { heading: 'Compare like with like', body: 'Record the dates, store locations, offer, and channel. Compare a campaign with a similar period and note anything unusual, such as a holiday or a store closure.' },
    ],
    takeaways: ['Write the goal before judging the results.', 'Track the action you wanted, not only views.', 'Note what you would test next.'],
    watchouts: ['Treating one post as proof of a trend.', 'Comparing different stores or weeks without context.'],
    quiz: [{ question: 'Which number best fits a repeat-visit offer?', options: ['Views alone', 'Offer redemptions and return visits', 'The number of colors in the artwork'], answer: 1, explanation: 'Measure the action the offer was meant to encourage.' }],
    sources: [], createdAt: '2026-09-23T10:00:00.000Z',
  },
  {
    id: 'sample-checklist', department: 'operations', topic: 'Opening routines', title: 'Make the opening checklist useful',
    why: 'A checklist should surface problems early, not become a box-ticking exercise.', minutes: 4,
    sections: [
      { heading: 'Check what matters', body: 'Work through the opening list in the order the station needs it. If something is missing or not ready, record the issue and who will resolve it instead of checking the box.' },
      { heading: 'Keep it current', body: 'When the team repeatedly skips or works around a step, bring it to the owner for review. The checklist should reflect how the store actually opens.' },
    ],
    takeaways: ['Record exceptions, not just completion.', 'Escalate anything that blocks opening.', 'Suggest changes when a step stops being useful.'],
    watchouts: ['Checking a step before it is complete.', 'Leaving an exception without an owner.'],
    quiz: [{ question: 'What should you do when an opening step cannot be completed?', options: ['Check it anyway.', 'Record the exception and owner.', 'Remove the step yourself.'], answer: 1, explanation: 'An exception is useful when it is visible and owned.' }],
    sources: [], createdAt: '2026-09-24T10:00:00.000Z',
  },
]
