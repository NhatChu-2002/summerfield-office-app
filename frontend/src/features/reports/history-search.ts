export function matchingDepartmentCodes(search: string, departments: { code: string; labels: string[] }[]): string[] {
  const term = search.trim().toLocaleLowerCase()
  if (!term) return []
  return departments.filter((department) => department.labels.some((label) => label.toLocaleLowerCase().includes(term)))
    .map((department) => department.code)
}

export function historySearchFilter(search: string, departmentCodes: string[]): string {
  const literal = search.trim().slice(0, 120)
    .replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_').replaceAll('*', '\\*')
  const clauses = [`summary.ilike.${JSON.stringify(`%${literal}%`)}`]
  const codes = departmentCodes.filter((code) => /^[a-z_]+$/.test(code))
  if (codes.length) clauses.push(`department_code.in.(${codes.join(',')})`)
  return clauses.join(',')
}
