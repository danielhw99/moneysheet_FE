import { useState, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'type' | 'inputMode'> & {
  value?: string; defaultValue?: string; onValueChange?: (value: string) => void;
}

// Keep raw input as text to avoid losing integer precision. Amount validation stays at save boundaries.
export default function MoneyInput({ value, defaultValue = '', onValueChange, onBlur, onPaste, ...props }: Props) {
  const [localValue, setLocalValue] = useState(defaultValue)
  const update = (next: string) => {
    if (!/^[\d,]*$/.test(next)) return
    if (value === undefined) setLocalValue(next)
    onValueChange?.(next)
  }
  return <input {...props} type="text" inputMode="numeric" value={value ?? localValue}
    onChange={event => update(event.target.value)}
    onPaste={event => {
      onPaste?.(event)
      // Reject invalid pastes rather than turning e.g. 1.5 into 15 or -100 into 100.
      if (!/^[\d,]*$/.test(event.clipboardData.getData('text'))) event.preventDefault()
    }}
    onBlur={event => {
      const digits = event.target.value.replace(/,/g, '')
      update(digits.replace(/\B(?=(\d{3})+(?!\d))/g, ','))
      onBlur?.(event)
    }} />
}
