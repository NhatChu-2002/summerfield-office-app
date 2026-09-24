import type { LocationEquipment, LocationRecord } from './model'

export const previewLocations: LocationRecord[] = [
  { id: 'sample-la-habra', name: 'La Habra', code: 'LH', address: '123 Market Street', city: 'La Habra', status: 'build', opened: '', sqft: '1800', rent: '', landlord: '', notes: 'Sample build-out file for reviewing the location workflow.', contacts: [{ role: 'Site lead', name: 'Sam', phone: '', email: '' }], folders: [], projectIds: ['sample-site'] },
  { id: 'sample-westside', name: 'Westside', code: 'WS', address: '85 Harbor Avenue', city: 'Los Angeles', status: 'open', opened: '2025-05-14', sqft: '2100', rent: '', landlord: '', notes: 'Sample open location.', contacts: [], folders: [], projectIds: [] },
]

export const previewLocationEquipment: LocationEquipment[] = [
  { id: 'sample-eq-1', locationId: 'sample-la-habra', code: 'EQ-104', name: 'Tea brewer', brand: 'Sample brand', model: 'TB-2', purpose: 'Tea preparation', quantity: 2, tag: 'LH-001', serial: '', installed: '', condition: 'good', warrantyEnd: '', cost: 850, notes: '' },
  { id: 'sample-eq-2', locationId: 'sample-westside', code: 'EQ-221', name: 'Undercounter refrigerator', brand: '', model: '', purpose: 'Cold storage', quantity: 1, tag: 'WS-004', serial: '', installed: '2025-05-10', condition: 'good', warrantyEnd: '', cost: 1400, notes: '' },
]
