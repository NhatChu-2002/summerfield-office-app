import { useState } from 'react'
import { Clock3 } from 'lucide-react'
import { Popover } from 'radix-ui'
import { formatClockTime, parseClockTime } from '@/shared/lib/control-values'
import { SelectField } from './SelectField'

const hours = Array.from({ length: 12 }, (_, index) => ({ value: String(index + 1), label: String(index + 1).padStart(2, '0') }))
const minutes = Array.from({ length: 60 }, (_, index) => ({ value: String(index), label: String(index).padStart(2, '0') }))
const periods = [{ value: 'AM', label: 'AM' }, { value: 'PM', label: 'PM' }]

export function TimeField({ value, onChange, ariaLabel }: { value: string; onChange: (value: string) => void; ariaLabel?: string }) {
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const parsed = parseClockTime(value)
  const hour = parsed?.hour || 9
  const minute = parsed?.minute || 0
  const period = parsed?.period || 'AM'
  const container = trigger?.closest('dialog') as HTMLElement | null

  function change(nextHour = hour, nextMinute = minute, nextPeriod = period) {
    onChange(formatClockTime(nextHour, nextMinute, nextPeriod))
  }

  return <span className="vy-control vy-time-control">
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild><button ref={setTrigger} type="button" className="vy-control-trigger vy-date-trigger" aria-label={ariaLabel}>
        <span className={parsed ? '' : 'vy-control-placeholder'}>{parsed ? `${hour}:${String(minute).padStart(2, '0')} ${period}` : 'Choose time'}</span>
        <Clock3 size={17} strokeWidth={1.8} aria-hidden="true" />
      </button></Popover.Trigger>
      <Popover.Portal container={container || undefined}>
        <Popover.Content className="vy-time-popover" align="start" sideOffset={6} collisionPadding={8} data-control-popover>
          <span className="vy-time-caption">Set time</span>
          <div className="vy-time-segments">
            <SelectField ariaLabel="Hour" value={String(hour)} onChange={(next) => change(Number(next))} options={hours} />
            <span>:</span>
            <SelectField ariaLabel="Minute" value={String(minute)} onChange={(next) => change(hour, Number(next))} options={minutes} />
            <SelectField ariaLabel="AM or PM" value={period} onChange={(next) => change(hour, minute, next)} options={periods} />
          </div>
          <button type="button" className="vy-time-done" onClick={() => setOpen(false)}>Done</button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  </span>
}
