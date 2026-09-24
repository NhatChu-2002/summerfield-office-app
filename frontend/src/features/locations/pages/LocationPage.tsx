import { useState } from 'react'
import { ArrowLeft, Download, ExternalLink, Plus, Printer } from 'lucide-react'
import { displayDate } from '@/shared/lib/format'
import { EquipmentDialog } from '../components/EquipmentDialog'
import { FolderDialog } from '../components/FolderDialog'
import { LocationDialog } from '../components/LocationDialog'
import { equipmentCsv, equipmentValue, locationEquipment, locationStatus, safeFolderUrl, type LocationEquipment, type LocationRecord } from '../model'
import './locations.css'

type LinkedProject = { id: string; name: string; status: string }
type LinkedTask = { id: string; projectId: string; title: string; due: string; status: 'open' | 'done' }
type Tab = 'overview' | 'equipment' | 'build' | 'files' | 'history'

export default function LocationPage({ id, locations, equipment, projects = [], tasks = [], preview, onLocationsChange, onEquipmentChange }: {
  id: string; locations: LocationRecord[]; equipment: LocationEquipment[]; projects?: LinkedProject[]; tasks?: LinkedTask[]; preview: boolean
  onLocationsChange?: (locations: LocationRecord[]) => void; onEquipmentChange?: (equipment: LocationEquipment[]) => void
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [editLocation, setEditLocation] = useState(false)
  const [editEquipment, setEditEquipment] = useState<string | null>(null)
  const [addFolder, setAddFolder] = useState(false)
  const location = locations.find((item) => item.id === id)
  if (!location) return <div className="vy-location-unavailable"><h1>Location unavailable</h1><p>{preview ? 'That location is not in this preview.' : 'Shared location files are not connected yet.'}</p><a className="vy-button" href="#/locations"><ArrowLeft size={15} /> All locations</a></div>
  const rows = locationEquipment(equipment, id)
  const linkedProjects = projects.filter((item) => location.projectIds.includes(item.id))
  const linkedTasks = tasks.filter((item) => location.projectIds.includes(item.projectId))
  const facts = [
    ['Status', locationStatus(location.status)], ['Address', [location.address, location.city].filter(Boolean).join(', ') || 'Not recorded'],
    ['Opened', location.opened ? displayDate(location.opened) : 'Not recorded'], ['Size', location.sqft ? `${location.sqft} sq ft` : 'Not recorded'],
    ['Landlord', location.landlord || 'Not recorded'], ['Rent', location.rent ? `$${Number(location.rent).toLocaleString()}` : 'Not recorded'],
    ['Equipment items', String(rows.length)], ['Equipment value', rows.length ? `$${equipmentValue(rows).toLocaleString()}` : 'Not recorded'], ['Store code', location.code || 'Not recorded'],
  ]
  const history = [
    ...(location.opened ? [{ date: location.opened, kind: 'Opened', detail: `${location.name} opened` }] : []),
    ...rows.filter((item) => item.installed).map((item) => ({ date: item.installed, kind: 'Installed', detail: item.name })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  function updateLocation(next: LocationRecord) { onLocationsChange?.(locations.map((item) => item.id === id ? next : item)) }
  function exportCsv() {
    if (!location) return
    const csv = equipmentCsv(rows)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = `${location.code || location.name}-equipment.csv`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <>
    <a className="vy-location-back" href="#/locations"><ArrowLeft size={14} /> All locations</a>
    <header className="vy-hero vy-locations-hero vy-location-detail-hero"><div><h1>{location.name}</h1><p>{[location.address, location.city, locationStatus(location.status)].filter(Boolean).join(' · ')}</p></div>
      <div className="vy-hero-actions"><button type="button" className="vy-button" disabled={!preview} title={preview ? undefined : 'Location saving is not connected'} onClick={() => setEditLocation(true)}>Edit details</button><button type="button" className="vy-button" onClick={() => window.print()}><Printer size={15} /> Print file</button></div></header>
    <p className="vy-location-status-note">{preview ? 'Sample location file. Changes remain in this Design preview until you reload.' : 'Shared location files are not connected yet.'}</p>
    <div className="vy-location-tabs" role="tablist" aria-label="Location details">{([['overview', 'Overview'], ['equipment', `Equipment ${rows.length}`], ['build', 'Build-out & tasks'], ['files', 'Files & folders'], ['history', 'History']] as [Tab, string][]).map(([key, label]) => <button type="button" key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div>
    <div className="vy-location-tab-panel" role="tabpanel">
      {tab === 'overview' && <><div className="vy-location-facts">{facts.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>
        <div className="vy-location-columns"><section><h2>About this location</h2><p className="vy-location-preserve">{location.notes || 'No notes yet.'}</p><h2>People & contacts</h2>{location.contacts.length ? <ul className="vy-location-list">{location.contacts.map((contact, index) => <li key={index}><strong>{contact.role}: {contact.name}</strong><span>{contact.phone} {contact.email}</span></li>)}</ul> : <p className="vy-location-empty">No contacts saved.</p>}</section>
          <section><h2>Coming up here</h2><p className="vy-location-empty">Location calendar events are not connected yet.</p><h2>Open work</h2>{linkedTasks.filter((item) => item.status === 'open').length ? <ul className="vy-location-list">{linkedTasks.filter((item) => item.status === 'open').map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.due ? `Due ${displayDate(item.due)}` : 'No due date'}</span></li>)}</ul> : <p className="vy-location-empty">No linked open tasks.</p>}</section></div></>}
      {tab === 'equipment' && <section><div className="vy-location-section-head"><div><h2>Equipment at {location.name}</h2><p>{rows.length} items{rows.length ? ` · $${equipmentValue(rows).toLocaleString()} at recorded prices` : ''}</p></div><div className="vy-location-actions"><button type="button" className="vy-button vy-button-dark vy-button-small" disabled={!preview} onClick={() => setEditEquipment('new')}><Plus size={14} /> Add equipment</button><button type="button" className="vy-button vy-button-small" disabled={!rows.length} onClick={exportCsv}><Download size={14} /> Export CSV</button></div></div>
        {rows.length ? <div className="vy-location-table-wrap"><table><thead><tr><th>Code</th><th>Equipment & purpose</th><th>Qty</th><th>Asset tag / serial</th><th>Installed</th><th>Condition</th><th>Warranty</th><th></th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td>{item.code}</td><td><strong>{item.name}</strong><small>{[item.brand, item.model, item.purpose, item.notes].filter(Boolean).join(' · ')}</small></td><td>{item.quantity}</td><td>{item.tag}<small>{item.serial}</small></td><td>{item.installed ? displayDate(item.installed) : '—'}</td><td>{item.condition}</td><td>{item.warrantyEnd ? displayDate(item.warrantyEnd) : '—'}</td><td>{preview && <button type="button" className="vy-button vy-button-small" onClick={() => setEditEquipment(item.id)}>Edit</button>}</td></tr>)}</tbody></table></div> : <p className="vy-location-empty">No equipment recorded here yet.</p>}</section>}
      {tab === 'build' && <div className="vy-location-columns"><section><h2>Build-out tasks</h2>{linkedTasks.length ? <ul className="vy-location-list">{linkedTasks.map((item) => <li key={item.id}><strong>{item.title}</strong><span>{item.status === 'done' ? 'Done' : item.due ? `Due ${displayDate(item.due)}` : 'Open'}</span></li>)}</ul> : <p className="vy-location-empty">No tasks linked yet.</p>}</section><section><h2>Projects</h2>{linkedProjects.length ? <ul className="vy-location-list">{linkedProjects.map((item) => <li key={item.id}><strong>{item.name}</strong><span>{item.status}</span><a href={`#/project/${encodeURIComponent(item.id)}`}>Open project <ExternalLink size={13} /></a></li>)}</ul> : <p className="vy-location-empty">No projects linked yet.</p>}<h2>Build-Out dashboard</h2><a className="vy-button vy-button-small" href="#/department/build_out">Open dashboard</a></section></div>}
      {tab === 'files' && <div className="vy-location-columns"><section><div className="vy-location-section-head"><h2>Drive folders</h2><button type="button" className="vy-button vy-button-small" disabled={!preview} onClick={() => setAddFolder(true)}><Plus size={14} /> Add link</button></div>{location.folders.length ? <ul className="vy-location-list">{location.folders.map((folder, index) => <li key={index}><a href={safeFolderUrl(folder.url) || undefined} target="_blank" rel="noopener noreferrer">{folder.name} <ExternalLink size={13} /></a>{preview && <button type="button" className="vy-button vy-button-small" onClick={() => updateLocation({ ...location, folders: location.folders.filter((_, offset) => offset !== index) })}>Remove</button>}</li>)}</ul> : <p className="vy-location-empty">No folder links yet.</p>}</section><section><h2>Files attached in HQ</h2><p className="vy-location-empty">Shared file attachments are not connected yet.</p></section></div>}
      {tab === 'history' && <section><h2>Everything that has happened here</h2>{history.length ? <ul className="vy-location-list vy-location-history">{history.map((item, index) => <li key={`${item.kind}-${index}`}><time dateTime={item.date}>{displayDate(item.date)}</time><strong>{item.kind}</strong><span>{item.detail}</span></li>)}</ul> : <p className="vy-location-empty">Nothing recorded yet. Installed equipment and opening dates appear here.</p>}</section>}
    </div>
    {editLocation && <LocationDialog location={location} onClose={() => setEditLocation(false)} onSave={(next) => { updateLocation(next); setEditLocation(false) }} onDelete={() => { onLocationsChange?.(locations.filter((item) => item.id !== id)); setEditLocation(false); window.location.hash = '#/locations' }} />}
    {editEquipment && <EquipmentDialog key={editEquipment} locationId={id} equipment={equipment.find((item) => item.id === editEquipment)} onClose={() => setEditEquipment(null)} onSave={(next) => { onEquipmentChange?.(equipment.some((item) => item.id === next.id) ? equipment.map((item) => item.id === next.id ? next : item) : [...equipment, next]); setEditEquipment(null) }} onDelete={(itemId) => { onEquipmentChange?.(equipment.filter((item) => item.id !== itemId)); setEditEquipment(null) }} />}
    {addFolder && <FolderDialog onClose={() => setAddFolder(false)} onSave={(folder) => { updateLocation({ ...location, folders: [...location.folders, folder] }); setAddFolder(false) }} />}
  </>
}
