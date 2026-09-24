export type CatalogSection = 'equipment' | 'smallwares' | 'supplies'
export type CatalogRow = {
  id: string; section: CatalogSection; code: string; name: string; category: string; brand: string; model: string
  purpose: string; quantity: string; price: string; specs: string; sku: string; vendor: string
  alternateVendor: string; pack: string; orderUrl: string; verified: string
}
export type CatalogVendor = { id: string; name: string; type: string; lead: string; notes: string; site: string; phone: string; email: string }
export type CatalogStandard = { id: string; topic: string; text: string }
export type CatalogChange = { id: string; at: string; by: string; section: CatalogSection; code: string; field: string; from: string; to: string }

export const catalogSections: { value: CatalogSection; label: string }[] = [
  { value: 'equipment', label: 'Equipment standards' }, { value: 'smallwares', label: 'Smallwares' }, { value: 'supplies', label: 'Supplies & ingredients' },
]

export function filterCatalog(rows: CatalogRow[], section: CatalogSection, query: string, category: string) {
  const term = query.trim().toLocaleLowerCase()
  return rows.filter((row) => row.section === section && (!category || section !== 'equipment' || row.category === category)
    && (!term || [row.code, row.name, row.category, row.brand, row.model, row.purpose, row.specs, row.sku, row.vendor, row.pack].join(' ').toLocaleLowerCase().includes(term)))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function catalogCategories(rows: CatalogRow[]) {
  return [...new Set(rows.filter((row) => row.section === 'equipment').map((row) => row.category).filter(Boolean))].sort()
}

export function catalogChanges(before: CatalogRow, after: CatalogRow, by: string, at: string): CatalogChange[] {
  const fields: (keyof CatalogRow)[] = ['name', 'brand', 'model', 'purpose', 'quantity', 'price', 'specs', 'sku', 'vendor', 'alternateVendor', 'pack', 'orderUrl']
  return fields.filter((field) => before[field] !== after[field]).map((field) => ({ id: crypto.randomUUID(), at, by, section: after.section,
    code: after.code || after.name, field, from: before[field], to: after[field] }))
}

export function safeCatalogUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch { return null }
}

export function orderRequestCsv(rows: CatalogRow[]) {
  const quote = (value: string) => {
    const safe = /^[\s\t\r\n]*[=+@-]/.test(value) ? `'${value}` : value
    return `"${safe.replaceAll('"', '""')}"`
  }
  const sorted = [...rows].sort((a, b) => a.vendor.localeCompare(b.vendor) || a.name.localeCompare(b.name))
  return [['Vendor', 'Section', 'Code / SKU', 'Item', 'Quantity', 'Unit price', 'Order URL'],
    ...sorted.map((row) => [row.vendor, row.section, row.code || row.sku, row.name, row.quantity, row.price, row.orderUrl])]
    .map((line) => line.map(quote).join(',')).join('\r\n')
}
