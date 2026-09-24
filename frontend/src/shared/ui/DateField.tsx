import { lazy, Suspense, useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { Popover } from 'radix-ui'
import { formatIsoDate, parseIsoDate } from '@/shared/lib/control-values'

const DayPicker = lazy(() => import('react-day-picker').then((module) => ({ default: module.DayPicker })))

export function DateField({ value, onChange, name, min, required = false, ariaLabel }: {
  value: string
  onChange: (value: string) => void
  name?: string
  min?: string
  required?: boolean
  ariaLabel?: string
}) {
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const selected = parseIsoDate(value)
  const minimum = parseIsoDate(min || '')
  const container = trigger?.closest('dialog') as HTMLElement | null
  return <span className="vy-control vy-date-control">
    {name && <input type="hidden" name={name} value={value} />}
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild><button ref={setTrigger} type="button" className="vy-control-trigger vy-date-trigger" aria-label={ariaLabel} aria-required={required}>
        <span className={selected ? '' : 'vy-control-placeholder'}>{selected ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Choose date'}</span>
        <CalendarDays size={17} strokeWidth={1.8} aria-hidden="true" />
      </button></Popover.Trigger>
      <Popover.Portal container={container || undefined}>
        <Popover.Content className="vy-date-popover" align="start" sideOffset={6} collisionPadding={8}>
          <Suspense fallback={<div className="vy-date-loading" role="status">Loading calendar…</div>}>
            <DayPicker mode="single" selected={selected} defaultMonth={selected || minimum || new Date()} disabled={minimum ? { before: minimum } : undefined} onSelect={(date) => { if (date) { onChange(formatIsoDate(date)); setOpen(false) } }} showOutsideDays />
          </Suspense>
          {!required && value && <button type="button" className="vy-date-clear" onClick={() => { onChange(''); setOpen(false) }}><X size={14} /> Clear date</button>}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  </span>
}
