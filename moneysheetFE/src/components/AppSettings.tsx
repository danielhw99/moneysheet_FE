import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import InstallAppGuide from '../pwa/InstallAppGuide'

export default function AppSettings({ openGuide, openCategories, openFood, disabled = false }: { openGuide: () => void; openCategories?: () => void; openFood?: () => void; disabled?: boolean }) {
 const [open, setOpen] = useState(false)
 const [installOpen, setInstallOpen] = useState(false)
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
  <button ref={trigger} type="button" className="app-settings-trigger" aria-label="앱 설정" title="앱 설정" aria-expanded={open} aria-controls="app-settings-options" disabled={disabled} onClick={() => setOpen(value => !value)}><Icon name="settings" /></button>
  {open && <nav id="app-settings-options" className="app-settings-dropdown" aria-label="앱 설정 항목">
   <button type="button" disabled={disabled || !openCategories} onClick={() => { if (disabled || !openCategories) return; setOpen(false); trigger.current?.focus(); openCategories() }}>카테고리 관리</button>
   {openFood && <button type="button" disabled={disabled} onClick={()=>{if(disabled)return;setOpen(false);trigger.current?.focus();openFood()}}>식비 설정</button>}
   <button type="button" disabled={disabled} onClick={() => { if (disabled) return; setOpen(false); trigger.current?.focus(); openGuide() }}>사용 가이드</button>
   <button type="button" disabled={disabled} onClick={() => { if (disabled) return; setOpen(false); trigger.current?.focus(); setInstallOpen(true) }}>앱 설치 안내</button>
  </nav>}
  <InstallAppGuide open={installOpen} onClose={() => setInstallOpen(false)} triggerRef={trigger} />
 </div>
}
