import { useOnboarding } from '../onboarding/OnboardingProvider'
import SetupGuide from '../onboarding/SetupGuide'
import { useEffect, useRef, useState } from 'react'
import QueryStatus from '../../components/QueryStatus'
import Header from '../../components/Header'
import MoneyInput from '../../components/MoneyInput'
import CategoryPicker from '../../components/CategoryPicker'
import { errorMessage, useDataAccess } from '../../data/DataProvider'
import type { BudgetPreparation, DraftItem } from '../../data/budgetApi'
import { currentMonth } from '../../utils/date'
import { budgetAmount } from './budgetInput'

type Row = { key: number; item: DraftItem; amount: string }
export default function BudgetSetupScreen({ month, onDone, onCancel }: { month: string; onDone: (saved: boolean) => void; onCancel: () => void }) {
  const { mutate, pending } = useDataAccess()
  const guide = useOnboarding()
  const beginSetup = guide?.beginSetup
  const [draft, setDraft] = useState<BudgetPreparation | null>(null)
  const [rows, setRows] = useState<Row[]>([])
  const [food, setFood] = useState({ weekday: '', saturday: '', sunday: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const sequence = useRef(0)
  const readOnly = month !== currentMonth()
  const [attempt, setAttempt] = useState(0)
  const [loading, setLoading] = useState(true)
  const request = useRef<{ month: string; attempt: number; promise: Promise<BudgetPreparation> } | null>(null)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    if (readOnly) { setLoading(false); return }
    let active = true
    setLoading(true); setError('')
    // StrictMode reattaches to the same request rather than posting twice.
    if (!request.current || request.current.month !== month || request.current.attempt !== attempt) {
      request.current = { month, attempt, promise: mutate(api => api.prepareBudget(month)) }
    }
    request.current.promise.then(value => {
      if (!active) return
      if (value.status === 'ready') { done.current(false); return }
      beginSetup?.(value.copiedFromMonth !== null)
      setDraft(value)
      setRows(value.items.map(item => ({ key: sequence.current++, item, amount: item.amount === null ? '' : String(item.amount) })))
      setFood({ weekday: value.food.weekday === null ? '' : String(value.food.weekday), saturday: value.food.saturday === null ? '' : String(value.food.saturday), sunday: value.food.sunday === null ? '' : String(value.food.sunday) })
    }).catch(error => { if (active) setError(errorMessage(error)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [month, readOnly, attempt, mutate, beginSetup])
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending || !draft || readOnly) return
    setError('')
    try {
      const items = rows.map(({ item, amount }) => {
        if (!item.name.trim() || [...item.name.trim()].length > 100 || !item.categoryId) throw new Error('각 항목의 이름(100자 이내)과 카테고리를 입력해 주세요.')
        return { ...item, name: item.name.trim(), amount: budgetAmount(amount) }
      })
      setSaving(true)
      await mutate(api => api.setupBudget(month, { items, food: { weekday: budgetAmount(food.weekday), saturday: budgetAmount(food.saturday), sunday: budgetAmount(food.sunday) } }))
      onDone(true)
    } catch (error) { setError(errorMessage(error)) }
    finally { setSaving(false) }
  }
  const change = (key: number, patch: Partial<DraftItem>) => setRows(previous => previous.map(row => row.key === key ? { ...row, item: { ...row.item, ...patch } } : row))
  return <main className="detail-shell budget-detail"><Header title="월 예산 준비" onBack={() => { if (!pending) onCancel() }} />
    <p className="notice">{month} 예산을 설정하면 생활비 관리를 시작할 수 있어요. 직전 월이 있으면 예산 목록과 식비만 복사합니다.</p>
    {readOnly && <p role="alert">현재 월만 예산을 준비할 수 있어요.</p>}
    {!draft && !readOnly && <QueryStatus loading={loading} error={error} retry={() => setAttempt(value => value + 1)} />}
    {draft && <SetupGuide />}
    {draft && <form className="record-form setup-form" onSubmit={save} noValidate>
      <fieldset className="form-fields setup-fields" disabled={pending || readOnly || loading}>
        <p className="notice">{draft.copiedFromMonth ? `${draft.copiedFromMonth} 예산을 불러왔어요. 확인하고 저장해 주세요.` : '고정비는 필요한 만큼 추가하고, 식비 3가지는 꼭 입력해 주세요.'}</p>
        <div className="setup-columns">
          <section className="setup-panel" aria-label="고정비 설정">
            <div className="setup-panel-head"><h2>고정비 <small>선택</small></h2><button className="primary-button add-budget" type="button" onClick={() => setRows(previous => [...previous, { key: sequence.current++, item: { id: null, name: '', categoryId: null, amount: null }, amount: '' }])}>+ 고정비 추가</button></div>
            <p className="form-help">월세·통신비처럼 매달 정해진 지출을 추가하세요.</p>
            <div className="setup-item-list">
              {rows.length === 0 && <p className="budget-empty">등록한 고정비가 없어요.<br />위의 고정비 추가 버튼으로 바로 입력할 수 있어요.</p>}
              {rows.map(({ key, item, amount }, index) => <section className="budget-setup-item" key={key}>
                <label className="field"><span>항목명 {index + 1}</span><input autoFocus={!item.name && index === rows.length - 1} value={item.name} placeholder="예: 월세" onChange={event => change(key, { name: event.target.value })} /></label>
                <CategoryPicker value={item.categoryId} onChange={categoryId => change(key, { categoryId })} scope="fixedBudget" optional={false} />
                <label className="field"><span>예산 금액 {index + 1}</span><MoneyInput value={amount} onValueChange={amount => setRows(previous => previous.map(row => row.key === key ? { ...row, amount } : row))} /></label>
                <button className="delete-button" type="button" onClick={() => setRows(previous => previous.filter(row => row.key !== key))}>항목 삭제 {index + 1}</button>
              </section>)}
            </div>
          </section>
          <section className="setup-panel setup-food" aria-label="식비 설정">
            <div className="setup-panel-head"><h2>하루 식비 <small>필수</small></h2></div>
            <p className="form-help">주중·토요일·일요일에 쓸 하루 예산이에요. 같은 금액으로 입력해도 돼요.</p>
            {([['주중 식비', 'weekday'], ['토요일 식비', 'saturday'], ['일요일 식비', 'sunday']] as const).map(([label, key]) => <label className="field" key={key}><span>{label}</span><MoneyInput value={food[key]} onValueChange={value => setFood(previous => ({ ...previous, [key]: value }))} /></label>)}
          </section>
        </div>
        {error && <p className="query-status" role="alert">{error}</p>}
        <div className="setup-actions"><p className="form-help">저장해야 이번 달 예산 설정이 완료돼요.</p><button className="primary-button" type="submit" aria-busy={saving}>{saving ? '저장 중…' : '예산 저장'}</button></div>
      </fieldset>
    </form>}
  </main>
}
