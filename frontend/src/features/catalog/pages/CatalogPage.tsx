import { useState } from 'react'
import { Download, ExternalLink, Printer, Search } from 'lucide-react'
import { displayDate } from '@/shared/lib/format'
import { SelectField } from '@/shared/ui/SelectField'
import { CatalogDialog } from '../components/CatalogDialog'
import { catalogCategories, catalogChanges, catalogSections, filterCatalog, orderRequestCsv, safeCatalogUrl, type CatalogChange, type CatalogRow, type CatalogSection, type CatalogStandard, type CatalogVendor } from '../model'
import './catalog.css'

function price(value: string) {
  const amount = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(amount) && amount > 0 ? `$${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'
}

export default function CatalogPage({ rows, vendors, standards, changes, preview, onRowsChange, onChangesChange }: {
  rows: CatalogRow[]; vendors: CatalogVendor[]; standards: CatalogStandard[]; changes: CatalogChange[]; preview: boolean
  onRowsChange?: (rows: CatalogRow[]) => void; onChangesChange?: (changes: CatalogChange[]) => void
}) {
  const [section, setSection] = useState<CatalogSection>('equipment')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const shown = filterCatalog(rows, section, query, category)
  const picked = rows.filter((row) => selected.includes(row.id))
  const editRow = rows.find((row) => row.id === editing)
  const counts = (value: CatalogSection) => rows.filter((row) => row.section === value).length

  function toggle(id: string) { setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]) }
  function save(next: CatalogRow) {
    const before = rows.find((row) => row.id === next.id)
    if (!before) return
    const edits = catalogChanges(before, next, 'Preview', new Date().toISOString())
    if (edits.length) { onRowsChange?.(rows.map((row) => row.id === next.id ? next : row)); onChangesChange?.([...edits, ...changes]) }
    setEditing(null)
  }
  function exportOrder() {
    const csv = orderRequestCsv(picked)
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'summerfield-order-request.csv'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <>
    <header className="vy-hero vy-catalog-hero"><div><h1>Master equipment catalog</h1><p>Kept by I&M. The list Build-Out builds from, I&M maintains, and R&D checks before a new drink needs new gear.</p></div>
      <div className="vy-hero-actions"><button type="button" className="vy-button" disabled title="Excel import is not connected">Update from Excel</button><button type="button" className="vy-button" onClick={() => window.print()}><Printer size={15} /> Print</button><a className="vy-button" href="#/department/equipment_and_maintenance">I&M dashboard</a></div></header>
    <p className="vy-catalog-status-note">{preview ? 'Sample catalog. Edits and order picks stay in this Design preview until you reload; location files do not sync from it.' : 'The shared master catalog is not connected yet. No company items, vendors, or edit history are shown here.'}</p>
    <section className="vy-catalog-section"><div className="vy-catalog-heading"><div><h2>Equipment & supply standards</h2><p>{counts('equipment')} equipment items · {counts('smallwares')} smallwares · {counts('supplies')} supplies</p></div></div>
      <div className="vy-catalog-tabs" role="tablist" aria-label="Catalog sections">{catalogSections.map((item) => <button type="button" role="tab" aria-selected={section === item.value} key={item.value} onClick={() => { setSection(item.value); setCategory('') }}>{item.label}</button>)}</div>
      <div className="vy-catalog-toolbar"><label className="vy-catalog-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Search the catalog" placeholder="Search name, SKU, brand, or use" value={query} onChange={(event) => setQuery(event.target.value)} /></label>{section === 'equipment' && <SelectField value={category} onChange={setCategory} ariaLabel="Category" size="compact" options={[{ value: '', label: 'All categories' }, ...catalogCategories(rows).map((name) => ({ value: name, label: name }))]} />}</div>
      {shown.length ? <div className="vy-catalog-table-wrap"><table><thead><tr><th><span className="vy-sr-only">Pick</span></th><th>{section === 'equipment' ? 'Code' : 'SKU'}</th><th>Item & purpose</th><th>{section === 'equipment' ? 'Brand / model' : section === 'smallwares' ? 'Vendor' : 'Pack'}</th><th>{section === 'equipment' ? 'Where used' : 'Order from'}</th><th>Qty</th><th>Unit price</th><th></th></tr></thead><tbody>{shown.map((row) => <tr key={row.id}><td><input type="checkbox" aria-label={`Pick ${row.name}`} checked={selected.includes(row.id)} onChange={() => toggle(row.id)} /></td><td>{row.code || row.sku}</td><td><strong>{row.name}</strong>{row.specs && <small>{row.specs}</small>}</td><td>{section === 'equipment' ? [row.brand, row.model].filter(Boolean).join(' · ') : section === 'smallwares' ? row.vendor : row.pack}</td><td>{section === 'equipment' ? row.purpose : row.vendor}</td><td>{row.quantity}</td><td>{price(row.price)}</td><td><div className="vy-catalog-row-actions">{safeCatalogUrl(row.orderUrl) && <a className="vy-button vy-button-small" href={safeCatalogUrl(row.orderUrl) || undefined} target="_blank" rel="noopener noreferrer">Order <ExternalLink size={13} /></a>}{preview && <button type="button" className="vy-button vy-button-small" onClick={() => setEditing(row.id)}>Edit</button>}</div></td></tr>)}</tbody></table></div> : <p className="vy-catalog-empty">{rows.some((row) => row.section === section) ? 'Nothing matches that search.' : preview ? 'No sample items in this section.' : 'This catalog section is not connected yet.'}</p>}
      <div className="vy-catalog-order"><button type="button" className="vy-button vy-button-dark vy-button-small" disabled={!picked.length} onClick={exportOrder}><Download size={14} /> Build order request{picked.length ? ` (${picked.length})` : ''}</button>{picked.length > 0 && <button type="button" className="vy-button vy-button-small" onClick={() => setSelected([])}>Clear picks</button>}<span>Pick items to download a request grouped by vendor. No order is sent.</span></div>
    </section>
    <section className="vy-catalog-section"><h2>Vendors & lead times</h2><p className="vy-catalog-muted">Who to call, what they cover, and how long they take.</p>{vendors.length ? <div className="vy-catalog-vendors">{vendors.map((vendor) => <article key={vendor.id}><h3>{vendor.name}</h3><p>{vendor.type}</p>{vendor.lead && <span>Lead time {vendor.lead}</span>}{vendor.notes && <p>{vendor.notes}</p>}<div className="vy-catalog-row-actions">{safeCatalogUrl(vendor.site) && <a href={safeCatalogUrl(vendor.site) || undefined} target="_blank" rel="noopener noreferrer">Website <ExternalLink size={13} /></a>}{vendor.phone && <a href={`tel:${vendor.phone.replace(/[^0-9+]/g, '')}`}>Call</a>}{vendor.email && <a href={`mailto:${vendor.email}`}>Email</a>}</div></article>)}</div> : <p className="vy-catalog-empty">No vendors loaded yet.</p>}
      {standards.length > 0 && <div className="vy-catalog-standards"><h2>Our standards</h2>{standards.map((item) => <div key={item.id}><strong>{item.topic}</strong><p>{item.text}</p></div>)}</div>}</section>
    <section className="vy-catalog-section"><h2>Recent changes</h2>{changes.length ? <ul className="vy-catalog-history">{changes.slice(0, 40).map((item) => <li key={item.id}><time dateTime={item.at}>{displayDate(item.at.slice(0, 10))}</time><div><strong>{item.code}</strong> · {item.field}: {item.from || '(blank)'} → {item.to || '(blank)'}<small>{item.by}</small></div></li>)}</ul> : <p className="vy-catalog-empty">No edits yet. Changes to price, model, or specification appear here with their author.</p>}</section>
    {editRow && <CatalogDialog key={editRow.id} row={editRow} onClose={() => setEditing(null)} onSave={save} />}
  </>
}
