import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ReferenceDepartment } from '@/shared/config/reference-departments'
import { SelectField } from '@/shared/ui/SelectField'
import type { ContactProfile, Person } from '../model'

const ways = ['Text me', 'Call me', 'Email me', 'Message in HQ', 'Connecteam']

export function ProfileDialog({ person, profile, departments, people, onSave, onClose }: {
  person: Person
  profile?: ContactProfile
  departments: ReferenceDepartment[]
  people: Person[]
  onSave: (profile: ContactProfile) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [department, setDepartment] = useState(profile?.department || departments[0]?.code || '')
  const [best, setBest] = useState(profile?.best || ways[0])
  const [backup, setBackup] = useState(profile?.backup || '')
  useEffect(() => { dialog.current?.showModal(); input.current?.focus() }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const get = (key: string) => String(fields.get(key) || '').trim()
    onSave({ id: person.id, title: get('title'), department, phone: get('phone'), email: get('email'),
      best, hours: get('hours'), based: get('based'), backup, notes: get('notes') })
  }

  return <dialog ref={dialog} className="vy-own-dialog" aria-labelledby="vy-profile-dialog-title" onClose={onClose} onCancel={onClose}>
    <form className="vy-own-form" onSubmit={submit}>
      <h2 id="vy-profile-dialog-title">{person.name}'s contact details</h2>
      <p>The team sees these details on the directory.</p>
      <div className="vy-own-form-grid">
        <label>Your role<input ref={input} name="title" required maxLength={100} defaultValue={profile?.title || ''} placeholder="Store Manager, R&D Lead" /></label>
        <label>Department<SelectField name="department" value={department} onChange={setDepartment} options={departments.map((item) => ({ value: item.code, label: item.name }))} /></label>
        <label>Phone<input name="phone" type="tel" maxLength={40} defaultValue={profile?.phone || ''} /></label>
        <label>Work email<input name="email" type="email" maxLength={180} defaultValue={profile?.email || ''} /></label>
        <label>Best way to reach you<SelectField name="best" value={best} onChange={setBest} options={ways.map((value) => ({ value, label: value }))} /></label>
        <label>When you are usually around<input name="hours" maxLength={100} defaultValue={profile?.hours || ''} /></label>
        <label>Usually based at<input name="based" maxLength={100} defaultValue={profile?.based || ''} /></label>
        <label>Who covers you when you are off<SelectField name="backup" value={backup} onChange={setBackup} options={[{ value: '', label: 'Nobody yet' }, ...people.filter((item) => item.id !== person.id).map((item) => ({ value: item.id, label: item.name }))]} /></label>
        <label className="vy-own-wide">Anything else people should know<textarea name="notes" rows={2} maxLength={400} defaultValue={profile?.notes || ''} /></label>
      </div>
      <div className="vy-own-dialog-actions"><button type="button" className="vy-button" onClick={onClose}>Cancel</button><button type="submit" className="vy-button vy-button-dark">Save</button></div>
    </form>
  </dialog>
}
