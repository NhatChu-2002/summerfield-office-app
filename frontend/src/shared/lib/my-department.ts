import { useCallback, useEffect, useState } from 'react'

const KEY = 'sfhq_my_department'
const EVENT = 'sfhq-my-department'

function read() {
  try { return localStorage.getItem(KEY) || '' } catch { return '' }
}

// The department a person calls theirs, saved in this browser and kept in sync across open screens.
export function useMyDepartment() {
  const [code, setCode] = useState(read)
  useEffect(() => {
    const update = () => setCode(read())
    window.addEventListener(EVENT, update)
    return () => window.removeEventListener(EVENT, update)
  }, [])
  const choose = useCallback((next: string) => {
    try { localStorage.setItem(KEY, next) } catch { /* Keep the choice for this page only. */ }
    setCode(next)
    window.dispatchEvent(new Event(EVENT))
  }, [])
  return [code, choose] as const
}
