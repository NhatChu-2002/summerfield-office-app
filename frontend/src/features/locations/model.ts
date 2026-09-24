export type LocationStatus = 'lead' | 'build' | 'open' | 'hold' | 'closed'
export type LocationRecord = {
  id: string; name: string; code: string; address: string; city: string; status: LocationStatus
  opened: string; sqft: string; rent: string; landlord: string; notes: string
  contacts: { role: string; name: string; phone: string; email: string }[]
  folders: { name: string; url: string }[]
  projectIds: string[]
}
export type LocationEquipment = {
  id: string; locationId: string; code: string; name: string; brand: string; model: string
  purpose: string; quantity: number; tag: string; serial: string; installed: string
  condition: 'new' | 'good' | 'needs' | 'broken'; warrantyEnd: string; cost: number; notes: string
}

export const locationStatuses: { value: LocationStatus; label: string }[] = [
  { value: 'lead', label: 'Lead / scouting' }, { value: 'build', label: 'In build-out' },
  { value: 'open', label: 'Open' }, { value: 'hold', label: 'On hold' }, { value: 'closed', label: 'Closed' },
]

export function locationStatus(status: LocationStatus) {
  return locationStatuses.find((item) => item.value === status)?.label || 'Lead / scouting'
}

export function filterLocations(locations: LocationRecord[], query: string) {
  const term = query.trim().toLocaleLowerCase()
  return locations.filter((item) => `${item.name} ${item.code} ${item.address} ${item.city} ${item.notes}`.toLocaleLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function locationEquipment(equipment: LocationEquipment[], id: string) {
  return equipment.filter((item) => item.locationId === id).sort((a, b) => a.code.localeCompare(b.code))
}

export function equipmentValue(equipment: LocationEquipment[]) {
  return equipment.reduce((total, item) => total + item.cost * item.quantity, 0)
}

export function safeFolderUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch { return null }
}

export function equipmentCsv(equipment: LocationEquipment[]) {
  const quote = (value: string | number) => {
    const text = String(value)
    const safe = /^[\s\t\r\n]*[=+@-]/.test(text) ? `'${text}` : text
    return `"${safe.replaceAll('"', '""')}"`
  }
  const lines = [['Code', 'Equipment', 'Brand', 'Model', 'Qty', 'Asset tag', 'Serial', 'Installed', 'Condition', 'Warranty ends', 'Unit cost'],
    ...equipment.map((item) => [item.code, item.name, item.brand, item.model, item.quantity, item.tag, item.serial, item.installed, item.condition, item.warrantyEnd, item.cost])]
  return lines.map((line) => line.map(quote).join(',')).join('\r\n')
}
