import type { BudgetSummary, DailySummary, MonthlySummary, RecordsSummary, RecordQuery } from '../MoneySheetDataAccess'
import type { MonthlyBudget, RecordStore } from '../models'
import { allowanceId, daysInMonth, foodForDate, foodThrough, memoActive, recordValue } from './rules'

export function budgetSummary(budget: MonthlyBudget, records: RecordStore): BudgetSummary {
  const items = budget.fixed.map(item => {
    const paid = records['fixed-pay'].filter(record => record.budgetItemId === item.id && record.date.slice(0, 7) === budget.month).reduce((sum, record) => sum + record.amount, 0)
    const remaining = item.amount - paid
    return { ...item, paid, remaining, complete: remaining === 0, automatic: item.id === allowanceId }
  })
  const first = foodThrough(budget.month, 11, budget.food)
  const second = foodThrough(budget.month, 21, budget.food)
  const total = foodThrough(budget.month, daysInMonth(budget.month), budget.food)
  return { month: budget.month, items, food: { ...budget.food }, fixedTotal: items.reduce((sum, item) => sum + item.amount, 0), foodSummary: { total, installments: [first, second - first, total - second] } }
}

export function dailySummary(date: string, budget: MonthlyBudget, records: RecordStore): DailySummary {
  const month = date.slice(0, 7)
  const day = Number(date.slice(8))
  const allowance = budget.fixed.find(item => item.id === allowanceId)?.amount ?? 0
  const transactions = records.transactions.filter(item => item.date === date)
  const cumulative = records.transactions.filter(item => item.date.slice(0, 7) === month && item.date <= date)
  const activeMemos = records.memos.filter(item => memoActive(item, date))
  const spending = cumulative.filter(item => item.direction === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const paidThrough = day >= 22 ? daysInMonth(month) : day >= 12 ? 21 : 11
  const payments = records['fixed-pay'].filter(record => record.date === date).flatMap(record => {
    const item = budget.fixed.find(item => item.id === record.budgetItemId)
    if (!item) return []
    const paid = records['fixed-pay'].filter(value => value.budgetItemId === item.id && value.date.slice(0, 7) === month && value.date <= date).reduce((sum, value) => sum + value.amount, 0)
    return [{ record, itemName: item.name, paid, remaining: item.amount - paid, complete: item.amount === paid }]
  })
  return {
    date, transactions, activeMemos, payments,
    mainBalance: allowance + foodThrough(month, paidThrough, budget.food) + cumulative.reduce((sum, item) => sum + recordValue(item), 0) + activeMemos.reduce((sum, item) => sum + recordValue(item), 0),
    freeBalance: allowance + foodThrough(month, day, budget.food) - spending,
    foodBudget: foodForDate(date, budget.food),
    expenseTotal: transactions.filter(item => item.direction === 'expense').reduce((sum, item) => sum + item.amount, 0),
    incomeTotal: transactions.filter(item => item.direction === 'income').reduce((sum, item) => sum + item.amount, 0),
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
    rows,
    total: rows.reduce((sum, item) => sum + item.amount, 0),
    expenseTotal: rows.filter(item => item.direction === 'expense').reduce((sum, item) => sum + item.amount, 0),
    incomeTotal: rows.filter(item => item.direction === 'income').reduce((sum, item) => sum + item.amount, 0),
    pendingMemoTotal: pending.reduce((sum, item) => sum + recordValue(item), 0),
  }
}
