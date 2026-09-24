export type ReportField = { key: string; label: string; kind: 'number' | 'money' | 'percent' | 'text' | 'notes'; required?: boolean }
export type ReportSection = { title: string; fields: ReportField[] }

const number = (key: string, label: string): ReportField => ({ key, label, kind: 'number' })
const money = (key: string, label: string): ReportField => ({ key, label, kind: 'money' })
const percent = (key: string, label: string): ReportField => ({ key, label, kind: 'percent' })
const text = (key: string, label: string): ReportField => ({ key, label, kind: 'text' })
const notes = (key: string, label: string): ReportField => ({ key, label, kind: 'notes' })
const group = (title: string, fields: ReportField[]): ReportSection => ({ title, fields })

const byDepartment: Record<string, ReportSection[]> = {
  operations: [
    group('Health of the month', [money('rev', 'Total revenue, all stores'), money('revPrev', 'Same figure last month'), number('txn', 'Transactions'), money('ticket', 'Average ticket'), percent('labourPct', 'Labor as % of sales'), number('satis', 'Average satisfaction out of 5'), percent('accuracy', 'Order accuracy')]),
    group('Store by store', [notes('revByStore', 'Revenue this month, one store per line'), notes('cmplByStore', 'Customer complaints, one store per line')]),
    group('People', [number('headcount', 'Headcount'), number('hires', 'New hires'), number('leavers', 'Departures'), percent('turnover', 'Turnover'), number('openRoles', 'Open positions'), percent('certFood', 'Food handler certification'), notes('trainingNote', 'Training done, and gaps')]),
    group('Safety and compliance', [number('incidents', 'Safety incidents'), number('nearMiss', 'Near misses logged'), text('inspections', 'Inspections passed / attempted'), number('citations', 'Outstanding citations'), notes('compNote', 'What happened, and what we corrected')]),
    group('Judgment', [text('bestStore', 'Best store this month, and why'), text('worstStore', 'Store needing most attention, and why')]),
  ],
  marketing: [
    group('Health of the month', [money('spend', 'Campaign spend'), money('attribRev', 'Marketing-influenced sales'), number('roi', 'Blended ROI (x)'), number('newcust', 'New customers'), money('cpa', 'Cost per new customer'), percent('retention', 'Returning customers')]),
    group('Audience', [number('igStart', 'Instagram at start'), number('igEnd', 'Instagram at end'), number('ttStart', 'TikTok at start'), number('ttEnd', 'TikTok at end'), number('fbStart', 'Facebook at start'), number('fbEnd', 'Facebook at end'), number('posts', 'Posts published'), number('engage', 'Average engagement per post')]),
    group('Reputation', [number('googleRating', 'Google rating'), number('googleNew', 'New Google reviews'), number('yelpRating', 'Yelp rating'), notes('negatives', 'Negative themes worth acting on')]),
    group('Campaigns and community', [notes('campaigns', 'Each campaign: goal, actual, redemptions'), text('fundraisers', 'Fundraisers: events, sales, donated'), notes('partners', 'Collaborations and ambassadors'), notes('keepkill', 'Keep or stop, with the reason')]),
  ],
  finance: [
    group('Health of the month', [money('revenue', 'Revenue'), percent('cogs', 'Cost of goods'), percent('labour', 'Labor'), percent('netPct', 'Net margin'), money('cash', 'Cash on hand'), money('unpaid', 'Invoices outstanding')]),
    group('Store by store', [notes('revByStore', 'Revenue, one store per line'), notes('profitByStore', 'Profit, one store per line')]),
    group('Watch list', [notes('variance', 'Biggest budget variances, and the cause'), notes('vendorPrice', 'Vendor price rises worth challenging'), notes('leaks', 'Money leaking: comps, waste, overtime, shrink')]),
  ],
  equipment_and_maintenance: [
    group('Health of the month', [number('wos', 'Work orders'), number('emergency', 'Emergency work orders'), number('response', 'Average response time (hours)'), number('downtime', 'Downtime hours'), percent('pmPct', 'Preventive maintenance completed'), money('spend', 'Repair and maintenance spend'), money('purchases', 'Equipment and supplies bought')]),
    group('Store by store', [notes('woByStore', 'Work orders, one store per line'), notes('costByStore', 'Spend, one store per line')]),
    group('Risk and backlog', [notes('warranties', 'Warranties and service contracts coming up'), notes('backlog', 'Deferred work: item, cost, risk, days open'), notes('recurring', 'Problems that keep coming back')]),
  ],
  it: [
    group('Health of the month', [percent('uptime', 'POS and network uptime'), number('tickets', 'IT issues raised'), percent('resolved', 'Resolved within a day'), number('outages', 'Outages that stopped ordering'), money('spend', 'Software and subscriptions this month'), number('devices', 'Devices in service')]),
    group('Store by store', [notes('issuesByStore', 'IT issues, one store per line')]),
    group('Access and risk', [notes('renewals', 'Renewals and expiries in the next 60 days'), notes('accessReview', 'Access reviewed: systems and removals'), notes('leavers', 'Leavers offboarded: accounts and devices'), notes('security', 'Security worries: passwords, cameras, backups, updates')]),
  ],
  research_and_development: [
    group('Health of the month', [number('launches', 'Items launched'), money('launchRev', 'Revenue from new items'), percent('margin', 'Average item margin'), money('costCup', 'Average cost per cup'), number('pipeline', 'Items in the pipeline')]),
    group('Launch results', [notes('byItem', 'Per item: units by store, actual margin, keep or cut'), text('best', 'Best launch, and why it worked'), notes('worst', 'Underperforming launch, and the diagnosis'), notes('next', 'Next launches: concept, stage, target date, projected margin')]),
  ],
  hr: [
    group('Health of the month', [number('headcount', 'Headcount'), number('hires', 'Hires'), number('leavers', 'Leavers'), percent('turnover', 'Turnover'), number('openRoles', 'Open roles'), number('timeToFill', 'Average days to fill a role'), percent('trainingPct', 'Required training completed')]),
    group('Store by store', [notes('openByStore', 'Open roles, one store per line')]),
    group('Risk', [notes('relations', 'Employee relations issues, and where they stand'), notes('wageHour', 'Wage and hour checks: breaks, overtime, timecard edits'), notes('policy', 'Policy updates and outstanding acknowledgements'), text('deadlines', 'Deadlines coming up')]),
  ],
  warehouse_and_spend: [
    group('Health of the month', [percent('shrinkPct', 'Shrink as % of stock'), money('wasteCost', 'Waste and spoilage cost'), percent('wastePct', 'Waste as % of cost of goods'), number('stockouts', 'Stock-outs'), number('deliveries', 'Deliveries made'), number('lateVendors', 'Late or short vendor deliveries')]),
    group('Store by store', [notes('stockoutsByStore', 'Stock-outs, one store per line')]),
    group('Patterns', [notes('topWaste', 'Most wasted items, and why'), notes('fixes', 'What we changed to cut waste'), notes('parLevels', 'Par levels that need adjusting')]),
  ],
  build_out: [
    group('Health of the month', [number('sites', 'Sites in progress'), percent('onTimePct', 'On-time against schedule'), money('spend', 'Build spend this month'), percent('budgetVar', 'Variance to budget'), number('changeOrders', 'Change orders raised')]),
    group('Each site', [notes('bySite', 'Per site: stage, target opening, spend vs budget, blocker'), notes('permits', 'Permits, inspections, COIs outstanding'), notes('risks', 'Risks to opening dates')]),
  ],
}

const executive = group('For the executive', [
  { ...notes('accomplish', 'What we accomplished'), required: true },
  notes('effort', 'Where the effort went this month'),
  { ...notes('improve', 'What needs improvement, and what we are doing about it'), required: true },
  notes('risk', 'Risks to money, legal, safety, or reputation'),
  notes('help', 'Decisions or help needed from leadership'),
  notes('actions', 'Action items: one per line with owner and due date'),
])

export function reportSchema(department: string): ReportSection[] {
  return [...(byDepartment[department] || []), executive]
}
