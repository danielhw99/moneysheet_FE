import { describe,it,expect } from 'vitest'
import { createMockDataAccess } from './createMockDataAccess'

describe('식비 설정 mock 계산 계약',()=>{
 it('rejects missing food without mutating the budget',async()=>{
  const api=createMockDataAccess({today:()=> '2026-11-20'})
  const before=await api.getBudget('2026-11')
  await expect(api.updateFoodBudget('2026-11',{paymentMode:'threeInstallments',weekday:null,saturday:null,sunday:null})).rejects.toMatchObject({code:'VALIDATION'})
  expect(await api.getBudget('2026-11')).toEqual(before)
 })
 it('월초 일괄 지급도 여유비는 당일분만 배정한다',async()=>{
  const api=createMockDataAccess({today:()=> '2026-11-20'})
  const updated=await api.updateFoodBudget('2026-11',{paymentMode:'monthStart',weekday:1000,saturday:1000,sunday:1000})
  expect(updated.foodSummary.installments).toEqual([30000,0,0])
  const daily=await api.getDaily('2026-11-12')
  expect(daily.freeBalance).toBe(12000);expect(daily.remainingFood).toBe(18000)
  expect(daily.mainBalance).toBe(30000)
 })
 it('지난 월 변경·금액 미입력을 거부한다',async()=>{
  const api=createMockDataAccess({today:()=> '2026-11-20'})
  const off={paymentMode:'threeInstallments' as const,weekday:null,saturday:null,sunday:null}
  await expect(api.updateFoodBudget('2026-10',off)).rejects.toMatchObject({code:'BUDGET_READ_ONLY'})
  await expect(api.updateFoodBudget('2026-11',{...off})).rejects.toMatchObject({code:'VALIDATION'})
  await expect(api.updateFoodBudget('2026-11',{...off,paymentMode:'monthStart'})).rejects.toMatchObject({code:'VALIDATION'})
 })
})
