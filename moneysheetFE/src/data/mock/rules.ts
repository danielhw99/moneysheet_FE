import type { MoneyRecord, ListKind, RecordDraft, MonthBudget, FoodBudget } from '../models'

export const allowanceId = 'free-allowance'
// Legacy synchronous screens use these same defaults until phase 2.
export const defaultFoodBudget: FoodBudget = { weekday: 11000, saturday: 18000, sunday: 15000 }
export const recordValue = (record: Pick<MoneyRecord, 'amount' | 'direction'>) => record.direction === 'income' ? record.amount : -record.amount
export const validDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(value + 'T12:00:00')
  return date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day
}
export const memoActive = (memo: MoneyRecord, date: string) => memo.date.slice(0, 7) === date.slice(0, 7) && memo.date <= date && (!memo.completedOn || memo.completedOn > date)
export const validateRecord = (kind: ListKind, record: RecordDraft, managementMonth: string) => {
  if (!validDate(record.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.time)) return '날짜와 시간을 올바르게 입력해 주세요.'
  if (!record.title.trim() || !Number.isSafeInteger(record.amount) || record.amount < 0) return '내용과 정확하게 계산할 수 있는 원 단위 금액을 입력해 주세요.'
  if (kind === 'fixed-pay' && record.date.slice(0, 7) !== managementMonth) return '지급일은 선택한 예산과 같은 월이어야 해요.'
  if (kind === 'memos' && record.completedOn) {
    if (!validDate(record.completedOn) || record.completedOn < record.date) return '완료일은 메모 발생일보다 앞설 수 없어요.'
    if (record.completedOn.slice(0, 7) !== record.date.slice(0, 7)) return '메모는 발생한 월 안에서 완료해 주세요.'
  }
  return ''
}
export const foodForDate = (date: string, food: FoodBudget = defaultFoodBudget) => {
  const day = new Date(date + 'T12:00:00').getDay()
  return day === 0 ? food.sunday : day === 6 ? food.saturday : food.weekday
}
export const foodThrough = (month: string, through: number, food: FoodBudget = defaultFoodBudget) => Array.from({ length: through }, (_, i) => foodForDate(month + '-' + String(i + 1).padStart(2, '0'), food)).reduce((sum, value) => sum + value, 0)
export const daysInMonth = (month: string) => new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate()

export const monthFoodBudget = (month: string) => foodThrough(month, daysInMonth(month))
export const fixedTotal = (budget: MonthBudget) => budget.fixed.reduce((total, item) => total + item.amount, 0)
