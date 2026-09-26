export function matchingDepartmentCodes(search: string, departments: { code: string; labels: string[] }[]): string[] {
  const term = search.trim().toLocaleLowerCase()
  if (!term) return []
  return departments.filter((department) => department.labels.some((label) => label.toLocaleLowerCase().includes(term)))
    .map((department) => department.code)
}

export function matchingStoreIds(search: string, stores: { id: string; name: string }[]): string[] {
  const term = search.trim().toLocaleLowerCase()
  if (!term) return []
  return stores.filter((store) => store.name.toLocaleLowerCase().includes(term)).map((store) => store.id)
}

export function historySearchFilter(search: string, departmentCodes: string[], storeIds: string[], includeDates = true): string {
  const literal = search.trim().slice(0, 120)
    .replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_').replaceAll('*', '\\*')
  const pattern = JSON.stringify(`%${literal}%`)
  const clauses = [`summary.ilike.${pattern}`]
  if (includeDates) clauses.push(`team_report_search_dates.ilike.${pattern}`)
  const codes = departmentCodes.filter((code) => /^[a-z_]+$/.test(code))
  const ids = storeIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id))
  if (codes.length) clauses.push(`department_code.in.(${codes.join(',')})`)
  if (ids.length) clauses.push(`store_id.in.(${ids.join(',')})`)
  return clauses.join(',')
}

export function isMissingDateSearch(error: { code?: string; message?: string } | null): boolean {
  return error?.code === '42703' && Boolean(error.message?.includes('team_report_search_dates'))
}
