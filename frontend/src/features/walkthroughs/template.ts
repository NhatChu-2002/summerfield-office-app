export type CheckItem = { label: string; hint: string; headOffice?: boolean }
export type CheckLane = { id: string; name: string; owner: string; max: number; items: CheckItem[]; driveThru?: boolean }

const item = (label: string, hint: string, headOffice = false): CheckItem => ({ label, hint, headOffice })

export const lanes: CheckLane[] = [
  { id: 'ops', name: 'Operations and hospitality', owner: 'Operations', max: 35, items: [
    item('Greeting - "Hello, Summerfield got you"', 'Within a few seconds, unprompted. Watch three guests.'),
    item('Asked "Will you be ordering any food?"', 'Before the drink order is taken.'),
    item('Food upsold during the order', 'During the order, not once at the end.'),
    item('Loyalty ask at the close', 'Ask about the mobile app before payment.'),
    item('Order repeated back', 'Every order.'),
    item('Receipt given without being asked', 'Every order.'),
    item('Uniform, name tag and grooming', 'Check everyone on shift.'),
    item('Labor deployed to the daypart', 'Check the floor, not just the schedule.'),
    item('Ticket time at the build station', 'Time five orders in the busiest ten minutes.'),
    item('Checklist tasks actually done', 'Physically verify three tasks.'),
    item('Counter and condiment station', 'Stocked and clean.'),
    item('Back of house and dry store', 'Include storage and mop sink.'),
    item('Cash and void discipline', 'Every void has a reason and a name.'),
    item("Crew knows the store's numbers", 'Ask a crew member about their ticket target.'),
    item("Manager's reporting current", 'Daily and weekly reports filed.'),
    item('Open items from the last visit', 'Escalate anything still open.', true),
  ] },
  { id: 'kiosk', name: 'Kiosk and ordering technology', owner: 'Operations / IT', max: 8, items: [
    item('Kiosk powered, responsive, card reader working', 'Test tap, chip, and swipe.'),
    item('Upsell prompts appearing', 'Test every order path.'),
    item('Gift card function working', 'Run a test transaction.', true),
    item('Loyalty sign-in and scan working', 'Test phone number and app scan.', true),
    item('Kiosk screen and surround clean', 'Check screen, reader, base, and floor.'),
  ] },
  { id: 'rd', name: 'Product', owner: 'R&D', max: 22, items: [
    item('Three drinks measured against spec', 'Check tea, milk, syrup, ice, and topping.'),
    item('Boba texture and time since cooked', 'Check the hold window.'),
    item('Tea freshness and brew discipline', 'Taste and check brew time.'),
    item('Prep pars and rotation', "Check against today's forecast."),
    item('New items built as trained', 'Check the latest deployment.'),
    item('Order accuracy and packaging', 'Check contents, seal, and travel.'),
    item('Temperature at hand-off', 'Check hot, cold, and ice ratio.'),
    item('Smoothie and blended texture', 'Check for graininess.'),
    item('Is the spec executable here, at peak?', 'Record any spec problem for R&D.', true),
  ] },
  { id: 'eq', name: 'Equipment', owner: 'Equipment', max: 20, items: [
    item('Sealer installed and aligned correctly', 'Check level, seating, and film tracking.', true),
    item('Sealer cleaned to schedule', 'Check film path, roller, blade, and tray.'),
    item('Seal test - pull three and invert', 'Invert each for ten seconds.'),
    item('Ice machine interior cleanliness', 'Check bin and deflector.'),
    item('Ice machine filter change date', 'Check the written date.', true),
    item('Brewer and fridge temperatures', 'Verify with your own probe.'),
    item('All equipment wiped down', 'Include under and behind.'),
    item('Chemicals off the floor and labelled', 'No unmarked bottles.'),
    item('Cleaning tools stored properly', 'Mops hung, brushes racked, buckets emptied.'),
    item('Preventive maintenance current', 'Record overdue items.', true),
    item('Anything broken, and the workaround', 'Record the actual crew workaround.', true),
    item('Safety walk', 'Check guards, wiring, floors, and panels.'),
  ] },
  { id: 'mkt', name: 'Marketing and presentation', owner: 'Marketing', max: 15, items: [
    item('Current promo live and correct', 'Remove expired material.', true),
    item('Menu boards and pricing', 'Check top ten items against POS.'),
    item('Loyalty being asked for at the counter', 'Observe the guest interaction.'),
    item('Exterior, windows, queue and seating', 'View it from the sidewalk.'),
    item('Branding on cups, seals and bags', 'Check every item leaving the store.'),
    item('Signage and fixtures in good repair', 'Record damage separately from dirt.', true),
    item('Delivery order placed to this visit', 'Check packaging, seal, temperature, accuracy.', true),
  ] },
  { id: 'dt', name: 'Drive-thru', owner: 'Operations', max: 15, driveThru: true, items: [
    item('Greeting at the speaker - "Hello, Summerfield got you"', 'Clear and friendly within a few seconds.'),
    item('Asked "Will you be ordering any food?"', 'Before the drink order.'),
    item('Food upsold at the speaker', 'Observe the lane order.'),
    item('Order repeated back', 'Before the total.'),
    item('Loyalty ask at the window', 'Before payment.'),
    item('Order accuracy at the window', 'Include modifications.'),
    item('Hand-off quality', 'Bag, drinks, straws, and napkins.'),
    item('Lane menu board and signage', 'Clean, lit, and current.'),
    item('Lane cleanliness and safety', 'Check clearance, surface, and spills.'),
  ] },
]

export const safetyItems: CheckItem[] = [
  item('Handwash sinks stocked and reachable', 'Soap, towels, hot water, and access.'),
  item('Cold holding at or below 41 F', 'Verify with your own probe.'),
  item('Nothing past its use-by in service', 'Check line and fridges.'),
  item('No cross-contamination risk', 'Separate raw and ready-to-eat.'),
  item('Chemicals stored away from product and labelled', 'No unmarked bottles.'),
  item('Certified food handler on shift', 'Check cards and dates.'),
  item('Everything six inches off the ground', 'Check shelving, boxes, buckets, and sacks.'),
  item('Bottoms and crevices clean', 'Look under and behind equipment.'),
  item('No staff food or drinks in the work area', 'Check the prep line.'),
  item('Staff can answer the health questions', 'Ask two crew members and record their names and answers.'),
]

export const healthQuestions = [
  'What temperature do we hold cold product at, and how do you check it?',
  'How long can product sit out before it has to be thrown away?',
  'When do you have to wash your hands? Name at least four times.',
  'What is the sanitiser concentration, and how do you test it?',
  'How often do the sanitiser buckets get changed?',
  'What do you do if you cut yourself while working?',
  'Where is the thermometer, and how do you calibrate it?',
  'What do you do if a delivery arrives warm?',
  'How long is cooked boba good for, and where is that written down?',
  'Who do you call if the fridge is reading too high?',
]

export const teamNotes = [
  ['ops', 'Operations'], ['rd', 'R&D'], ['eq', 'Equipment'], ['mkt', 'Marketing'], ['hq', 'Facilities / head office'],
] as const

export const activeLanes = (hasDriveThru: boolean) => lanes.filter((lane) => !lane.driveThru || hasDriveThru)
