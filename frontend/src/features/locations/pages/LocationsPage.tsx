import { useState } from 'react'
import { ArrowRight, Plus, Search } from 'lucide-react'
import { displayDate } from '@/shared/lib/format'
import { LocationDialog } from '../components/LocationDialog'
import { filterLocations, locationEquipment, locationStatus, type LocationEquipment, type LocationRecord } from '../model'
import './locations.css'

export default function LocationsPage({ locations, equipment, preview, onLocationsChange }: {
  locations: LocationRecord[]; equipment: LocationEquipment[]; preview: boolean; onLocationsChange?: (locations: LocationRecord[]) => void
}) {
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const shown = filterLocations(locations, query)
  return <>
    <header className="vy-hero vy-locations-hero"><div><h1>Locations</h1><p>Build-Out's master file for every store: build-out, equipment, documents, dates, and history in one place.</p></div>
      <div className="vy-hero-actions"><button type="button" className="vy-button vy-button-dark" disabled={!preview} title={preview ? undefined : 'Location saving is not connected'} onClick={() => setAdding(true)}><Plus size={16} /> Add a location</button><a className="vy-button" href="#/department/build_out">Build-Out dashboard</a></div></header>
    <p className="vy-location-status-note">{preview ? 'Sample location records and edits stay in this Design preview until you reload.' : 'Shared location records are not connected yet. No company locations are shown here.'}</p>
    <label className="vy-location-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search locations" placeholder="Search locations" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    {shown.length ? <div className="vy-location-grid">{shown.map((location) => <article className="vy-location-card" key={location.id}>
      <div className="vy-location-card-head"><h2>{location.name}</h2><span className={`vy-location-status is-${location.status}`}>{locationStatus(location.status)}</span></div>
      <p>{location.address || 'No address yet'}{location.city && `, ${location.city}`}{location.opened && ` · Open since ${displayDate(location.opened)}`}</p>
      <p>{locationEquipment(equipment, location.id).length} equipment items · {location.projectIds.length} linked projects</p>
      <a className="vy-button vy-button-small" href={`#/location/${encodeURIComponent(location.id)}`}>Open location file <ArrowRight size={14} /></a>
    </article>)}</div> : <p className="vy-location-empty">{locations.length ? 'No locations match your search.' : preview ? 'No locations yet. Add the first store.' : 'Locations will appear when shared storage is connected.'}</p>}
    {adding && <LocationDialog onClose={() => setAdding(false)} onDelete={() => {}} onSave={(location) => { onLocationsChange?.([...locations, location]); setAdding(false); window.location.hash = `#/location/${encodeURIComponent(location.id)}` }} />}
  </>
}
