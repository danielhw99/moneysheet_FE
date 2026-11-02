import { foodThrough, daysInMonth } from '../../moneyRecords'

export type FixedBudgetItem = { id: string; name: string; categoryId: string; amount: number; paid: number }
export type MonthBudget = { locked: boolean; fixed: FixedBudgetItem[] }
export const allowanceId = 'free-allowance'
export const monthFoodBudget = (month: string) => foodThrough(month, daysInMonth(month))
export const initialBudget = (): MonthBudget => ({
  locked: true,
  fixed: [
    { id: 'rent', name: '월세', categoryId: 'housing', amount: 800000, paid: 0 },
    { id: 'phone', name: '휴대폰 요금', categoryId: 'phone', amount: 59000, paid: 0 },
    { id: 'subscription', name: '구독 서비스', categoryId: 'subscription', amount: 12900, paid: 0 },
    { id: 'insurance', name: '보험료', categoryId: 'insurance', amount: 80000, paid: 0 },
    { id: allowanceId, name: '고정여유비', categoryId: 'allowance', amount: 120000, paid: 0 },
  ],
})
export const fixedTotal = (budget: MonthBudget) => budget.fixed.reduce((total, item) => total + item.amount, 0)
