import { useState } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Select } from 'radix-ui'

export type SelectOption = { value: string; label: string }

const emptyValue = '__vy_empty__'

export function SelectField({ value, onChange, options, name, ariaLabel, size = 'regular', disabled = false }: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  name?: string
  ariaLabel?: string
  size?: 'regular' | 'compact'
  disabled?: boolean
}) {
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null)
  const container = trigger?.closest('[data-control-popover], dialog') as HTMLElement | null
  return <span className={`vy-control vy-control-${size}`}>
    <Select.Root name={name} value={value || emptyValue} onValueChange={(next) => onChange(next === emptyValue ? '' : next)} disabled={disabled}>
      <Select.Trigger ref={setTrigger} className="vy-control-trigger" aria-label={ariaLabel}>
        <Select.Value />
        <Select.Icon><ChevronDown size={16} strokeWidth={1.8} /></Select.Icon>
      </Select.Trigger>
      <Select.Portal container={container || undefined}>
        <Select.Content className="vy-control-menu" position="popper" align="start" sideOffset={5} collisionPadding={8}>
          <Select.ScrollUpButton className="vy-control-scroll"><ChevronUp size={15} /></Select.ScrollUpButton>
          <Select.Viewport className="vy-control-options">
            {options.map((option) => <Select.Item key={option.value} value={option.value || emptyValue} className="vy-control-option">
              <Select.ItemText>{option.label}</Select.ItemText>
              <Select.ItemIndicator><Check size={15} strokeWidth={2} /></Select.ItemIndicator>
            </Select.Item>)}
          </Select.Viewport>
          <Select.ScrollDownButton className="vy-control-scroll"><ChevronDown size={15} /></Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </span>
}
