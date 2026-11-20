import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import RecordList from './RecordList'
import RecordForm from './RecordForm'
import type { MoneyRecord } from '../../data/models'
const date='2026-11-02'
const row:MoneyRecord={id:'51',date:'2026-11-01',time:'01:23',title:'이전 기록',amount:200,direction:'income',categoryId:'31',completedOn:null}
function service(){
 const api=createMockDataAccess({today:()=>date})
 vi.spyOn(api,'getCategories').mockResolvedValue([{id:'31',name:'용돈',scope:'mainTransaction',direction:'income'}])
 vi.spyOn(api,'getRecord').mockResolvedValue(row)
 vi.spyOn(api,'getRecords').mockResolvedValue({rows:[row],nextCursor:null,expenseTotal:0,incomeTotal:200,total:200,pendingMemoTotal:0})
 return api
}
it('saves an edit once, carries date/direction/category and continues with a new POST',async()=>{
 const api=service(),close=vi.fn(),update=vi.spyOn(api,'updateRecord').mockResolvedValue(row),create=vi.spyOn(api,'createRecord').mockResolvedValue({...row,id:'52'})
 render(<DataProvider implementation={api}><RecordList kind="transactions" date={date} changeDate={vi.fn()} go={vi.fn()} initialEntry={{id:'51'}} onCloseEntry={close}/></DataProvider>)
 expect(await screen.findByLabelText('내용')).toHaveValue('이전 기록')
 fireEvent.click(screen.getByRole('button',{name:'저장 및 계속 이어쓰기'}))
 await waitFor(()=>expect(screen.getByLabelText('내용')).toHaveValue(''))
 expect(close).not.toHaveBeenCalled();expect(update).toHaveBeenCalledTimes(1)
 expect(screen.getByLabelText('날짜')).toHaveValue(row.date)
 expect(screen.getByRole('button',{name:'입금'})).toHaveAttribute('aria-pressed','true')
 expect(screen.getByLabelText('입금 금액')).toHaveValue('')
 await waitFor(()=>expect(screen.getByLabelText('카테고리 (선택)')).toHaveValue('31'))
 expect(screen.queryByRole('button',{name:'삭제'})).not.toBeInTheDocument()
 fireEvent.change(screen.getByLabelText('내용'),{target:{value:'다음 기록'}})
 fireEvent.change(screen.getByLabelText('입금 금액'),{target:{value:'100'}})
 await waitFor(()=>expect(screen.getByRole('button',{name:'저장'})).toBeEnabled())
 fireEvent.click(screen.getByRole('button',{name:'저장'}))
 await waitFor(()=>expect(close).toHaveBeenCalledTimes(1))
 expect(update).toHaveBeenCalledTimes(1);expect(create).toHaveBeenCalledTimes(1)
 expect(create.mock.calls[0][0].input).toMatchObject({date:row.date,direction:'income',categoryId:'31',title:'다음 기록',amount:100})
 expect(create.mock.calls[0][1]?.idempotencyKey).toBeTruthy()
})
it('keeps failed continuation input/key then uses a fresh key for the next record',async()=>{
 const api=service(),close=vi.fn(),create=vi.spyOn(api,'createRecord').mockRejectedValueOnce(new Error('response lost')).mockResolvedValue(row)
 render(<DataProvider implementation={api}><RecordList kind="transactions" date={date} changeDate={vi.fn()} go={vi.fn()} initialEntry="new" onCloseEntry={close}/></DataProvider>)
 fireEvent.change(await screen.findByLabelText('내용'),{target:{value:'점심'}})
 fireEvent.change(screen.getByLabelText('지출 금액'),{target:{value:'100'}})
 const button=screen.getByRole('button',{name:'저장 및 계속 이어쓰기'})
 await waitFor(()=>expect(button).toBeEnabled());fireEvent.click(button)
 await screen.findByText('response lost')
 expect(screen.getByLabelText('내용')).toHaveValue('점심');expect(close).not.toHaveBeenCalled()
 const key=create.mock.calls[0][1]?.idempotencyKey
 fireEvent.click(button)
 await waitFor(()=>expect(screen.getByLabelText('내용')).toHaveValue(''))
 expect(create.mock.calls[1][1]?.idempotencyKey).toBe(key)
 fireEvent.change(screen.getByLabelText('내용'),{target:{value:'점심'}})
 fireEvent.change(screen.getByLabelText('지출 금액'),{target:{value:'100'}})
 const next=screen.getByRole('button',{name:'저장 및 계속 이어쓰기'})
 await waitFor(()=>expect(next).toBeEnabled());fireEvent.click(next)
 await waitFor(()=>expect(create).toHaveBeenCalledTimes(3))
 expect(create.mock.calls[2][1]?.idempotencyKey).not.toBe(key)
})
it('prevents Enter submission while composing Korean and admits a later normal save',async()=>{
 const save=vi.fn().mockResolvedValue(undefined),api=service()
 render(<DataProvider implementation={api}><RecordForm kind="transactions" initialDate={date} budget={null} refreshing={false} onSave={save} onDelete={vi.fn()} onCancel={vi.fn()}/></DataProvider>)
 const input=screen.getByLabelText('내용')
 fireEvent.change(screen.getByLabelText('지출 금액'),{target:{value:'100'}})
 fireEvent.compositionStart(input);fireEvent.change(input,{target:{value:'한글'}})
 expect(fireEvent.keyDown(input,{key:'Enter',code:'Enter',keyCode:229,isComposing:true})).toBe(false)
 fireEvent.submit(input.closest('form')!)
 expect(save).not.toHaveBeenCalled()
 fireEvent.compositionEnd(input)
 expect(fireEvent.keyDown(input,{key:'Enter',code:'Enter',keyCode:229})).toBe(false)
 await act(async()=>fireEvent.submit(input.closest('form')!))
 expect(save).toHaveBeenCalledTimes(1)
 expect(input).toHaveAttribute('lang','ko');expect(input).toHaveAttribute('inputmode','text')
})
it('resets saved time to now and focuses the empty content field',async()=>{
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-02T14:37:00'))
 try {
  const api=service();vi.spyOn(api,'updateRecord').mockResolvedValue(row)
  render(<DataProvider implementation={api}><RecordList kind="transactions" date={date} changeDate={vi.fn()} go={vi.fn()} initialEntry={{id:'51'}} onCloseEntry={vi.fn()}/></DataProvider>)
  await screen.findByLabelText('내용')
  expect(screen.getByRole('button',{name:'시간 선택: 01:23'})).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'저장 및 계속 이어쓰기'}))
  await waitFor(()=>expect(screen.getByLabelText('내용')).toHaveValue(''))
  expect(screen.getByRole('button',{name:'시간 선택: 14:37'})).toBeInTheDocument()
  await waitFor(()=>expect(screen.getByLabelText('내용')).toHaveFocus())
 } finally {cleanup();vi.useRealTimers()}
})
it('keeps a list-origin continuation in the editor and returns to the list on cancel',async()=>{
 const api=service(),go=vi.fn();vi.spyOn(api,'updateRecord').mockResolvedValue(row)
 render(<DataProvider implementation={api}><RecordList kind="transactions" date={date} changeDate={vi.fn()} go={go}/></DataProvider>)
 fireEvent.click(await screen.findByRole('button',{name:/이전 기록/}))
 fireEvent.click(screen.getByRole('button',{name:'저장 및 계속 이어쓰기'}))
 await waitFor(()=>expect(screen.getByLabelText('내용')).toHaveValue(''))
 fireEvent.click(screen.getByRole('button',{name:'취소'}))
 expect(await screen.findByRole('button',{name:'거래 추가'})).toBeInTheDocument()
 expect(go).not.toHaveBeenCalled()
})
it('admits only one write while continuation is pending and preserves failure input',async()=>{
 let reject!:(reason:Error)=>void
 const save=vi.fn(()=>new Promise<void>((_,fail)=>{reject=fail})),api=service()
 render(<DataProvider implementation={api}><RecordForm kind="transactions" initialDate={date} budget={null} refreshing={false} onSave={save} onDelete={vi.fn()} onCancel={vi.fn()}/></DataProvider>)
 const input=screen.getByLabelText('내용')
 fireEvent.change(input,{target:{value:'지출'}});fireEvent.change(screen.getByLabelText('지출 금액'),{target:{value:'100'}})
 const button=screen.getByRole('button',{name:'저장 및 계속 이어쓰기'})
 fireEvent.click(button);fireEvent.click(button);fireEvent.submit(input.closest('form')!)
 expect(save).toHaveBeenCalledTimes(1);expect(button).toBeDisabled()
 await act(async()=>reject(new Error('offline')))
 expect(input).toHaveValue('지출');expect(button).toBeEnabled()
})
it.each(['memos','fixed-pay','income','extra'] as const)('does not add continuation to %s',kind=>{
 render(<DataProvider implementation={service()}><RecordForm kind={kind} initialDate={date} budget={null} refreshing={false} onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()}/></DataProvider>)
 expect(screen.queryByRole('button',{name:'저장 및 계속 이어쓰기'})).not.toBeInTheDocument()
})
