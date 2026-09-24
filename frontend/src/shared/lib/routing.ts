import { useEffect, useState } from 'react'

// Hash routes keep the static host simple: every path serves the same index.html.
export type Route = { page: string; code?: string; month?: string }

function currentRoute(): Route {
  const path = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (path[0] === 'department' && path[1]) return { page: 'department', code: path[1] }
  if (path[0] === 'project' && path[1]) return { page: 'project', code: decodeURIComponent(path[1]) }
  if (path[0] === 'location' && path[1]) return { page: 'location', code: decodeURIComponent(path[1]) }
  if (path[0] === 'lesson' && path[1]) return { page: 'lesson', code: decodeURIComponent(path[1]) }
  if (path[0] === 'report' && path[1] && path[2]) return { page: 'report', code: decodeURIComponent(path[1]), month: path[2] }
  if (path[0] === 'reports' && path[1]) return { page: 'reports', month: path[1] }
  return { page: path[0] || 'dashboard' }
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(currentRoute)
  useEffect(() => {
    const update = () => { setRoute(currentRoute()); window.scrollTo({ top: 0 }) }
    window.addEventListener('hashchange', update)
    return () => window.removeEventListener('hashchange', update)
  }, [])
  return route
}

export const deptHref = (code: string) => `#/department/${code}`
export const projectHref = (id: string) => `#/project/${encodeURIComponent(id)}`
