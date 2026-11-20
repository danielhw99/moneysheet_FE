import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { errorMessage } from '../data/DataProvider'

type Props = {
 open: boolean; mode: 'confirm' | 'alert'; title: string; description: string;
 confirmLabel?: string; cancelLabel?: string; danger?: boolean; confirmDisabled?: boolean;
 onConfirm?: () => void | Promise<void>; onClose: () => void;
 fallbackFocusRef?: RefObject<HTMLElement | null>;
 focusAfterConfirm?: 'trigger' | 'fallback';
}
export default function FeedbackDialog({open,mode,title,description,confirmLabel='확인',cancelLabel='취소',danger=false,confirmDisabled=false,onConfirm,onClose,fallbackFocusRef,focusAfterConfirm='trigger'}:Props) {
 const dialog=useRef<HTMLDialogElement>(null),initialFocus=useRef<HTMLButtonElement>(null)
 const progressFocus=useRef<HTMLParagraphElement>(null)
 const epoch=useRef(0),working=useRef(false)
 const confirmedFallback=useRef(false)
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 const id=useId()
 useEffect(()=>{
  epoch.current++;working.current=false;confirmedFallback.current=false;setBusy(false);setError('')
  if(!open || !dialog.current)return
  const element=dialog.current,opener=document.activeElement instanceof HTMLElement?document.activeElement:null
  if(!element.open)element.showModal()
  initialFocus.current?.focus()
  return ()=>{
   epoch.current++
   if(element.open)element.close()
   const fallback=fallbackFocusRef?.current
   const useFallback=confirmedFallback.current && fallback?.isConnected
   const canRestore=!useFallback && opener?.isConnected && opener!==document.body && opener!==document.documentElement
   if(canRestore)opener.focus({preventScroll:true})
   if(!canRestore || document.activeElement!==opener)fallback?.focus({preventScroll:true})
  }
 },[open,mode,fallbackFocusRef])
 useEffect(()=>{
  if(busy)progressFocus.current?.focus()
  else if(error)dialog.current?.querySelector<HTMLButtonElement>('[data-feedback-confirm]')?.focus()
 },[busy,error])
 const dismiss=()=>{if(!working.current)onClose()}
 const confirm=async()=>{
  if(!open || working.current || confirmDisabled)return
  const ticket=epoch.current
  working.current=true;setBusy(true);setError('')
  try {
   await onConfirm?.()
   if(ticket===epoch.current){confirmedFallback.current=focusAfterConfirm==='fallback';onClose()}
  } catch(failure) {if(ticket===epoch.current)setError(errorMessage(failure))}
  finally {if(ticket===epoch.current){working.current=false;setBusy(false)}}
 }
 if(!open)return null
 return <dialog ref={dialog} className="feedback-dialog" role={mode==='alert'?'alertdialog':'dialog'} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} aria-busy={busy}
  onKeyDown={event=>{
   if(event.key!=='Tab')return
   const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]'))
   const first=controls[0],last=controls.at(-1)
   if(!first){event.preventDefault();return}
   if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus()}
   else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus()}
  }}
  onCancel={event=>{event.preventDefault();dismiss()}}
  onClick={event=>{
   if(event.target!==event.currentTarget)return
   const rect=event.currentTarget.getBoundingClientRect()
   if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)dismiss()
  }}>
  <div className="feedback-dialog-body">
   <h2 id={`${id}-title`}>{title}</h2><p id={`${id}-description`}>{description}</p>
   {error&&<p className="field-error" role="alert">{error}</p>}
   {busy&&<p ref={progressFocus} className="form-help" role="status" tabIndex={0}>처리 중…</p>}
  </div>
  <div className="feedback-dialog-actions">
   {mode==='confirm'&&<button ref={initialFocus} type="button" className="secondary-button" disabled={busy} onClick={dismiss}>{cancelLabel}</button>}
   <button data-feedback-confirm ref={mode==='alert'?initialFocus:undefined} type="button" className={`primary-button ${danger?'feedback-dialog-danger':''}`} disabled={busy||confirmDisabled} onClick={()=>void confirm()}>{confirmLabel}</button>
  </div>
 </dialog>
}
