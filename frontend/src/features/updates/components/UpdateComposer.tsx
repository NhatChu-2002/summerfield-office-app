import { useState, type FormEvent } from 'react'
import { errorText } from '@/shared/lib/format'
import { Notice } from '@/shared/ui/Notice'
import type { Access } from '@/features/auth'
import { postUpdate, type HqUpdate } from '../api'

export function UpdateComposer({ access, departmentCode, onPosted }: {
  access: Access; departmentCode: string; onPosted: (update: HqUpdate) => void
}) {
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!body.trim()) return
    setPosting(true); setError('')
    try {
      const update = await postUpdate(access, departmentCode, body)
      onPosted(update)
      setBody('')
    } catch (cause) { setError(errorText(cause)) }
    finally { setPosting(false) }
  }

  return <form className="update-compose" onSubmit={submit}><label className="sr-only" htmlFor="update-body">Write a department update</label><textarea id="update-body" value={body} onChange={(event) => setBody(event.target.value)} rows={3} maxLength={2000} placeholder="Share progress, a blocker, or a decision…" required /><div className="compose-foot"><span>{body.length}/2000</span><button className="button button-small button-dark" disabled={posting || !body.trim()} type="submit">{posting ? 'Posting…' : 'Post update'}</button></div>{error && <Notice>{error}</Notice>}</form>
}
