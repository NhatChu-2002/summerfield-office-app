import { useState, type KeyboardEvent } from 'react'
import { companyDepartment, departmentStyle, type ReferenceDepartment } from '@/shared/config/reference-departments'
import { DecisionDialog } from '../components/DecisionDialog'
import { decisionAnswer, decisionGroups, parseDecisionLimit, type DecisionRule, type Person } from '../model'
import './ownership.css'

type View = 'me' | 'all'

export function DecisionChartPage({ departments, people, currentUser, rules, preview, onRulesChange }: {
  departments: ReferenceDepartment[]
  people: Person[]
  currentUser: string
  rules: DecisionRule[]
  preview: boolean
  onRulesChange?: (rules: DecisionRule[]) => void
}) {
  const [view, setView] = useState<View>('me')
  const [query, setQuery] = useState('')
  const [amount, setAmount] = useState('')
  const [group, setGroup] = useState('')
  const [editor, setEditor] = useState<string | null>(null)
  const allDepartments = [companyDepartment, ...departments.filter((item) => item.code !== 'company')]
  const byCode = (code: string) => allDepartments.find((item) => item.code === code) || companyDepartment
  const personName = (id: string) => people.find((person) => person.id === id)?.name || 'Not set'
  const answer = query.trim() ? decisionAnswer(rules, query, amount) : null
  const mine = rules.filter((rule) => rule.decider === currentUser)
  const others = rules.filter((rule) => rule.decider && rule.decider !== currentUser)
  const unassigned = rules.filter((rule) => !rule.decider)
  const shownGroups = [...decisionGroups, ...rules.map((rule) => rule.group).filter((item) => !decisionGroups.includes(item))].filter((item, index, list) => list.indexOf(item) === index && rules.some((rule) => rule.group === item))
  const shown = rules.filter((rule) => !group || rule.group === group).sort((a, b) => a.decision.localeCompare(b.decision))
  const selectedRule = rules.find((rule) => rule.id === editor)

  function tabKeys(event: KeyboardEvent<HTMLDivElement>) {
    const next = event.key === 'ArrowRight' || event.key === 'ArrowLeft' ? (view === 'me' ? 1 : 0)
      : event.key === 'Home' ? 0 : event.key === 'End' ? 1 : -1
    if (next < 0) return
    event.preventDefault()
    setView(next === 0 ? 'me' : 'all')
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }
  function saveRule(rule: DecisionRule) {
    onRulesChange?.(selectedRule ? rules.map((item) => item.id === rule.id ? rule : item) : [...rules, rule])
    setEditor(null)
  }

  return <>
    <header className="vy-hero vy-own-hero"><div><h1>Decision chart</h1><p>Ask it a question. It tells you whether it is yours to call, and who signs off if it is not.</p></div>
      <div className="vy-hero-actions"><button type="button" className="vy-button" disabled={!preview} title={preview ? undefined : 'Shared decision editing is not connected yet'} onClick={() => setEditor('new')}>Add a decision</button><a className="vy-button" href="#/ask">Who to ask</a></div></header>
    {!preview && <p className="vy-own-status">The shared decision chart is not connected yet. No live authority or approval limit is shown here.</p>}
    {preview && <p className="vy-own-status">Sample design data. Edits stay in this preview until you reload.</p>}
    <section className="vy-decision-question" aria-labelledby="vy-decision-question-title"><h2 id="vy-decision-question-title">Can I decide this?</h2><p>Type it the way you would say it out loud.</p>
      <div className="vy-decision-fields"><input type="search" aria-label="Decision question" value={query} onChange={(event) => setQuery(event.target.value)} disabled={!preview} title={preview ? undefined : 'Live decision lookup is not connected yet'} placeholder="e.g. replace a broken blender, comp a drink, hire someone" /><input type="text" inputMode="decimal" aria-label="Amount, if any" value={amount} onChange={(event) => setAmount(event.target.value)} disabled={!preview} title={preview ? undefined : 'Live decision lookup is not connected yet'} placeholder="Amount, if any" /></div>
      {query.trim() && (answer ? <div className={`vy-decision-answer ${answer.over || answer.rule.decider !== currentUser ? 'is-escalated' : 'is-mine'}`} role="status">
        <h3>{answer.over ? `Above your limit — ${personName(answer.rule.escalate || answer.rule.decider)} decides` : answer.rule.decider === currentUser ? 'Yes, this is yours to decide' : answer.rule.decider ? `${personName(answer.rule.decider)} decides this` : 'Nobody is set as the decider yet'}</h3>
        <p>{answer.rule.decision}{answer.rule.limit && ` · ${answer.rule.limit}`} · {byCode(answer.rule.department).name}</p>
        <ol>{answer.rule.consult && <li>{answer.rule.decider === currentUser && !answer.over ? 'Check with' : 'They check with'} {answer.rule.consult} first.</li>}<li>{answer.rule.decider === currentUser && !answer.over ? 'Decide and record it where it belongs.' : 'Send the request with the numbers, the options, and what happens if we wait.'}</li>{answer.rule.inform && <li>Tell {answer.rule.inform} afterwards.</li>}</ol>
        {(answer.over || answer.rule.decider !== currentUser) && <button type="button" className="vy-button vy-button-small vy-button-dark" disabled title="Decision requests are not connected yet">Ask for a decision</button>}
      </div> : <div className="vy-decision-answer is-escalated" role="status"><h3>That one isn't written down yet</h3><p>Ask your department lead, then ask an admin to add it here so nobody has to ask twice.</p></div>)}
    </section>
    <div className="vy-own-tabs" role="tablist" aria-label="Decision chart views" onKeyDown={tabKeys}>
      <button type="button" role="tab" id="vy-dec-tab-me" aria-controls="vy-dec-panel" aria-selected={view === 'me'} tabIndex={view === 'me' ? 0 : -1} onClick={() => setView('me')}>What applies to me</button>
      <button type="button" role="tab" id="vy-dec-tab-all" aria-controls="vy-dec-panel" aria-selected={view === 'all'} tabIndex={view === 'all' ? 0 : -1} onClick={() => setView('all')}>The whole chart</button>
    </div>
    <div id="vy-dec-panel" role="tabpanel" aria-labelledby={`vy-dec-tab-${view}`} tabIndex={0}>
      {view === 'me' ? <><div className="vy-decision-summary"><section className="is-mine"><h2>Yours to decide{mine.length > 0 && ` · ${mine.length}`}</h2>{mine.length ? <ul>{mine.map((rule) => <li key={rule.id}><span>{rule.decision}</span><small>{rule.limit}</small></li>)}</ul> : <p>Nothing yet. An admin sets this on each decision.</p>}</section><section className="is-escalated"><h2>Needs someone else{others.length > 0 && ` · ${others.length}`}</h2>{others.length ? <ul>{others.slice(0, 6).map((rule) => <li key={rule.id}><span>{rule.decision}</span><small>{personName(rule.decider)}</small></li>)}</ul> : <p>Nothing assigned to anyone else yet.</p>}</section>{unassigned.length > 0 && preview && <section><h2>No decider set · {unassigned.length}</h2><ul>{unassigned.map((rule) => <li key={rule.id}><span>{rule.decision}</span><button type="button" className="vy-button vy-button-small" onClick={() => setEditor(rule.id)}>Set</button></li>)}</ul></section>}</div><p className="vy-own-hint">Looking for something specific? Open <button type="button" onClick={() => setView('all')}>The whole chart</button>.</p></> : <>
        <div className="vy-decision-groups" role="group" aria-label="Decision groups"><button type="button" aria-pressed={!group} onClick={() => setGroup('')}>All {rules.length}</button>{shownGroups.map((item) => <button type="button" key={item} aria-pressed={group === item} onClick={() => setGroup(item)}>{item} {rules.filter((rule) => rule.group === item).length}</button>)}</div>
        {shown.length ? <div className="vy-decision-list">{shown.map((rule) => <details key={rule.id} className="vy-decision-row" style={departmentStyle(byCode(rule.department).color)}><summary><strong>{rule.decision}</strong><span>{rule.limit || 'no limit set'}</span><span>{rule.decider ? rule.decider === currentUser ? 'You' : personName(rule.decider) : 'not set'}{rule.escalate && ` → ${personName(rule.escalate)}`}</span></summary><div className="vy-decision-row-body"><dl><dt>Department</dt><dd>{byCode(rule.department).name}</dd>{rule.consult && <><dt>Check with first</dt><dd>{rule.consult}</dd></>}{rule.inform && <><dt>Tell afterwards</dt><dd>{rule.inform}</dd></>}{rule.escalate && <><dt>Above the limit</dt><dd>{personName(rule.escalate)} decides</dd></>}{rule.notes && <><dt>Worth knowing</dt><dd>{rule.notes}</dd></>}</dl><div className="vy-own-actions"><button type="button" className="vy-button vy-button-small" disabled title="Decision requests are not connected yet">Ask for a decision</button>{preview && <button type="button" className="vy-button vy-button-small vy-button-ghost" onClick={() => setEditor(rule.id)}>Edit</button>}</div></div></details>)}</div> : <p className="vy-own-empty">Nothing in this group yet.</p>}
        {(!group || group === 'Money') && <details className="vy-own-disclosure"><summary>See the money ladder</summary><div className="vy-decision-ladder">{rules.filter((rule) => parseDecisionLimit(rule.limit)).length ? rules.filter((rule) => parseDecisionLimit(rule.limit)).sort((a, b) => parseDecisionLimit(a.limit)!.max - parseDecisionLimit(b.limit)!.max).map((rule) => <div key={rule.id}><strong>{rule.limit}</strong><span>{rule.decision}</span><small>{personName(rule.decider)}{rule.escalate && ` → ${personName(rule.escalate)}`}</small></div>) : <p>No limits have been set yet.</p>}</div></details>}
        <details className="vy-own-disclosure"><summary>How a decision should travel</summary><div className="vy-own-flow"><span>Something needs deciding</span><span>Check the chart</span><span>Inside your limit? Decide it</span><span>Above it? Ask with the numbers</span><span>Tell whoever it affects</span></div></details>
      </>}
    </div>
    {editor && <DecisionDialog key={editor} rule={selectedRule} departments={allDepartments} people={people} onSave={saveRule} onDelete={(id) => { onRulesChange?.(rules.filter((rule) => rule.id !== id)); setEditor(null) }} onClose={() => setEditor(null)} />}
  </>
}
