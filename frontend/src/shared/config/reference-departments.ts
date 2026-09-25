import type { CSSProperties } from 'react'
import type { Department } from './departments'

export type ReferenceDepartment = {
  code: string
  name: string
  full: string
  color: string
  folders: string[]
  tool?: string
}

export const companyDepartment: ReferenceDepartment = {
  code: 'company', name: 'Company-wide', full: 'Everyone at Summerfield',
  color: '#231F20', folders: ['Department Folders (all)', 'SOPs', 'Weekly Reports', 'Logo Files', 'Admin'],
}

// These appear in the design preview only; shared membership and HQ tables do not support them yet.
export const previewOnlyDepartments: Department[] = [
  { code: 'it', name: 'IT', shortName: 'IT', description: 'Systems, POS, devices and access' },
  { code: 'hr', name: 'HR', shortName: 'HR', description: 'People, hiring and policies' },
]

export const referenceDepartments: ReferenceDepartment[] = [
  { code: 'research_and_development', name: 'R&D', full: 'Research & Development', color: '#B6CFAE', folders: ['R&D', 'Research and Development Team'], tool: 'R&D Launch Desk' },
  { code: 'marketing', name: 'M&M', full: 'Marketing & Media', color: '#F2DBC7', folders: ['M&M', 'Fundraiser Contracts', 'Catering Records'], tool: 'M&M Hub' },
  { code: 'build_out', name: 'Build-Out', full: 'New stores & construction', color: '#BFD3D6', folders: ['Summerfield Build Outs', 'Active New Build Out Docs', 'Store Build Out SOPs'], tool: 'Build-Out Command Center' },
  { code: 'operations', name: 'Operations', full: 'Stores & day-to-day', color: '#CDA077', folders: ['Ops', 'Ops Team'] },
  { code: 'finance', name: 'Finance', full: 'Budgets, invoices & reporting', color: '#E3E8E3', folders: ['Finance', 'Finance Team', 'Invoices'] },
  { code: 'warehouse_and_spend', name: 'Warehouse', full: 'Stock, storage & deliveries', color: '#FFFFFF', folders: ['DTB Warehouse', 'Private Label Inventory'] },
  { code: 'equipment_and_maintenance', name: 'I&M', full: 'Improvement & Maintenance — equipment, facilities, repairs', color: '#C1B892', folders: ['IM Team', 'Inventory', 'Equipment audit', 'Transition'] },
  { code: 'it', name: 'IT', full: 'Information technology — systems, POS, devices & access', color: '#A9C0D0', folders: ['Password', 'POS: Toast', 'POS, Technology & Software'] },
  { code: 'hr', name: 'HR', full: 'People, hiring & policies', color: '#E6C3A3', folders: ['HR Team', 'Admin / HR Reports', 'Upper management policy'] },
]

export const referenceByCode = (code: string) => referenceDepartments.find((item) => item.code === code)
export const referenceHref = (code: string) => `#/department/${code}`
export function referenceForDepartment(department: Department): ReferenceDepartment {
  return referenceByCode(department.code) || {
    code: department.code, name: department.shortName, full: department.description,
    color: '#E3E8E3', folders: [],
  }
}
export const sortLikeReference = <T extends { code: string }>(items: T[]) => [...items].sort((a, b) => {
  const rank = (code: string) => {
    const index = referenceDepartments.findIndex((item) => item.code === code)
    return index === -1 ? referenceDepartments.length : index
  }
  return rank(a.code) - rank(b.code)
})

export const referenceNav = [
  { key: 'dashboard', label: 'Dashboard', href: '#/' },
  { key: 'calendar', label: 'Team calendar', href: '#/calendar' },
  { key: 'folders', label: 'Department folders', href: '#/folders' },
  { key: 'help', label: 'How HQ works', href: '#/help' },
  { key: 'watch', label: 'Market watch', href: '#/watch' },
  { key: 'ask', label: 'Who to ask', href: '#/ask' },
  { key: 'decisions', label: 'Decision chart', href: '#/decisions' },
  { key: 'projects', label: 'Projects', href: '#/projects' },
  { key: 'tasks', label: 'My tasks', href: '#/tasks' },
  { key: 'learn', label: 'Learning', href: '#/learn' },
  { key: 'time', label: 'Time clock', href: '#/time' },
  { key: 'reports', label: 'Monthly reports', href: '#/reports' },
  { key: 'meetings', label: 'Meetings', href: '#/meetings' },
  { key: 'sop', label: 'SOP Studio', href: '#/sop' },
  { key: 'people', label: 'People & access', href: '#/people' },
] as const

// Colour variables for a department's cards and headers.
export const departmentStyle = (color: string): CSSProperties => ({ '--vy-color': color, '--vy-foreground': color === '#231F20' ? '#fff' : '#231f20' } as CSSProperties)
