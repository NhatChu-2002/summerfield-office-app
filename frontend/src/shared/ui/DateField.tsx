import { lazy, Suspense, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Popover } from 'radix-ui'
import { formatIsoDate, parseIsoDate } from '@/shared/lib/control-values'
import { SelectField } from './SelectField'

const DayPicker = lazy(() => import('react-day-picker').then((module) => ({ default: module.DayPicker })))
const months = Array.from({ length: 12 }, (_, index) => ({
  value: String(index), label: new Date(2020, index, 1).toLocaleDateString('en-US', { month: 'long' }),
}))

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
  const [month, setMonth] = useState(() => selected || minimum || new Date())
  const firstYear = minimum?.getFullYear() ?? Math.min(1900, selected?.getFullYear() ?? 1900)
  const lastYear = Math.max(2100, selected?.getFullYear() ?? 0, minimum?.getFullYear() ?? 0)
  const firstMonth = new Date(firstYear, minimum && firstYear === minimum.getFullYear() ? minimum.getMonth() : 0, 1)
  const lastMonth = new Date(lastYear, 11, 1)
  const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1)
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const yearOptions = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => ({ value: String(firstYear + index), label: String(firstYear + index) }))
  const monthOptions = months.filter((item) => month.getFullYear() !== firstYear || Number(item.value) >= firstMonth.getMonth())
  const container = trigger?.closest('dialog') as HTMLElement | null
  return <span className="vy-control vy-date-control">
    {name && <input type="hidden" name={name} value={value} />}
    <Popover.Root open={open} onOpenChange={(next) => { if (next) setMonth(selected || minimum || new Date()); setOpen(next) }}>
      <Popover.Trigger asChild><button ref={setTrigger} type="button" className="vy-control-trigger vy-date-trigger" aria-label={ariaLabel} aria-required={required}>
        <span className={selected ? '' : 'vy-control-placeholder'}>{selected ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Choose date'}</span>
        <CalendarDays size={17} strokeWidth={1.8} aria-hidden="true" />
      </button></Popover.Trigger>
      <Popover.Portal container={container || undefined}>
        <Popover.Content className="vy-date-popover" align="start" sideOffset={6} collisionPadding={8} data-control-popover>
          <div className="vy-date-header">
            <button type="button" className="vy-date-nav" aria-label="Previous month" disabled={previousMonth < firstMonth} onClick={() => setMonth(previousMonth)}><ChevronLeft size={16} /></button>
            <SelectField ariaLabel="Month" value={String(month.getMonth())} onChange={(next) => setMonth(new Date(month.getFullYear(), Number(next), 1))} options={monthOptions} size="compact" />
            <SelectField ariaLabel="Year" value={String(month.getFullYear())} onChange={(next) => setMonth(new Date(Number(next), Number(next) === firstYear ? Math.max(month.getMonth(), firstMonth.getMonth()) : month.getMonth(), 1))} options={yearOptions} size="compact" />
            <button type="button" className="vy-date-nav" aria-label="Next month" disabled={nextMonth > lastMonth} onClick={() => setMonth(nextMonth)}><ChevronRight size={16} /></button>
          </div>
          <Suspense fallback={<div className="vy-date-loading" role="status">Loading calendar…</div>}>
            <DayPicker mode="single" selected={selected} month={month} onMonthChange={setMonth} startMonth={firstMonth} endMonth={lastMonth} hideNavigation disabled={minimum ? { before: minimum } : undefined} onSelect={(date) => { if (date) { onChange(formatIsoDate(date)); setOpen(false) } }} showOutsideDays />
          </Suspense>
          {!required && value && <button type="button" className="vy-date-clear" onClick={() => { onChange(''); setOpen(false) }}><X size={14} /> Clear date</button>}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  </span>
}
