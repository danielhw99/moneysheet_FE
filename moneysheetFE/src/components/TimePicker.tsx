import { useEffect, useId, useRef, useState } from 'react'

const pad = (value: number) => String(value).padStart(2, '0')

export default function TimePicker({ value, onChange, disabled = false }: {
  value: string; onChange: (value: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'hour' | 'minute'>('hour')
  const [draftHour, setDraftHour] = useState(0)
  const wrapper = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()
  const [hour, minute] = value.split(':').map(Number)
  useEffect(() => {
    if (!open) return
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && !wrapper.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    document.addEventListener('focusin', dismiss)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      document.removeEventListener('focusin', dismiss)
    }
  }, [open])
  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus()
  }, [open, step])
  const close = () => { setOpen(false); trigger.current?.focus() }
  return <div className="time-picker" ref={wrapper} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); close() }
  }}>
    <button ref={trigger} type="button" className="time-trigger" disabled={disabled} aria-label={`시간 선택: ${value}`} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => {
      if (open) { setOpen(false); return }
      setDraftHour(hour)
      setStep('hour')
      setOpen(true)
    }}>{hour < 12 ? '오전' : '오후'} {hour % 12 || 12}:{pad(minute)}</button>
    {open && <div className="time-picker-panel" id={id} ref={panel} role="group" aria-label={step === 'hour' ? '시 선택' : '분 선택'}>
      <div className="time-picker-heading"><b>{step === 'hour' ? '시 선택' : `${pad(draftHour)}시 · 분 선택`}</b>
        {step === 'minute' && <button type="button" onClick={() => setStep('hour')}>시 다시 선택</button>}
        <button type="button" onClick={close}>취소</button>
      </div>
      <div className="time-picker-options">
        {Array.from({ length: step === 'hour' ? 24 : 60 }, (_, option) => <button type="button" key={option} aria-pressed={step === 'hour' ? option === draftHour : option === minute} aria-label={`${pad(option)}${step === 'hour' ? '시' : '분'}`} onClick={() => {
          if (step === 'hour') { setDraftHour(option); setStep('minute'); return }
          onChange(`${pad(draftHour)}:${pad(option)}`)
          close()
        }}>{pad(option)}</button>)}
      </div>
    </div>}
  </div>
}
