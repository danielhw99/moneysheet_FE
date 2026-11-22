import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { placeFloatingPanel, visibleViewportBounds } from '../utils/floatingPanel'

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
  const [position, setPosition] = useState<ReturnType<typeof placeFloatingPanel> | null>(null)
  const id = useId()
  const [hour, minute] = value.split(':').map(Number)
  useEffect(() => {
    if (!open) return
    const dismiss = (event: Event) => {
      if (event.target instanceof Node && !wrapper.current?.contains(event.target) && !panel.current?.contains(event.target)) setOpen(false)
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
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      if (!trigger.current) return
      const frame = trigger.current.closest('.phone-frame')
      const bounds = visibleViewportBounds(frame)
      const navigation = frame?.querySelector('.bottom-nav')?.getBoundingClientRect()
      if (navigation && navigation.height > 0 && navigation.top > bounds.top) bounds.bottom = Math.min(bounds.bottom, navigation.top - 8)
      setPosition(placeFloatingPanel(trigger.current.getBoundingClientRect(), bounds))
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    window.visualViewport?.addEventListener('resize', place)
    window.visualViewport?.addEventListener('scroll', place)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
      window.visualViewport?.removeEventListener('resize', place)
      window.visualViewport?.removeEventListener('scroll', place)
    }
  }, [open, step])
  useLayoutEffect(() => {
    if (!open || !position) return
    const selected = panel.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
    selected?.focus({ preventScroll: true })
    const options = selected?.parentElement
    if (options && selected) options.scrollTop = Math.max(0, selected.offsetTop - options.offsetTop - options.clientHeight / 2)
  }, [open, step, !!position])
  const close = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }) }
  return <div className="time-picker" ref={wrapper} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); close() }
  }}>
    <button ref={trigger} type="button" className="time-trigger" disabled={disabled} aria-label={`시간 선택: ${value}`} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => {
      if (open) { setOpen(false); return }
      setDraftHour(hour)
      setStep('hour')
      setOpen(true)
    }}>{hour < 12 ? '오전' : '오후'} {hour % 12 || 12}:{pad(minute)}</button>
    {open && !disabled && createPortal(<div className="time-picker-panel" id={id} ref={panel} role="group" aria-label={step === 'hour' ? '시 선택' : '분 선택'}
      style={position ? {left:position.left,top:position.top,width:position.width,maxHeight:position.maxHeight,transform:position.side === 'above' ? 'translateY(-100%)' : undefined} : {visibility:'hidden'}}>
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
    </div>, wrapper.current?.closest('.phone-frame') ?? document.body)}
  </div>
}
