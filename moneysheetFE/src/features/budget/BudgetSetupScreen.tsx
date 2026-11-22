import { useOnboarding } from '../onboarding/OnboardingProvider'
import SetupGuide from '../onboarding/SetupGuide'
import { useEffect, useRef, useState } from 'react'
import QueryStatus from '../../components/QueryStatus'
import Header from '../../components/Header'
import FoodSettingsFields from './FoodSettingsFields'
import type { FoodPaymentMode } from '../../data/models'
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
  const [enabled,setEnabled]=useState<boolean|null>(null)
  const [mode,setMode]=useState<FoodPaymentMode>('threeInstallments')
  const [food, setFood] = useState({ weekday: '', saturday: '', sunday: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<0 | 1>(0)
  const working = useRef(false)
  const content = useRef<HTMLDivElement>(null)
  const fixedTitle = useRef<HTMLHeadingElement>(null)
  const foodTitle = useRef<HTMLHeadingElement>(null)
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
      setStep(0)
      setEnabled(value.food.enabled);setMode(value.food.paymentMode)
      setRows(value.items.map(item => ({ key: sequence.current++, item, amount: item.amount === null ? '' : String(item.amount) })))
      setFood({ weekday: value.food.weekday === null ? '' : String(value.food.weekday), saturday: value.food.saturday === null ? '' : String(value.food.saturday), sunday: value.food.sunday === null ? '' : String(value.food.sunday) })
    }).catch(error => { if (active) setError(errorMessage(error)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [month, readOnly, attempt, mutate, beginSetup])
  useEffect(() => {
    if (!draft) return
    if (content.current) content.current.scrollTop = 0
    const title = step === 0 ? fixedTitle : foodTitle
    title.current?.focus({ preventScroll: true })
  }, [step, draft])
  const fixedItems = () => rows.map(({ item, amount }, index) => {
    if (!item.name.trim() || [...item.name.trim()].length > 100) throw new Error(`고정비 ${index + 1}: 항목명을 1~100자로 입력해 주세요.`)
    try { return { ...item, name: item.name.trim(), amount: budgetAmount(amount) } }
    catch (error) { throw new Error(`고정비 ${index + 1}: ${errorMessage(error)}`) }
  })
  const blocked = pending || saving || loading || readOnly
  const advance = () => {
    if (blocked || !draft || working.current) return
    setError('')
    try { fixedItems(); setStep(1) } catch (error) { setError(errorMessage(error)) }
  }
  const previous = () => { if (!blocked && !working.current) { setError(''); setStep(0) } }
  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (blocked || !draft || working.current) return
    if (step === 0) { advance(); return }
    setError('')
    try {
      let items: ReturnType<typeof fixedItems>
      try { items = fixedItems() } catch (error) { setStep(0); throw error }
      if(enabled===null)throw new Error('식비 사용 여부를 선택해 주세요.')
      working.current = true; setSaving(true)
      await mutate(api => api.setupBudget(month, { items, food: enabled?{enabled:true,paymentMode:mode,weekday:budgetAmount(food.weekday),saturday:budgetAmount(food.saturday),sunday:budgetAmount(food.sunday)}:{enabled:false,paymentMode:draft.food.paymentMode,weekday:null,saturday:null,sunday:null} }))
      onDone(true)
    } catch (error) { setError(errorMessage(error)) }
    finally { working.current = false; setSaving(false) }
  }
  const change = (key: number, patch: Partial<DraftItem>) => { setError(''); setRows(previous => previous.map(row => row.key === key ? { ...row, item: { ...row.item, ...patch } } : row)) }
  return <main className="detail-shell budget-detail budget-setup-screen"><Header title="월 예산 준비" onBack={() => { if (working.current) return; if (step === 1) previous(); else onCancel() }} />
    {readOnly && <p role="alert">현재 월만 예산을 준비할 수 있어요.</p>}
    {!draft && !readOnly && <QueryStatus loading={loading} error={error} retry={() => setAttempt(value => value + 1)} />}
    {draft && <form className="record-form setup-form" onSubmit={save} noValidate>
      <fieldset className="form-fields setup-fields" disabled={blocked}>
        <ol className="setup-progress" aria-label="예산 준비 단계">
          <li aria-current={step === 0 ? 'step' : undefined}><span>1</span>고정비</li>
          <li aria-current={step === 1 ? 'step' : undefined}><span>2</span>식비</li>
        </ol>
        <div className="setup-content" ref={content}>
        <p className="setup-month">{month} 예산 준비</p>
        <SetupGuide />
        {draft.copiedFromMonth && <p className="notice">{draft.copiedFromMonth} 예산을 불러왔어요. 확인하고 저장해 주세요.</p>}
          <section className="setup-panel setup-fixed" aria-label="고정비 설정" hidden={step !== 0}>
            <div className="setup-panel-head"><h2 ref={fixedTitle} tabIndex={-1}>고정비 설정 <small>선택</small></h2><button className="primary-button add-budget" type="button" onClick={() => { setError(''); setRows(previous => [...previous, { key: sequence.current++, item: { id: null, name: '', categoryId: null, amount: null }, amount: '' }]) }}>+ 고정비 추가</button></div>
            <p className="form-help">월세·통신비처럼 매달 정해진 지출을 추가하세요.</p>
            <div className="setup-item-list">
              {rows.length === 0 && <p className="budget-empty">등록한 고정비가 없어요.<br />위의 고정비 추가 버튼으로 바로 입력할 수 있어요.</p>}
              {rows.map(({ key, item, amount }, index) => <section className="budget-setup-item" key={key}>
                <label className="field"><span>항목명 {index + 1}</span><input autoFocus={!item.name && index === rows.length - 1} value={item.name} placeholder="예: 월세" onChange={event => change(key, { name: event.target.value })} /></label>
                <CategoryPicker value={item.categoryId} onChange={categoryId => change(key, { categoryId })} scope="fixedBudget" />
                <label className="field"><span>예산 금액 {index + 1}</span><MoneyInput value={amount} onValueChange={amount => { setError(''); setRows(previous => previous.map(row => row.key === key ? { ...row, amount } : row)) }} /></label>
                <button className="delete-button" type="button" onClick={() => { setError(''); setRows(previous => previous.filter(row => row.key !== key)) }}>항목 삭제 {index + 1}</button>
              </section>)}
            </div>
          </section>
          <section className="setup-panel setup-food" aria-label="식비 설정" hidden={step !== 1}>
            <h2 ref={foodTitle} tabIndex={-1}>식비 설정</h2>
            <FoodSettingsFields enabled={enabled} setEnabled={value=>{setError('');setEnabled(value);if(!value)setMode(draft.food.paymentMode)}} mode={mode} setMode={value=>{setError('');setMode(value)}} amounts={food} setAmounts={value=>{setError('');setFood(value)}} disabled={blocked}/>
          </section>
        </div>
        {error && <p className="query-status setup-error" role="alert">{error}</p>}
        <div className="setup-actions"><p className="form-help">{step === 0 ? '고정비가 없어도 다음 단계로 진행할 수 있어요.' : '저장해야 이번 달 예산 설정이 완료돼요.'}</p>
          <div className="setup-action-buttons">
            {step === 1 && <button className="secondary-button" type="button" onClick={previous}>이전: 고정비 설정</button>}
            {step === 0 ? <button className="primary-button" type="submit">다음: 식비 설정</button> : <button className="primary-button" type="submit" aria-busy={saving}>{saving ? '저장 중…' : '예산 저장'}</button>}
          </div>
        </div>
      </fieldset>
    </form>}
  </main>
}
