export type ReportCursor = { updated_at: string; id: string }

export function historyCursorFilter(cursor: ReportCursor): string {
  const timestamp = JSON.stringify(cursor.updated_at)
  return `updated_at.lt.${timestamp},and(updated_at.eq.${timestamp},id.lt.${cursor.id})`
}
