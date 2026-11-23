import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import Daily from '../daily/DailyScreen'
import RecordList from './RecordList'
import type { MoneyRecord } from '../../data/models'
const date='2026-11-02'
const record:MoneyRecord={id:'501',date,time:'12:30',title:'Existing',amount:100,direction:'expense',categoryId:null,budgetItemId:'51',completedOn:null}
const page={rows:[],nextCursor:null,expenseTotal:0,incomeTotal:0,total:0,pendingMemoTotal:0}
function service(){
 const api=createMockDataAccess({today:()=>date})
 vi.spyOn(api,'getRecords').mockResolvedValue(page)
 vi.spyOn(api,'getRecord').mockResolvedValue(record)
 vi.spyOn(api,'getBudget').mockResolvedValue({month:'2026-11',items:[{id:'51',name:'Rent',categoryId:null,amount:10000,paid:100,remaining:9900,complete:false}],food:{paymentMode: 'threeInstallments', weekday:100,saturday:100,sunday:100},fixedTotal:10000,foodSummary:{total:3000,installments:[1100,1000,900]}})
 return api
}
it.each([
 ['transactions','내역','내역 추가'],['memos','메모','메모 추가'],['fixed-pay','고정지출','지급 기록'],
] as const)('routes Daily %s rows/add directly and keeps its header opening the list',async(kind,title,add)=>{
 const api=service(),openRecord=vi.fn(),go=vi.fn()
 const base=await api.getDaily(date)
 vi.spyOn(api,'getDaily').mockResolvedValue({...base,transactions:[{...record,title:'Transaction'}],activeMemos:[{...record,id:'502',title:'Memo',date:'2026-11-01'}],payments:[{record:{...record,id:'503'},itemName:'Rent',paid:100,remaining:9900,complete:false}]})
 render(<DataProvider implementation={api}><Daily date={date} go={go} openRecord={openRecord}/></DataProvider>)
 await screen.findByText('Transaction')
 fireEvent.click(screen.getByRole('button',{name:add}))
 expect(openRecord).toHaveBeenLastCalledWith(kind,'new')
 fireEvent.click(screen.getByRole('button',{name:kind==='transactions'?/Transaction/:kind==='memos'?/Memo/:/Rent/}))
 expect(openRecord).toHaveBeenLastCalledWith(kind,{id:kind==='transactions'?'501':kind==='memos'?'502':'503'})
 fireEvent.click(screen.getByRole('button',{name:title}))
 expect(go).toHaveBeenLastCalledWith(kind)
})
it.each(['transactions','memos','fixed-pay'] as const)('opens %s by ID even with an empty list and returns on cancel',async kind=>{
 const api=service(),close=vi.fn()
 render(<DataProvider implementation={api}><RecordList kind={kind} date={date} changeDate={vi.fn()} go={vi.fn()} initialEntry={{id:'501'}} onCloseEntry={close}/></DataProvider>)
 await screen.findByRole('button',{name:'취소'})
 expect(api.getRecord).toHaveBeenCalledWith(kind,'2026-11','501')
 expect(screen.queryByRole('button',{name:'더 보기'})).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'취소'}))
 expect(close).toHaveBeenCalledTimes(1)
})
it('preserves a failed direct edit and closes only after successful saving',async()=>{
 const api=service(),close=vi.fn()
 const update=vi.spyOn(api,'updateRecord').mockRejectedValueOnce(new Error('save failed')).mockResolvedValue(record)
 render(<DataProvider implementation={api}><RecordList kind="transactions" date={date} changeDate={vi.fn()} go={vi.fn()} initialEntry={{id:'501'}} onCloseEntry={close}/></DataProvider>)
 const input=await screen.findByLabelText('내용')
 fireEvent.change(input,{target:{value:'Changed'}})
 fireEvent.click(screen.getByRole('button',{name:'저장'}))
 await screen.findByText('save failed')
 expect(input).toHaveValue('Changed');expect(close).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'저장'}))
 await waitFor(()=>expect(close).toHaveBeenCalledTimes(1))
 expect(update).toHaveBeenLastCalledWith('501',expect.objectContaining({kind:'transactions',managementMonth:'2026-11'}))
})
it.each(['transactions','memos','fixed-pay'] as const)('opens %s creation without querying a record or listing page',async kind=>{
 const api=service(),close=vi.fn()
 render(<DataProvider implementation={api}><RecordList kind={kind} date={date} changeDate={vi.fn()} go={vi.fn()} initialEntry="new" onCloseEntry={close}/></DataProvider>)
 await screen.findByRole('button',{name:'취소'})
 expect(api.getRecord).not.toHaveBeenCalled();expect(api.getRecords).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'뒤로가기'}))
 expect(close).toHaveBeenCalledTimes(1)
})
it('returns after deleting a directly opened record',async()=>{
 const api=service(),close=vi.fn(),remove=vi.spyOn(api,'deleteRecord').mockResolvedValue(undefined)
 render(<DataProvider implementation={api}><RecordList kind="transactions" date={date} changeDate={vi.fn()} go={vi.fn()} initialEntry={{id:'501'}} onCloseEntry={close}/></DataProvider>)
 fireEvent.click(await screen.findByRole('button',{name:'삭제'}))
 await waitFor(()=>expect(close).toHaveBeenCalledTimes(1))
 expect(remove).toHaveBeenCalledWith('transactions','2026-11','501')
})
it('shows a direct lookup failure without falling back to a list and allows returning',async()=>{
 const api=service(),close=vi.fn()
 vi.mocked(api.getRecord).mockRejectedValue(new Error('record not found'))
 render(<DataProvider implementation={api}><RecordList kind="memos" date={date} changeDate={vi.fn()} go={vi.fn()} initialEntry={{id:'501'}} onCloseEntry={close}/></DataProvider>)
 await screen.findByText('record not found')
 expect(screen.queryByRole('button',{name:'메모 추가'})).not.toBeInTheDocument()
 expect(screen.queryByLabelText('내용')).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'뒤로가기'}))
 expect(close).toHaveBeenCalledTimes(1)
})
