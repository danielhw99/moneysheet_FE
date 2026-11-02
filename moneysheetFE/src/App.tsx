import { useState } from 'react'
import type { Screen } from './types/navigation'
import Login from './features/auth/AuthScreen'
import Home from './features/home/HomeScreen'
import My from './features/account/MyScreen'
import SimpleSettings from './features/account/SettingsScreen'
import Daily from './features/daily/DailyScreen'
import Monthly from './features/monthly/MonthlyScreen'
import BasicBudget from './features/budget/BasicBudgetScreen'
import RecordList from './features/records/RecordList'
import { allowanceId, initialBudget, fixedTotal, monthFoodBudget, type FixedBudgetItem, type MonthBudget } from './features/budget/budget'
import { currentMonth, localDateValue } from './utils/date'
import type { AddCategory } from './components/CategoryPicker'
import { initialCategories, initialRecords, validateRecord, type Category, type ListKind, type MoneyRecord, type RecordDraft } from './moneyRecords'

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [recordDate, setRecordDate] = useState(() => localDateValue(new Date()))
  const [month, setMonth] = useState(currentMonth)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [records, setRecords] = useState(() => initialRecords(currentMonth()))
  const [budgets, setBudgets] = useState<Record<string, MonthBudget>>(() => ({ [currentMonth()]: initialBudget() }))
  const baseBudget = budgets[month]
  const budget: MonthBudget = { ...baseBudget, fixed: baseBudget.fixed.map(item => ({ ...item, paid: records['fixed-pay'].filter(record => record.budgetItemId === item.id && record.date.slice(0, 7) === month).reduce((sum, record) => sum + record.amount, 0) })) }
  const changeDate = (nextDate: string) => {
    const nextMonth = nextDate.slice(0, 7)
    setBudgets(previous => previous[nextMonth] ? previous : { ...previous, [nextMonth]: initialBudget() })
    setMonth(nextMonth)
    setRecordDate(nextDate)
  }
  const changeMonth = (offset: number) => {
    const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + offset, 1)
    const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    changeDate(recordDate.slice(0, 7) === next ? recordDate : next + '-01')
  }
  const addCategory: AddCategory = (name, scope, direction) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const existing = categories.find(item => item.scope === scope && item.direction === direction && item.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())
    if (existing) return existing
    const category: Category = { id: crypto.randomUUID(), name: trimmed, scope, direction }
    setCategories(previous => [...previous, category])
    return category
  }
  const setLocked = (locked: boolean) => {
    if (month < currentMonth()) return
    setBudgets(previous => ({ ...previous, [month]: { ...previous[month], locked } }))
  }
  const saveItem = (item: FixedBudgetItem) => {
    if (budget.locked || month < currentMonth()) return false
    if (!categories.some(category => category.id === item.categoryId && category.scope === 'fixedBudget')) return false
    const fixed = budget.fixed.some(value => value.id === item.id) ? budget.fixed.map(value => value.id === item.id ? item : value) : [...budget.fixed, item]
    if (!Number.isSafeInteger(fixedTotal({ ...budget, fixed }) + monthFoodBudget(month))) return false
    setBudgets(previous => ({ ...previous, [month]: { ...previous[month], fixed: fixed.map(value => ({ ...value, paid: 0 })) } }))
    return true
  }
  const deleteItem = (id: string) => {
    if (budget.locked || month < currentMonth()) return false
    if (records['fixed-pay'].some(record => record.budgetItemId === id && record.date.slice(0, 7) === month)) return false
    setBudgets(previous => ({ ...previous, [month]: { ...previous[month], fixed: previous[month].fixed.filter(item => item.id !== id) } }))
    return true
  }
  const saveRecord = (kind: ListKind, id: string | null, draft: RecordDraft, managementMonth: string) => {
    const validationError = validateRecord(kind, draft, managementMonth)
    if (validationError) return validationError
    if (id && !records[kind].some(item => item.id === id)) return '수정할 기록을 찾을 수 없어요.'
    if (kind === 'fixed-pay') {
      const item = budgets[managementMonth]?.fixed.find(item => item.id === draft.budgetItemId && item.id !== allowanceId)
      if (!item) return '고정지출 예산 항목을 선택해 주세요.'
      const paid = records[kind].filter(item => item.id !== id && item.date.slice(0, 7) === managementMonth && item.budgetItemId === draft.budgetItemId).reduce((sum, item) => sum + item.amount, draft.amount)
      if (!Number.isSafeInteger(paid) || draft.amount < 0) return '지급액 합계를 정확하게 계산할 수 없어요.'
    }
    if (kind === 'transactions' && draft.categoryId && !categories.some(category => category.id === draft.categoryId && category.scope === 'mainTransaction' && category.direction === draft.direction)) return '입출금 구분에 맞는 카테고리를 선택해 주세요.'
    const record: MoneyRecord = { ...draft, id: id ?? crypto.randomUUID() }
    setRecords(previous => ({ ...previous, [kind]: id ? previous[kind].map(item => item.id === id ? record : item) : [...previous[kind], record] }))
    return ''
  }
  const deleteRecord = (kind: ListKind, id: string) => setRecords(previous => ({ ...previous, [kind]: previous[kind].filter(item => item.id !== id) }))
  const toggleMemo = (id: string) => {
    const memo = records.memos.find(item => item.id === id)
    if (!memo || memo.date > recordDate || memo.date.slice(0, 7) !== recordDate.slice(0, 7)) return
    const completedOn = memo.completedOn === recordDate ? null : recordDate
    if (validateRecord('memos', { ...memo, completedOn }, recordDate.slice(0, 7))) return
    setRecords(previous => ({ ...previous, memos: previous.memos.map(item => item.id === id ? { ...item, completedOn } : item) }))
  }
  const monthTotal = (kind: ListKind) => records[kind].filter(item => item.date.slice(0, 7) === month).reduce((sum, item) => sum + item.amount, 0)
  let view: React.ReactNode
  if (screen === 'login' || screen === 'signup') view = <Login key={screen} go={setScreen} signup={screen === 'signup'} />
  else if (screen === 'home') view = <Home go={setScreen} month={month} changeMonth={changeMonth} selectedDate={recordDate} selectDate={changeDate} />
  else if (screen === 'daily') view = <Daily go={setScreen} date={recordDate} memoRecords={records.memos} transactions={records.transactions} payments={records['fixed-pay']} budget={budget} toggleMemo={toggleMemo} />
  else if (screen === 'monthly') view = <Monthly go={setScreen} month={month} changeMonth={changeMonth} budget={budget} income={monthTotal('income')} extra={monthTotal('extra')} />
  else if (screen === 'basic') view = <BasicBudget key={month} go={setScreen} month={month} budget={budget} categories={categories} addCategory={addCategory} setLocked={setLocked} saveItem={saveItem} deleteItem={deleteItem} />
  else if (screen === 'my') view = <My go={setScreen} />
  else if (screen === 'account' || screen === 'settings') view = <SimpleSettings type={screen} go={setScreen} />
  else view = <RecordList key={screen} kind={screen as ListKind} go={setScreen} date={recordDate} changeDate={changeDate} records={records[screen as ListKind]} categories={categories} addCategory={addCategory} budget={budget} saveRecord={saveRecord} deleteRecord={deleteRecord} toggleMemo={toggleMemo} />
  return <div className="prototype"><div className="phone-frame">{view}</div></div>
}
