import { useEffect, useRef, useState } from 'react'

export default function AppSettings({ openGuide, disabled = false }: { openGuide: () => void; disabled?: boolean }) {
 const [open, setOpen] = useState(false)
 const container = useRef<HTMLDivElement>(null)
 const trigger = useRef<HTMLButtonElement>(null)
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
 return <div className="app-settings-dock" ref={container} onBlur={event => {
  if (event.relatedTarget instanceof Node && !container.current?.contains(event.relatedTarget)) setOpen(false)
 }}>
  <button ref={trigger} type="button" className="app-settings-trigger" aria-expanded={open} aria-controls="app-settings-options" disabled={disabled} onClick={() => setOpen(value => !value)}>앱 설정 <span aria-hidden="true">▾</span></button>
  {open && <nav id="app-settings-options" className="app-settings-dropdown" aria-label="앱 설정 항목">
   <button type="button" disabled>카테고리 관리 <small>준비 중</small></button>
   <button type="button" onClick={() => { setOpen(false); trigger.current?.focus(); openGuide() }}>사용 가이드</button>
  </nav>}
 </div>
}
