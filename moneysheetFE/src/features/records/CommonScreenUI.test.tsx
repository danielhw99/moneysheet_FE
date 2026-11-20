import { act,fireEvent,render,screen,waitFor,within } from '@testing-library/react'
import { describe,it,expect,vi } from 'vitest'
import { useState } from 'react'
import Daily from '../daily/DailyScreen'
import BasicBudget from '../budget/BasicBudgetScreen'
import RecordList from './RecordList'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import { currentMonth } from '../../utils/date'
import type { ListKind } from '../../data/models'
import type { DailyBalanceCheck,RecordsSummary } from '../../data/MoneySheetDataAccess'

describe('공통 화면 배치',()=>{
 it('keeps the actual balance input and lock mounted while loading only its placeholder',async()=>{
  const api=createMockDataAccess(),date=currentMonth()+'-01'
  let resolve!:(value:DailyBalanceCheck)=>void
  vi.spyOn(api,'getBalanceCheck').mockImplementation(()=>new Promise(done=>{resolve=done}))
  render(<DataProvider implementation={api}><Daily date={date} go={vi.fn()}/></DataProvider>)
  await screen.findByText('Main 계산 잔액')
  const field=screen.getByRole('textbox',{name:'실제 계좌 잔액'}),lock=screen.getByRole('button',{name:'잔액 잠금 해제'})
  expect(field).toHaveAttribute('placeholder','불러오는 중…');expect(field).toHaveAttribute('aria-busy','true');expect(field).toBeDisabled();expect(lock).toBeDisabled()
  await act(async()=>resolve({date,actualBalance:null,locked:false}))
  expect(screen.getByRole('textbox',{name:'실제 계좌 잔액'})).toBe(field)
  expect(field).toHaveAttribute('placeholder','미입력');expect(field).toBeEnabled()
 })
 it.each(['transactions','memos','fixed-pay','income','extra'] as ListKind[])('keeps %s query feedback inside the list and preserves retry',async kind=>{
  const api=createMockDataAccess();let reject!:(error:Error)=>void
  const get=vi.spyOn(api,'getRecords').mockImplementationOnce(()=>new Promise((_done,fail)=>{reject=fail})).mockResolvedValue({rows:[],total:0,expenseTotal:0,incomeTotal:0,pendingMemoTotal:0,nextCursor:null})
  render(<DataProvider implementation={api}><RecordList kind={kind} date={currentMonth()+'-01'} go={vi.fn()} changeDate={vi.fn()}/></DataProvider>)
  const list=screen.getByRole('region',{name:'기록 목록'})
  expect(within(list).getByRole('status')).toBeVisible()
  await waitFor(()=>expect(get).toHaveBeenCalledOnce())
  await act(async()=>reject(new Error('목록 조회 실패')))
  expect(within(list).getByRole('alert')).toHaveTextContent('목록 조회 실패')
  fireEvent.click(within(list).getByRole('button',{name:'다시 불러오기'}))
  await waitFor(()=>expect(get).toHaveBeenCalledTimes(2))
  expect(await within(list).findByText(kind==='memos'?'미완료 메모가 없습니다.':'해당 기간의 기록이 없습니다.')).toBeInTheDocument()
 })
 it('puts lock icon and edit status in the same control without a second header control',async()=>{
  function Budget(){const [locked,setLocked]=useState(true);return <BasicBudget month={currentMonth()} locked={locked} setLocked={setLocked} go={vi.fn()}/>}
  render(<DataProvider implementation={createMockDataAccess()}><Budget/></DataProvider>)
  const lock=await screen.findByRole('button',{name:'예산 잠금 해제'})
  expect(lock).toHaveTextContent('예산 잠금');expect(lock.querySelector('svg')).not.toBeNull()
  expect(lock.closest('.sub-month')).not.toBeNull()
  fireEvent.click(lock)
  expect(screen.getByRole('button',{name:'예산 잠금'})).toHaveTextContent('편집 중')
 })
 it('uses direction colors and signs for memo amounts',async()=>{
  const api=createMockDataAccess(),date=currentMonth()+'-01'
  const summary:RecordsSummary={rows:[{id:'1',date,time:'12:00',title:'받을 돈',amount:1000,direction:'expense',categoryId:null,completedOn:null},{id:'2',date,time:'12:00',title:'옮길 돈',amount:2000,direction:'income',categoryId:null,completedOn:null}],nextCursor:null,total:0,expenseTotal:1000,incomeTotal:2000,pendingMemoTotal:1000}
  vi.spyOn(api,'getRecords').mockResolvedValue(summary)
  render(<DataProvider implementation={api}><RecordList kind="memos" date={date} go={vi.fn()} changeDate={vi.fn()}/></DataProvider>)
  expect(await screen.findByText('-1,000원')).toHaveClass('amount-expense')
  expect(screen.getByText('+2,000원')).toHaveClass('amount-income')
 })
})
