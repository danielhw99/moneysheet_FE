import type { BudgetSummary, DailySummary, MonthlySummary, RecordsSummary, RecordQuery, HomeSummary } from '../MoneySheetDataAccess'
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
  const previousSpending = cumulative.filter(item => item.date < date && item.direction === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const expenseTotal = transactions.filter(item => item.direction === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const carryoverFreeBalance = allowance + foodThrough(month, day - 1, budget.food) - previousSpending
  const availableBeforeSpending = carryoverFreeBalance + foodForDate(date, budget.food)
  const freeBalance = availableBeforeSpending - expenseTotal
  const roundStart = day >= 22 ? 22 : day >= 12 ? 12 : 1
  const roundEnd = day >= 22 ? daysInMonth(month) : day >= 12 ? 21 : 11
  const allocatedBeforeRound = foodThrough(month, roundStart - 1, budget.food)
  const roundBudget = foodThrough(month, roundEnd, budget.food) - allocatedBeforeRound
  const allocatedInRound = foodThrough(month, day, budget.food) - allocatedBeforeRound
  const remainingFood = roundBudget - allocatedInRound
  const income = cumulative.filter(item => item.direction === 'income').reduce((sum, item) => sum + item.amount, 0)
  const memoAdjustment = activeMemos.reduce((sum, item) => sum + recordValue(item), 0)
  const payments = records['fixed-pay'].filter(record => record.date === date).flatMap(record => {
    const item = budget.fixed.find(item => item.id === record.budgetItemId)
    if (!item) return []
    const paid = records['fixed-pay'].filter(value => value.budgetItemId === item.id && value.date.slice(0, 7) === month && value.date <= date).reduce((sum, value) => sum + value.amount, 0)
    return [{ record, itemName: item.name, paid, remaining: item.amount - paid, complete: item.amount === paid }]
  })
  return {
    date, transactions, activeMemos, payments,
    mainBalance: freeBalance + remainingFood + income + memoAdjustment,
    freeBalance, carryoverFreeBalance, availableBeforeSpending, remainingFood,
    foodBudget: foodForDate(date, budget.food),
    expenseTotal,
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

export function homeSummary(budget: MonthlyBudget, records: RecordStore, today: string): HomeSummary {
  const month = budget.month
  const end = `${month}-${daysInMonth(month)}`
  const asOf = month === today.slice(0, 7) ? today : end
  const futureMonth = month > today.slice(0, 7)
  const days: Record<number, HomeSummary['days'][number]> = {}
  const amount = (value: number) => value.toLocaleString('ko-KR')
  for (let day = 1; day <= daysInMonth(month); day++) {
    const date = `${month}-${String(day).padStart(2, '0')}`
    const hasRecord = [records.transactions, records.memos, records['fixed-pay']].some(rows => rows.some(item => item.date === date || item.completedOn === date))
    if (date > today && !hasRecord) continue
    const daily = dailySummary(date, budget, records)
    const labels: { text: string; kind: HomeSummary['days'][number]['kind'] }[] = []
    if (daily.transactions.some(item => item.direction === 'expense')) labels.push({ text: `지출 ${amount(daily.expenseTotal)}`, kind: 'transaction' })
    if (daily.transactions.some(item => item.direction === 'income')) labels.push({ text: `입금 ${amount(daily.incomeTotal)}`, kind: 'transaction' })
    if (daily.payments.length) labels.push({ text: `고정 ${amount(daily.payments.reduce((sum, item) => sum + item.record.amount, 0))}`, kind: 'fixed' })
    if (daily.activeMemos.length) labels.push({ text: `메모 ${daily.activeMemos.length}건`, kind: 'memo' })
    const completed = records.memos.filter(item => item.completedOn === date).length
    if (completed) labels.push({ text: `완료 ${completed}건`, kind: 'memo' })
    labels.push({ text: `여유 ${amount(daily.freeBalance)}`, kind: 'free' })
    days[day] = { primaryLabel: labels[0].text, secondaryLabel: labels.slice(1).map(item => item.text).join(' · ') || undefined, kind: labels[0].kind }
  }
  return { month, source: 'records', days, expense: monthlySummary(budget, records).totalExpense, freeBalance: futureMonth ? 0 : dailySummary(asOf, budget, records).freeBalance }
}
