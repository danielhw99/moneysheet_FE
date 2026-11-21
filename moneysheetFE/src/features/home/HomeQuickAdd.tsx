import { useEffect, useId, useRef, useState } from 'react'
import Icon from '../../components/Icon'
import type { DailyRecordKind } from '../../types/navigation'

export default function HomeQuickAdd({ date, disabled, onSelect }: { date: string; disabled: boolean; onSelect: (kind: DailyRecordKind) => void }) {
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const optionsId = useId()
  useEffect(() => { if (disabled) setOpen(false) }, [disabled])
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.current?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  const choose = (kind: DailyRecordKind) => {
    if (disabled) return
    setOpen(false)
    trigger.current?.focus()
    onSelect(kind)
  }
  return <div className="home-quick-add" ref={container}>
    <button type="button" className="home-quick-trigger" ref={trigger} disabled={disabled} aria-label="빠른 작성" aria-expanded={open && !disabled} aria-controls={open && !disabled ? optionsId : undefined} onClick={() => { if (!disabled) setOpen(value => !value) }}><Icon name="plus" size={24}/></button>
    {open && !disabled && <nav id={optionsId} className="home-quick-options" aria-label="빠른 작성 항목">
      <p>{date}에 작성</p>
      <button type="button" onClick={() => choose('transactions')}><Icon name="daily" size={18}/>내역 작성</button>
      <button type="button" onClick={() => choose('memos')}><Icon name="edit" size={18}/>메모 작성</button>
      <button type="button" onClick={() => choose('fixed-pay')}><Icon name="wallet" size={18}/>고정지출 지급 작성</button>
    </nav>}
  </div>
}
