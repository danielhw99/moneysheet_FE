import { describe, it, expect } from 'vitest'
import { dailySummary, budgetSummary, homeSummary } from './queries'
import type { MonthlyBudget, RecordStore } from '../models'

const budget: MonthlyBudget = { month: '2026-11', fixed: [{ id: 'free-allowance', name: '고정여유비', categoryId: 'pocket', amount: 50000 }], food: { weekday: 11000, saturday: 11000, sunday: 11000 } }
const empty = (): RecordStore => ({ transactions: [], memos: [], 'fixed-pay': [], income: [], extra: [] })
describe('ordinary fixed budgets and monthly free balance', () => {
  it('starts day one with only food and gives savings to the same day', () => {
    const records = empty()
    records.transactions.push({ id: '1', date: '2026-11-01', time: '12:00', title: 'meal', amount: 9000, direction: 'expense', categoryId: null, completedOn: null })
    expect(dailySummary('2026-11-01', budget, records)).toMatchObject({ carryoverFreeBalance: 0, availableBeforeSpending: 11000, freeBalance: 2000 })
    expect(dailySummary('2026-11-02', budget, records)).toMatchObject({ carryoverFreeBalance: 2000, availableBeforeSpending: 13000, freeBalance: 13000 })
  })
  it('applies the formula to historical months and never carries money between months', () => {
    const records = empty()
    records.transactions.push({ id: 'past', date: '2026-10-31', time: '12:00', title: 'past', amount: 100000, direction: 'expense', categoryId: null, completedOn: null })
    expect(dailySummary('2026-11-01', budget, records).freeBalance).toBe(11000)
    expect(dailySummary('2026-10-01', { ...budget, month: '2026-10' }, records).freeBalance).toBe(11000)
  })
  it('keeps Main deposits and active memos out of free balance', () => {
    const records = empty()
    records.transactions.push({ id: 'deposit', date: '2026-11-01', time: '12:00', title: 'deposit', amount: 5000, direction: 'income', categoryId: null, completedOn: null })
    records.memos.push({ id: 'memo', date: '2026-11-01', time: '12:00', title: 'temporary', amount: 2000, direction: 'expense', categoryId: null, completedOn: null })
    const day = dailySummary('2026-11-01', budget, records)
    expect(day.freeBalance).toBe(11000)
    expect(day.mainBalance).toBe(day.freeBalance + day.remainingFood + 5000 - 2000)
  })
  it('never auto-pays an old allowance ID and counts only recorded payments', () => {
    const records = empty()
    expect(budgetSummary(budget, records).items[0]).toMatchObject({ paid: 0, remaining: 50000, complete: false })
    expect(homeSummary(budget, records, '2026-11-01').days[1].entries.some(entry => entry.kind === 'fixed')).toBe(false)
    records['fixed-pay'].push({ id: 'pay', budgetItemId: 'free-allowance', date: '2026-11-01', time: '12:00', title: 'pay', amount: 20000, direction: 'expense', categoryId: null, completedOn: null })
    expect(budgetSummary(budget, records).items[0]).toMatchObject({ paid: 20000, remaining: 30000, complete: false })
  })
})
