import { act,fireEvent,render,screen,waitFor } from '@testing-library/react'
import { describe,it,expect,vi } from 'vitest'
import Daily from '../daily/DailyScreen'
import Monthly from '../monthly/MonthlyScreen'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import { currentMonth } from '../../utils/date'
import type { BudgetSummary } from '../../data/MoneySheetDataAccess'

describe.each(['daily','monthly'])('%s 식비 조회 피드백',kind=>{
 it('distinguishes loading/failure and hides stale ON data before retrying to OFF',async()=>{
  const month=currentMonth(),api=createMockDataAccess(),budget=await api.getBudget(month)
  let resolve!:(value:BudgetSummary)=>void,reject!:(reason:Error)=>void
  const load=vi.spyOn(api,'getBudget').mockImplementation(()=>new Promise((done,fail)=>{resolve=done;reject=fail}))
  const ui=(refreshToken:number)=><DataProvider implementation={api} refreshToken={refreshToken}>{kind==='daily'?<Daily date={month+'-01'} go={vi.fn()}/>:<Monthly month={month} go={vi.fn()} changeMonth={vi.fn()}/>}</DataProvider>
  const view=render(ui(0)),label=kind==='daily'?'오늘 식비 예산':'고정지출 + 식비 예산'
  if(kind==='daily')await screen.findByText('Main 계산 잔액')
  expect(await screen.findByText('식비 설정 확인 중…')).toBeVisible()
  expect(screen.queryByText(label)).not.toBeInTheDocument()
  await act(async()=>resolve(budget))
  expect(await screen.findByText(label)).toBeInTheDocument()
  view.rerender(ui(1))
  await waitFor(()=>expect(load).toHaveBeenCalledTimes(2))
  expect(screen.queryByText(label)).not.toBeInTheDocument()
  await act(async()=>reject(new Error('식비 설정 조회 실패')))
  expect(await screen.findByRole('alert')).toHaveTextContent('식비 설정 조회 실패')
  expect(screen.queryByText(label)).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'다시 불러오기'}))
  await waitFor(()=>expect(load).toHaveBeenCalledTimes(3))
  await act(async()=>resolve({...budget,food:{...budget.food,enabled:false}}))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.queryByText(label)).not.toBeInTheDocument()
  if(kind==='monthly')expect(screen.getByText('고정지출 예산')).toBeInTheDocument()
 })
})
