import type { BudgetSummary, DailySummary, MonthlySummary, RecordsSummary, RecordQuery, HomeSummary, HomeDayEntry } from '../MoneySheetDataAccess'
import type { MonthlyBudget, RecordStore } from '../models'
import { daysInMonth, foodForDate, foodThrough, memoActive, recordValue } from './rules'

export function budgetSummary(budget: MonthlyBudget, records: RecordStore): BudgetSummary {
  const items = budget.fixed.map(item => {
    const paid = records['fixed-pay'].filter(record => record.budgetItemId === item.id && record.date.slice(0, 7) === budget.month).reduce((sum, record) => sum + record.amount, 0)
    const remaining = item.amount - paid
    return { ...item, paid, remaining, complete: remaining === 0 }
  })
  const first = foodThrough(budget.month, 10, budget.food)
  const second = foodThrough(budget.month, 20, budget.food)
  const total = foodThrough(budget.month, daysInMonth(budget.month), budget.food)
  return { month: budget.month, items, food: { ...budget.food }, fixedTotal: items.reduce((sum, item) => sum + item.amount, 0), foodSummary: { total, installments: budget.food.paymentMode==='monthStart' ? [total,0,0] : [first, second - first, total - second] } }
}

export function dailySummary(date: string, budget: MonthlyBudget, records: RecordStore): DailySummary {
  const month = date.slice(0, 7)
  const day = Number(date.slice(8))
  const transactions = records.transactions.filter(item => item.date === date)
  const cumulative = records.transactions.filter(item => item.date.slice(0, 7) === month && item.date <= date)
  const activeMemos = records.memos.filter(item => memoActive(item, date))
  const previousSpending = cumulative.filter(item => item.date < date && item.direction === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const previousIncome = cumulative.filter(item => item.date < date && item.direction === 'income').reduce((sum, item) => sum + item.amount, 0)
  const expenseTotal = transactions.filter(item => item.direction === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const incomeTotal = transactions.filter(item => item.direction === 'income').reduce((sum, item) => sum + item.amount, 0)
  const carryoverFreeBalance = foodThrough(month, day - 1, budget.food) - previousSpending + previousIncome
  const availableBeforeSpending = carryoverFreeBalance + foodForDate(date, budget.food)
  const freeBalance = availableBeforeSpending - expenseTotal + incomeTotal
  const roundStart = day >= 21 ? 21 : day >= 11 ? 11 : 1
  const roundEnd = budget.food.paymentMode==='monthStart' ? daysInMonth(month) : day >= 21 ? daysInMonth(month) : day >= 11 ? 20 : 10
  const allocatedBeforeRound = foodThrough(month, roundStart - 1, budget.food)
  const roundBudget = foodThrough(month, roundEnd, budget.food) - allocatedBeforeRound
  const allocatedInRound = foodThrough(month, day, budget.food) - allocatedBeforeRound
  const remainingFood = roundBudget - allocatedInRound
  const memoAdjustment = activeMemos.reduce((sum, item) => sum + recordValue(item), 0)
  const payments = records['fixed-pay'].filter(record => record.date === date).flatMap(record => {
    const item = budget.fixed.find(item => item.id === record.budgetItemId)
    if (!item) return []
    const paid = records['fixed-pay'].filter(value => value.budgetItemId === item.id && value.date.slice(0, 7) === month && value.date <= date).reduce((sum, value) => sum + value.amount, 0)
    return [{ record, itemName: item.name, paid, remaining: item.amount - paid, complete: item.amount === paid }]
  })
  return {
    date, transactions, activeMemos, payments,
    mainBalance: freeBalance + remainingFood + memoAdjustment,
    freeBalance, carryoverFreeBalance, availableBeforeSpending, remainingFood,
    foodBudget: foodForDate(date, budget.food),
    expenseTotal,
    incomeTotal,
  }
}

export function monthlySummary(budget: MonthlyBudget, records: RecordStore): MonthlySummary {
  const total = (kind: 'income' | 'extra') => records[kind].filter(item => item.date.slice(0, 7) === budget.month).reduce((sum, item) => sum + item.amount, 0)
  const summary = budgetSummary(budget, records)
  const income = total('income')
  const extra = total('extra')
  const basicTotal = summary.fixedTotal + summary.foodSummary.total
  const totalExpense = basicTotal + extra
  return { month: budget.month, income, extra, fixedBudget: summary.fixedTotal, foodBudget: summary.foodSummary.total, basicTotal, totalExpense, net: income - totalExpense }
}

export function recordsSummary(query: RecordQuery, records: RecordStore): RecordsSummary {
  const month = query.date?.slice(0, 7) ?? query.month!
  const candidates = records[query.kind].filter(item => item.date.slice(0, 7) === month)
  const pending = records.memos.filter(item => memoActive(item, query.date ?? month + '-' + daysInMonth(month)))
  const rows = query.kind === 'memos' && query.memoStatus
    ? query.memoStatus === 'pending' ? pending : records.memos.filter(item => query.date ? item.completedOn === query.date : item.completedOn?.slice(0, 7) === month)
    : candidates.filter(item => !query.date || item.date === query.date)
  return {
    rows, nextCursor: null,
    total: rows.reduce((sum, item) => sum + item.amount, 0),
    expenseTotal: rows.filter(item => item.direction === 'expense').reduce((sum, item) => sum + item.amount, 0),
    incomeTotal: rows.filter(item => item.direction === 'income').reduce((sum, item) => sum + item.amount, 0),
    pendingMemoTotal: pending.reduce((sum, item) => sum + recordValue(item), 0),
  }
}

export function homeSummary(budget: MonthlyBudget, records: RecordStore, today: string): HomeSummary {
  const month = budget.month
  const end = `${month}-${daysInMonth(month)}`
  const asOf = month === today.slice(0, 7) ? today : end
  const futureMonth = month > today.slice(0, 7)
  const days: Record<number, HomeSummary['days'][number]> = {}
  for (let day = 1; day <= daysInMonth(month); day++) {
    const date = `${month}-${String(day).padStart(2, '0')}`
    const hasRecord = [records.transactions, records.memos, records['fixed-pay']].some(rows => rows.some(item => item.date === date || item.completedOn === date))
    if (date > today && !hasRecord) continue
    const daily = dailySummary(date, budget, records)
    const entries: HomeDayEntry[] = []
    if (daily.transactions.some(item => item.direction === 'expense')) entries.push({ label: '내역 지출', amount: -daily.expenseTotal, kind: 'transaction' })
    if (daily.transactions.some(item => item.direction === 'income')) entries.push({ label: '내역 입금', amount: daily.incomeTotal, kind: 'transaction' })
    if (daily.payments.length) entries.push({ label: '고정지출', amount: -daily.payments.reduce((sum, item) => sum + item.record.amount, 0), kind: 'fixed' })
    if (daily.activeMemos.length) entries.push({ label: '미완료 메모', count: daily.activeMemos.length, kind: 'memo' })
    const completed = records.memos.filter(item => item.completedOn === date).length
    if (completed) entries.push({ label: '완료 메모', count: completed, kind: 'memo' })
    entries.push({ label: '여유비', amount: daily.freeBalance, kind: 'free' })
    days[day] = { entries }
  }
  return { month, asOfDate: asOf, source: 'records', days, expense: monthlySummary(budget, records).totalExpense, freeBalance: futureMonth ? 0 : dailySummary(asOf, budget, records).freeBalance }
}
