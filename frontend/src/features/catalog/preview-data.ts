import type { CatalogRow, CatalogStandard, CatalogVendor } from './model'

export const previewCatalogRows: CatalogRow[] = [
  { id: 'sample-brewer', section: 'equipment', code: 'EQ-104', name: 'Tea brewer', category: 'Brewing', brand: 'Sample brand', model: 'TB-2', purpose: 'Hot tea station', quantity: '2', price: '850', specs: 'Countertop unit; confirm water connection before ordering.', sku: '', vendor: 'Sample equipment vendor', alternateVendor: '', pack: '', orderUrl: '', verified: '' },
  { id: 'sample-fridge', section: 'equipment', code: 'EQ-221', name: 'Undercounter refrigerator', category: 'Cold storage', brand: 'Sample brand', model: 'UC-1', purpose: 'Cold storage', quantity: '1', price: '1400', specs: 'Check undercounter clearance.', sku: '', vendor: 'Sample equipment vendor', alternateVendor: '', pack: '', orderUrl: '', verified: '' },
  { id: 'sample-pitcher', section: 'smallwares', code: '', name: 'Stainless pitcher', category: '', brand: '', model: '', purpose: 'Tea prep', quantity: '4', price: '18', specs: '', sku: 'SW-18', vendor: 'Sample supply vendor', alternateVendor: '', pack: '', orderUrl: '', verified: '' },
  { id: 'sample-cups', section: 'supplies', code: '', name: 'Cold cups', category: '', brand: '', model: '', purpose: '', quantity: '1', price: '62', specs: '', sku: 'SU-42', vendor: 'Sample supply vendor', alternateVendor: '', pack: 'Case of 500', orderUrl: '', verified: '' },
]

export const previewCatalogVendors: CatalogVendor[] = [
  { id: 'sample-equipment-vendor', name: 'Sample equipment vendor', type: 'Brewing and refrigeration', lead: '3–4 weeks', notes: 'Confirm exact model before placing an order.', site: '', phone: '', email: '' },
  { id: 'sample-supply-vendor', name: 'Sample supply vendor', type: 'Smallwares and packaging', lead: '1 week', notes: '', site: '', phone: '', email: '' },
]

export const previewCatalogStandards: CatalogStandard[] = [
  { id: 'sample-standard', topic: 'Equipment check', text: 'Confirm dimensions, electrical needs, and service access against the site plan before ordering.' },
]
