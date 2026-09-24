import { useEffect, useRef, useState, type FormEvent } from 'react'
import { DateField } from '@/shared/ui/DateField'
import { TimeField } from '@/shared/ui/TimeField'
import { todayLocal } from '@/shared/lib/format'
import type { TimeCorrection } from '../model'

export function CorrectionDialog({ date, onSave, onClose }: {
  date: string
  onSave: (request: TimeCorrection) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [day, setDay] = useState(date)
  const [desiredIn, setDesiredIn] = useState('')
  const [desiredOut, setDesiredOut] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { dialog.current?.showModal() }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!day || !reason.trim() || (!desiredIn && !desiredOut)) {
      setError('Choose a day, enter at least one corrected time, and explain what happened.')
      return
    }
    onSave({ id: crypto.randomUUID(), personId: 'preview-me', date: day, desiredIn, desiredOut,
      reason: reason.trim(), requestedAt: new Date().toISOString(), status: 'pending' })
  }

  return <dialog ref={dialog} className="vy-time-dialog" aria-labelledby="vy-time-dialog-title" onCancel={onClose} onClose={onClose}>
    <form onSubmit={submit}>
      <h2 id="vy-time-dialog-title">Ask to correct a time</h2>
      <p>This is a preview request only. It will not reach HR or change a recorded shift.</p>
      <label>Day<DateField value={day} onChange={(value) => { setDay(value); setError('') }} ariaLabel="Day to correct" required /></label>
      <div className="vy-time-form-row"><label>Clock in should be<TimeField value={desiredIn} onChange={(value) => { setDesiredIn(value); setError('') }} ariaLabel="Correct clock-in time" /></label>
        <label>Clock out should be<TimeField value={desiredOut} onChange={(value) => { setDesiredOut(value); setError('') }} ariaLabel="Correct clock-out time" /></label></div>
      <label>What happened<textarea autoFocus value={reason} onChange={(event) => { setReason(event.target.value); setError('') }} maxLength={600} rows={4} required /></label>
      {day > todayLocal() && <p className="vy-time-error">Choose today or an earlier day.</p>}
      {error && <p role="alert" className="vy-time-error">{error}</p>}
      <div className="vy-time-dialog-actions"><button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark" disabled={day > todayLocal()}>Add preview request</button></div>
    </form>
  </dialog>
}
