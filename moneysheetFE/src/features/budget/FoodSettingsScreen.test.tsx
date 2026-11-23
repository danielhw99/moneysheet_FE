import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FoodSettingsScreen from './FoodSettingsScreen'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import { currentMonth } from '../../utils/date'
import type { BudgetSummary } from '../../data/MoneySheetDataAccess'

async function setup() {
 const api=createMockDataAccess(),month=currentMonth()
 const initial={...await api.getBudget(month),food:{paymentMode:'threeInstallments',weekday:null,saturday:null,sunday:null}} satisfies BudgetSummary
 api.getBudget=vi.fn().mockResolvedValue(initial)
 api.updateFoodBudget=vi.fn().mockImplementation(async(_month,input)=>({...initial,food:input}))
 await act(async()=>{render(<DataProvider implementation={api}><FoodSettingsScreen month={month} go={vi.fn()}/></DataProvider>)})
 await screen.findByLabelText('주중 식비')
 return {api,month,initial}
}
describe('식비 설정 저장',()=>{
 it('금액 미입력은 안내하고 서버 상태를 변경하지 않는다',async()=>{
  const {api}=await setup()
fireEvent.click(screen.getByRole('button',{name:'저장'}))
  expect(await screen.findByRole('alert')).toBeInTheDocument();expect(api.updateFoodBudget).not.toHaveBeenCalled()
 })
 it('실패 입력 유지 후 재시도에서 금액·방식을 함께 저장한다',async()=>{
  const {api,month}=await setup()
  vi.mocked(api.updateFoodBudget).mockRejectedValueOnce(new Error('저장 실패'))

  for(const label of ['주중 식비','토요일 식비','일요일 식비'])fireEvent.change(screen.getByLabelText(label),{target:{value:'11000'}})
  fireEvent.change(screen.getByLabelText('지급 방식'),{target:{value:'monthStart'}})
  fireEvent.click(screen.getByRole('button',{name:'저장'}))
  expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패')
  expect(screen.getByLabelText('주중 식비')).toHaveValue('11000')
  fireEvent.click(screen.getByRole('button',{name:'저장'}))
  expect(await screen.findByRole('status')).toHaveTextContent('저장했어요')
  expect(api.updateFoodBudget).toHaveBeenLastCalledWith(month,{paymentMode:'monthStart',weekday:11000,saturday:11000,sunday:11000})
 })
 it('저장 지연 중 지급 방식·금액과 중복 제출을 차단한다',async()=>{
  const {api,initial}=await setup();let resolve!:(value:BudgetSummary)=>void
  vi.mocked(api.updateFoodBudget).mockImplementation(()=>new Promise(done=>{resolve=done}))
  for(const name of ['주중 식비','토요일 식비','일요일 식비']) fireEvent.change(screen.getByLabelText(name),{target:{value:'11000'}})
  fireEvent.click(screen.getByRole('button',{name:'저장'}))
  await waitFor(()=>expect(api.updateFoodBudget).toHaveBeenCalledOnce())
  expect(screen.getByLabelText('주중 식비')).toBeDisabled();expect(screen.getByRole('button',{name:'저장 중…'})).toBeDisabled()
  await act(async()=>resolve(initial))
  expect(await screen.findByRole('status')).toHaveTextContent('저장했어요')
 })
 it.each(['amount','mode'])('clears obsolete validation on %s edits and validates the next submit',async(kind)=>{
  const {api,month}=await setup()

  fireEvent.click(screen.getByRole('button',{name:'저장'}))
  expect(await screen.findByRole('alert')).toBeInTheDocument()
  if(kind==='amount')fireEvent.change(screen.getByLabelText('주중 식비'),{target:{value:'11000'}})
  if(kind==='mode')fireEvent.change(screen.getByLabelText('지급 방식'),{target:{value:'monthStart'}})

  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'저장'}))
   expect(await screen.findByRole('alert')).toBeInTheDocument();expect(api.updateFoodBudget).not.toHaveBeenCalled()

 })
})
