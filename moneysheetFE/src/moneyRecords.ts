export type Direction = 'expense' | 'income'
export type ListKind = 'transactions' | 'memos' | 'fixed-pay' | 'income' | 'extra'
export type Category = { id: string; name: string; scope: 'fixedBudget' | 'mainTransaction'; direction?: Direction }
export type MoneyRecord = {
  id: string; date: string; time: string; title: string; amount: number; direction: Direction;
  categoryId: string | null; budgetItemId?: string; completedOn: string | null;
}
export type RecordDraft = Omit<MoneyRecord, 'id'>
export type RecordStore = Record<ListKind, MoneyRecord[]>
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
export const foodForDate = (date: string) => {
  const day = new Date(date + 'T12:00:00').getDay()
  return day === 0 ? 15000 : day === 6 ? 18000 : 11000
}
export const foodThrough = (month: string, through: number) => Array.from({ length: through }, (_, i) => foodForDate(month + '-' + String(i + 1).padStart(2, '0'))).reduce((sum, value) => sum + value, 0)
export const daysInMonth = (month: string) => new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate()
