import type { Category, RecordStore, MoneyRecord, MonthBudget, UserProfile } from '../models'
import { allowanceId } from './rules'

export const initialCategories: Category[] = [
  ...[['housing', '주거'], ['phone', '통신'], ['subscription', '구독'], ['insurance', '보험'], ['allowance', '여유비']].map(([id, name]) => ({ id, name, scope: 'fixedBudget' as const })),
  ...[['food', '식비'], ['living', '생활'], ['transport', '교통']].map(([id, name]) => ({ id, name, scope: 'mainTransaction' as const, direction: 'expense' as const })),
  ...[['pocket', '용돈'], ['resale', '중고거래'], ['other', '기타']].map(([id, name]) => ({ id, name, scope: 'mainTransaction' as const, direction: 'income' as const })),
]
export const initialRecords = (month: string): RecordStore => {
  const record = (id: string, title: string, amount: number, categoryId: string | null = null, date = '2026-10-02'): MoneyRecord => ({ id, date, time: '10:30', title, amount: Math.abs(amount), direction: amount > 0 ? 'income' : 'expense', categoryId, completedOn: null })
  return {
    transactions: [record('salad', '점심 · 샐러드', -11000, 'food'), record('store', '편의점', -4500, 'living'), record('resale', '중고거래 입금', 20000, 'resale')],
    memos: [record('friends', '친구 정산', -45000), record('youtube', '유튜브 보전금', -14900), record('gift', '아빠 용돈', 50000)],
    'fixed-pay': [
      { ...record('rent-payment', '월세', 600000, null, month + '-02'), direction: 'expense', budgetItemId: 'rent' },
      { ...record('phone-payment', '휴대폰 요금', 59000, null, month + '-02'), direction: 'expense', budgetItemId: 'phone' },
    ],
    income: [record('salary', '급여', 3600000), record('side-income', '부수입', 400000, null, '2026-10-03')],
    extra: [record('travel', '여행 적금', -50000), record('occasion', '경조사', -20000, null, '2026-10-03')],
  }
}

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

export const legacyCalendarDays: Record<number, { a: string; b?: string; type?: string }> = {
  1: { a: '고정 850,000', type: 'red' }, 2: { a: '내역 22,000', b: '메모 3건', type: 'blue' },
  4: { a: '내역 8,500', type: 'blue' }, 7: { a: '여유 42,000', type: 'green' },
  9: { a: '고정 59,000', type: 'red' }, 12: { a: '내역 31,200', b: '+2건', type: 'blue' },
  16: { a: '여유 28,000', type: 'green' }, 20: { a: '메모 1건', type: 'gray' },
  23: { a: '내역 19,800', type: 'blue' }, 27: { a: '고정 12,900', type: 'red' },
}


export { defaultFoodBudget as initialFoodBudget } from './rules'
export const demoProfile: UserProfile = { id: 'demo-user', nickname: '김모니', email: 'money@example.com' }
export const demoCalendarMonth = '2026-10'
export const demoHomeTotals = { expense: 1250000, freeBalance: 68100 }
export const demoComparisonAmount = '67,800' // FE comparison input only; never part of Main calculations.
