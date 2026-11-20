import { useRef, useState } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import FeedbackDialog from './FeedbackDialog'
beforeEach(()=>{
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
})
function Host({mode='confirm',confirm=vi.fn(),hideTrigger=false,focusAfterConfirm='trigger'}:{mode?:'confirm'|'alert';confirm?:()=>void|Promise<void>;hideTrigger?:boolean;focusAfterConfirm?:'trigger'|'fallback'}){
 const [open,setOpen]=useState(false),fallback=useRef<HTMLElement>(null)
 return <><section ref={fallback} tabIndex={-1} aria-label="fallback"/>{!hideTrigger&&<button onClick={()=>setOpen(true)}>열기</button>}
 <FeedbackDialog open={open} mode={mode} title="안내 제목" description="안내 내용" onConfirm={confirm} onClose={()=>setOpen(false)} fallbackFocusRef={fallback} focusAfterConfirm={focusAfterConfirm}/></>
}
it('focuses cancel in a confirm dialog, cancels without action and restores the trigger',async()=>{
 const confirm=vi.fn();render(<Host confirm={confirm}/>)
 const trigger=screen.getByRole('button',{name:'열기'});await userEvent.click(trigger)
 expect(screen.getByRole('dialog',{name:'안내 제목'})).toBeInTheDocument()
 expect(screen.getByRole('button',{name:'취소'})).toHaveFocus()
 await userEvent.click(screen.getByRole('button',{name:'취소'}))
 expect(confirm).not.toHaveBeenCalled();expect(trigger).toHaveFocus()
})
it('provides a single confirmation action for alert mode',async()=>{
 const confirm=vi.fn();render(<Host mode="alert" confirm={confirm}/>)
 await userEvent.click(screen.getByRole('button',{name:'열기'}))
 expect(screen.getByRole('alertdialog',{name:'안내 제목'})).toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'취소'})).not.toBeInTheDocument()
 expect(screen.getByRole('button',{name:'확인'})).toHaveFocus()
 await userEvent.click(screen.getByRole('button',{name:'확인'}))
 await waitFor(()=>expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
 expect(confirm).toHaveBeenCalledTimes(1)
})
it('wraps keyboard focus between the first and last dialog controls',async()=>{
 render(<Host/>);await userEvent.click(screen.getByRole('button',{name:'열기'}))
 const first=screen.getByRole('button',{name:'취소'}),last=screen.getByRole('button',{name:'확인'})
 expect(fireEvent.keyDown(first,{key:'Tab',shiftKey:true})).toBe(false)
 expect(last).toHaveFocus()
 expect(fireEvent.keyDown(last,{key:'Tab'})).toBe(false)
 expect(first).toHaveFocus()
})
it.each(['escape','backdrop'])('treats %s as cancel, never confirmation',async method=>{
 const confirm=vi.fn();render(<Host confirm={confirm}/>)
 await userEvent.click(screen.getByRole('button',{name:'열기'}))
 const dialog=screen.getByRole('dialog')
 if(method==='escape')fireEvent(dialog,new Event('cancel',{cancelable:true}))
 else fireEvent.click(dialog,{clientX:-10,clientY:-10})
 expect(confirm).not.toHaveBeenCalled();expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
it('blocks duplicate confirmation and dismissal while pending then allows retry after failure',async()=>{
 let fail!:(e:Error)=>void
 const confirm=vi.fn().mockImplementationOnce(()=>new Promise<void>((_,reject)=>{fail=reject})).mockResolvedValue(undefined)
 render(<Host confirm={confirm}/>);await userEvent.click(screen.getByRole('button',{name:'열기'}))
 const button=screen.getByRole('button',{name:'확인'}),dialog=screen.getByRole('dialog')
 fireEvent.click(button);fireEvent.click(button)
 expect(confirm).toHaveBeenCalledTimes(1);expect(button).toBeDisabled();expect(screen.getByRole('button',{name:'취소'})).toBeDisabled()
 fireEvent(dialog,new Event('cancel',{cancelable:true}));fireEvent.click(dialog,{clientX:-10,clientY:-10})
 expect(dialog).toBeInTheDocument()
 await act(async()=>fail(new Error('save failed')))
 expect(screen.getByRole('alert')).toHaveTextContent('save failed');expect(button).toBeEnabled()
 fireEvent.click(button)
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument());expect(confirm).toHaveBeenCalledTimes(2)
})
it('ignores a delayed old action after the dialog closes and reopens',async()=>{
 let done!:()=>void;const confirm=vi.fn(()=>new Promise<void>(resolve=>{done=resolve})),close=vi.fn()
 const props={mode:'confirm' as const,title:'Confirm',description:'Detail',onConfirm:confirm,onClose:close}
 const view=render(<FeedbackDialog {...props} open/>)
 fireEvent.click(screen.getByRole('button',{name:'확인'}))
 view.rerender(<FeedbackDialog {...props} open={false}/>);view.rerender(<FeedbackDialog {...props} open/>)
 await act(async()=>done())
 expect(close).not.toHaveBeenCalled();expect(screen.getByRole('dialog')).toBeInTheDocument()
})
it('falls back to the owner section when the deleted trigger no longer exists',async()=>{
 const view=render(<Host/>);await userEvent.click(screen.getByRole('button',{name:'열기'}))
 view.rerender(<Host hideTrigger/>)
 await userEvent.click(screen.getByRole('button',{name:'취소'}))
 expect(screen.getByRole('region',{name:'fallback'})).toHaveFocus()
})
it('can focus a stable owner after confirmation before asynchronous trigger removal',async()=>{
 render(<Host focusAfterConfirm="fallback"/>);await userEvent.click(screen.getByRole('button',{name:'열기'}))
 await userEvent.click(screen.getByRole('button',{name:'확인'}))
 await waitFor(()=>expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
 expect(screen.getByRole('button',{name:'열기'})).toBeInTheDocument()
 expect(screen.getByRole('region',{name:'fallback'})).toHaveFocus()
})
