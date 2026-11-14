import { useRef, useState } from 'react'
import Header from '../../components/Header'
import MoneyInput from '../../components/MoneyInput'
import CategoryPicker from '../../components/CategoryPicker'
import { errorMessage, useDataAccess } from '../../data/DataProvider'
import type { BudgetPreparation, DraftItem } from '../../data/budgetApi'
import { currentMonth } from '../../utils/date'
import { budgetAmount } from './budgetInput'

type Row = { key: number; item: DraftItem; amount: string }
export default function BudgetSetupScreen({ month, onDone, onCancel }: { month: string; onDone: () => void; onCancel: () => void }) {
  const { mutate, pending } = useDataAccess()
  const [draft, setDraft] = useState<BudgetPreparation | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [food, setFood] = useState({ weekday: '', saturday: '', sunday: '' })
  const [error, setError] = useState('')
  const sequence = useRef(0)
  const readOnly = month !== currentMonth()
  const prepare = async () => {
    if (pending || readOnly) return
    setError('')
    try {
      const value = await mutate(api => api.prepareBudget(month))
      if (value.status === 'ready') { onDone(); return }
      setDraft(value)
      setRows(value.items.map(item => ({ key: sequence.current++, item, amount: item.amount === null ? '' : String(item.amount) })))
      setFood({ weekday: value.food.weekday === null ? '' : String(value.food.weekday), saturday: value.food.saturday === null ? '' : String(value.food.saturday), sunday: value.food.sunday === null ? '' : String(value.food.sunday) })
    } catch (error) { setError(errorMessage(error)) }
  }
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending || !draft || readOnly) return
    setError('')
    try {
      const items = rows.map(({ item, amount }) => {
        if (!item.name.trim() || [...item.name.trim()].length > 100 || !item.categoryId) throw new Error('각 항목의 이름(100자 이내)과 카테고리를 입력해 주세요.')
        return { ...item, name: item.name.trim(), amount: budgetAmount(amount) }
      })
      if (items.filter(item => item.kind === 'freeAllowance').length > 1) throw new Error('고정여유비는 하나만 설정할 수 있어요.')
      await mutate(api => api.setupBudget(month, { items, food: { weekday: budgetAmount(food.weekday), saturday: budgetAmount(food.saturday), sunday: budgetAmount(food.sunday) } }))
      onDone()
    } catch (error) { setError(errorMessage(error)) }
  }
  const change = (key: number, patch: Partial<DraftItem>) => setRows(previous => previous.map(row => row.key === key ? { ...row, item: { ...row.item, ...patch } } : row))
  return <main className="detail-shell budget-detail"><Header title="월 예산 준비" onBack={() => { if (!pending) onCancel() }} />
    <p className="notice">{month} 예산을 설정하면 생활비 관리를 시작할 수 있어요. 직전 월이 있으면 예산 목록과 식비만 복사합니다.</p>
    {readOnly && <p role="alert">현재 월만 예산을 준비할 수 있어요.</p>}
    {error && <p className="query-status" role="alert">{error}</p>}
    {!draft ? <button className="primary-button" disabled={pending || readOnly} onClick={() => void prepare()}>예산 초안 불러오기</button> : <form className="record-form" onSubmit={save} noValidate>
      <fieldset className="form-fields" disabled={pending || readOnly}>
        <p className="notice">{draft.copiedFromMonth ? `${draft.copiedFromMonth} 예산을 복사했어요.` : '예산 초안을 확인하고 식비와 금액을 입력해 주세요.'}</p>
        {rows.map(({ key, item, amount }, index) => <section className="budget-setup-item" key={key}>
          <label className="field"><span>항목 종류 {index + 1}</span><select aria-label={`항목 종류 ${index + 1}`} value={item.kind} disabled={item.id !== null} onChange={event => change(key, { kind: event.target.value as DraftItem['kind'] })}><option value="fixedExpense">고정지출</option><option value="freeAllowance">고정여유비</option></select></label>
          <label className="field"><span>항목명 {index + 1}</span><input value={item.name} onChange={event => change(key, { name: event.target.value })} /></label>
          <CategoryPicker value={item.categoryId} onChange={categoryId => change(key, { categoryId })} scope="fixedBudget" optional={false} />
          <label className="field"><span>예산 금액 {index + 1}</span><MoneyInput value={amount} onValueChange={amount => setRows(previous => previous.map(row => row.key === key ? { ...row, amount } : row))} /></label>
          <button className="delete-button" type="button" onClick={() => setRows(previous => previous.filter(row => row.key !== key))}>항목 삭제 {index + 1}</button>
        </section>)}
        <button className="secondary-button" type="button" onClick={() => setRows(previous => [...previous, { key: sequence.current++, item: { id: null, kind: 'fixedExpense', name: '', categoryId: null, amount: null }, amount: '' }])}>항목 추가</button>
        {([['주중 식비', 'weekday'], ['토요일 식비', 'saturday'], ['일요일 식비', 'sunday']] as const).map(([label, key]) => <label className="field" key={key}><span>{label}</span><MoneyInput value={food[key]} onValueChange={value => setFood(previous => ({ ...previous, [key]: value }))} /></label>)}
        <button className="primary-button" type="submit">예산 설정 완료</button>
      </fieldset>
    </form>}
  </main>
}
