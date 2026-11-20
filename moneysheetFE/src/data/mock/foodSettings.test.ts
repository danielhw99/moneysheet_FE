import { describe,it,expect } from 'vitest'
import { createMockDataAccess } from './createMockDataAccess'

describe('식비 설정 mock 계산 계약',()=>{
 it('OFF는 금액을 보존하면서 모든 적용 식비를0원으로 만든다',async()=>{
  const api=createMockDataAccess({today:()=> '2026-11-20'})
  const before=await api.getBudget('2026-11')
  const off=await api.updateFoodBudget('2026-11',{enabled:false,paymentMode:'threeInstallments',weekday:null,saturday:null,sunday:null})
  expect(off.food.weekday).toBe(before.food.weekday)
  expect(off.foodSummary).toEqual({total:0,installments:[0,0,0]})
  expect((await api.getDaily('2026-11-12')).foodBudget).toBe(0)
  expect((await api.getMonthly('2026-11')).foodBudget).toBe(0)
  await api.updateFoodBudget('2026-11',{...before.food,enabled:true})
  expect((await api.getBudget('2026-11')).food).toEqual(before.food)
 })
 it('월초 일괄 지급도 여유비는 당일분만 배정한다',async()=>{
  const api=createMockDataAccess({today:()=> '2026-11-20'})
  const updated=await api.updateFoodBudget('2026-11',{enabled:true,paymentMode:'monthStart',weekday:1000,saturday:1000,sunday:1000})
  expect(updated.foodSummary.installments).toEqual([30000,0,0])
  const daily=await api.getDaily('2026-11-12')
  expect(daily.freeBalance).toBe(12000);expect(daily.remainingFood).toBe(18000)
  expect(daily.mainBalance).toBe(30000)
 })
 it('지난 월 변경·ON 미입력·OFF 하위 설정 변경을 거부한다',async()=>{
  const api=createMockDataAccess({today:()=> '2026-11-20'})
  const off={enabled:false,paymentMode:'threeInstallments' as const,weekday:null,saturday:null,sunday:null}
  await expect(api.updateFoodBudget('2026-10',off)).rejects.toMatchObject({code:'BUDGET_READ_ONLY'})
  await expect(api.updateFoodBudget('2026-11',{...off,enabled:true})).rejects.toMatchObject({code:'VALIDATION'})
  await expect(api.updateFoodBudget('2026-11',{...off,paymentMode:'monthStart'})).rejects.toMatchObject({code:'VALIDATION'})
 })
})
