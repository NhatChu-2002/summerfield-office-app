export type PreviewRole = 'admin' | 'manager' | 'member' | 'viewer'
export type PreviewPerson = {
  id: string
  name: string
  email: string
  role: PreviewRole
  departments: string[]
  position?: string
  phone?: string
}
export type PreviewRequest = { id: string; name: string; email: string; askedAt: string }

export const previewRoles: { value: PreviewRole; label: string; note: string }[] = [
  { value: 'admin', label: 'Admin', note: 'Prototype-wide settings and people administration.' },
  { value: 'manager', label: 'Manager', note: 'Prototype editing in assigned departments.' },
  { value: 'member', label: 'Team member', note: 'Prototype contribution to team records.' },
  { value: 'viewer', label: 'View only', note: 'Prototype reading without edits.' },
]

export function sortPreviewPeople(people: PreviewPerson[]): PreviewPerson[] {
  return [...people].sort((a, b) => previewRoles.findIndex((role) => role.value === a.role) - previewRoles.findIndex((role) => role.value === b.role)
    || a.name.localeCompare(b.name))
}

export function findPreviewPeople(people: PreviewPerson[], query: string): PreviewPerson[] {
  const needle = query.trim().toLocaleLowerCase()
  return sortPreviewPeople(people).filter((person) => !needle || `${person.name} ${person.email}`.toLocaleLowerCase().includes(needle))
}

export function togglePreviewDepartment(person: PreviewPerson, code: string): PreviewPerson {
  return { ...person, departments: person.departments.includes(code) ? person.departments.filter((item) => item !== code) : [...person.departments, code] }
}
