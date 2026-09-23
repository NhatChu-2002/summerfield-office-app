import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { errorText } from '@/shared/lib/format'
import { useToast } from '@/shared/ui/toast'
import type { Access } from '@/features/auth'
import { listDepartmentPeople, loadTasks, setTaskStatus, type HqTask, type PeopleNames } from '@/features/tasks'
import { loadUpdates, type HqUpdate } from '@/features/updates'

type HqData = {
  tasks: HqTask[]
  updates: HqUpdate[]
  /** True once both lists have loaded for this organization. */
  dataReady: boolean
  loading: boolean
  error: string
  refresh: () => Promise<void>
  busyTaskId: string | null
  /** Teammates' display names, looked up for departments whose tasks involve someone else. */
  names: PeopleNames
  toggleTask: (task: HqTask) => Promise<void>
  /** Adds a record created on this screen. Returns false if it belongs to another organization. */
  addTask: (task: HqTask) => boolean
  addUpdate: (update: HqUpdate) => boolean
}

const HqDataContext = createContext<HqData | null>(null)

// Tasks and updates for one organization. Mount it with a `key` of the user and organization,
// so switching either starts fresh and late responses for the old one are dropped.
export function HqDataProvider({ access, children }: { access: Access; children: ReactNode }) {
  const toast = useToast()
  const organizationId = access.organization.organization_id
  const [tasks, setTasks] = useState<HqTask[]>([])
  const [updates, setUpdates] = useState<HqUpdate[]>([])
  const [dataReady, setDataReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [names, setNames] = useState<PeopleNames>({})
  const namedDepartments = useRef(new Set<string>())
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [nextTasks, nextUpdates] = await Promise.all([loadTasks(organizationId), loadUpdates(organizationId)])
      if (mounted.current) { setTasks(nextTasks); setUpdates(nextUpdates); setDataReady(true) }
    } catch (cause) {
      if (mounted.current) { setError(errorText(cause)); setDataReady(false) }
    } finally {
      if (mounted.current) setLoading(false)
    }
  }, [organizationId])

  useEffect(() => { void refresh() }, [refresh])

  // Look up each department's people once, and only where a task involves someone other than you.
  useEffect(() => {
    const needed = new Set(tasks.filter((task) => (task.assigned_to && task.assigned_to !== access.userId) || task.created_by !== access.userId)
      .map((task) => task.department_code))
    const missing = [...needed].filter((code) => !namedDepartments.current.has(code))
    if (!missing.length) return
    missing.forEach((code) => namedDepartments.current.add(code))
    void Promise.allSettled(missing.map((code) => listDepartmentPeople(organizationId, code))).then((results) => {
      if (!mounted.current) return
      const found: PeopleNames = {}
      for (const result of results) if (result.status === 'fulfilled') for (const person of result.value) found[person.user_id] = person.display_name
      setNames((current) => ({ ...current, ...found }))
    })
  }, [tasks, access.userId, organizationId])

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    const timer = window.setInterval(onVisible, 60_000)
    return () => { document.removeEventListener('visibilitychange', onVisible); window.clearInterval(timer) }
  }, [refresh])

  const toggleTask = useCallback(async (task: HqTask) => {
    if (busyTaskId) return
    setBusyTaskId(task.id)
    try {
      const changed = await setTaskStatus(access, task, task.status === 'open' ? 'done' : 'open')
      if (mounted.current && changed.organization_id === organizationId) {
        setTasks((list) => list.map((item) => item.id === changed.id ? changed : item))
        toast(changed.status === 'done' ? 'Task completed.' : 'Task reopened.')
      }
    } catch (cause) {
      if (mounted.current) { toast(errorText(cause)); void refresh() }
    }
    finally { if (mounted.current) setBusyTaskId(null) }
  }, [access, busyTaskId, organizationId, refresh, toast])

  const addTask = useCallback((task: HqTask) => {
    if (!mounted.current || task.organization_id !== organizationId) return false
    setTasks((list) => [task, ...list])
    return true
  }, [organizationId])

  const addUpdate = useCallback((update: HqUpdate) => {
    if (!mounted.current || update.organization_id !== organizationId) return false
    setUpdates((list) => [update, ...list])
    return true
  }, [organizationId])

  return <HqDataContext.Provider value={{ tasks, updates, dataReady, loading, error, refresh, busyTaskId, names, toggleTask, addTask, addUpdate }}>
    {children}
  </HqDataContext.Provider>
}

export function useHqData() {
  const data = useContext(HqDataContext)
  if (!data) throw new Error('useHqData must be used inside HqDataProvider.')
  return data
}
