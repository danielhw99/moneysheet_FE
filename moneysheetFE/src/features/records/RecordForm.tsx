import MoneyInput from '../../components/MoneyInput'
import TimePicker from '../../components/TimePicker'
import { useEffect, useRef, useState } from 'react'
import type { ListKind, MoneyRecord, RecordDraft, Direction } from '../../data/models'
import type { BudgetSummary } from '../../data/MoneySheetDataAccess'
import { validateRecord } from '../../data/validation'
import { daysInMonth, localTimeValue } from '../../utils/date'
import { useDataAccess, errorMessage } from '../../data/DataProvider'
import CategoryPicker from '../../components/CategoryPicker'
import { won } from '../../utils/money'
import { createWriteAttempt, type CreateOptions } from '../../data/writeAttempt'

export type RecordContinuation = Pick<RecordDraft, 'date' | 'direction' | 'categoryId'>

export default function RecordForm({ kind, item, initialDate, budget, refreshing, continuation, onSave, onDelete, onCancel }: {
  kind: ListKind; item?: Readonly<MoneyRecord>; initialDate: string; budget: BudgetSummary | null; refreshing: boolean;
  continuation?: RecordContinuation;
  onSave: (draft: RecordDraft, options?: CreateOptions, keepWriting?: boolean) => Promise<void>; onDelete: () => Promise<void>; onCancel: () => void;
}) {
  const { pending } = useDataAccess()
  const [date, setDate] = useState(item?.date ?? continuation?.date ?? initialDate)
  const [time, setTime] = useState(() => item?.time ?? localTimeValue(new Date()))
  const [direction, setDirection] = useState<Direction>(item?.direction ?? continuation?.direction ?? 'expense')
  const [categoryId, setCategoryId] = useState<string | null>(item?.categoryId ?? continuation?.categoryId ?? null)
  const [amount, setAmount] = useState(item ? won(Math.abs(item.amount)) : '')
  const [title, setTitle] = useState(item?.title ?? '')
  const [budgetItemId, setBudgetItemId] = useState(item?.budgetItemId ?? '')
  const [error, setError] = useState('')
  const [attempt] = useState(createWriteAttempt)
  const working = useRef(false), composing = useRef(false), active = useRef(true)
  const contentInput = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const blocked = pending || refreshing || submitting
  useEffect(() => { active.current = true; return () => { active.current = false } }, [])
  useEffect(() => { if (continuation && !blocked) contentInput.current?.focus() }, [continuation, blocked])
  const isMemo = kind === 'memos'
  const isFixed = kind === 'fixed-pay'
  const amountLabel = isFixed ? '이번 지급액' : isMemo ? direction === 'income' ? '임시 입금 금액' : '임시 출금 금액' : kind === 'transactions' ? direction === 'income' ? '입금 금액' : '지출 금액' : '금액'
  const selectedBudget = budget?.items.find(value => value.id === budgetItemId)
  const managementMonth = initialDate.slice(0, 7)
  const submit = async (keepWriting = false) => {
    if (blocked || working.current || composing.current) return
    if (isFixed && !selectedBudget) {
      setError('고정지출 예산 항목을 선택해 주세요.')
      return
    }
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(amount.trim())) { setError('금액은 1원 이상의 원 단위 정수로 입력해 주세요.'); return }
    const value = Number(amount.replace(/,/g, ''))
    const draft: RecordDraft = {
      date, time, direction: kind === 'transactions' || isMemo ? direction : kind === 'income' ? 'income' : 'expense', title: isFixed ? selectedBudget?.name ?? '' : title.trim(),
      amount: value,
      categoryId: kind === 'transactions' ? categoryId : null,
      budgetItemId: isFixed ? budgetItemId : undefined,
      completedOn: isMemo ? item?.completedOn ?? null : null,
    }
    const validationError = validateRecord(kind, draft, managementMonth)
    if (validationError) { setError(validationError); return }
    if (isFixed && selectedBudget) {
      const ownPayment = item?.budgetItemId === selectedBudget.id ? item.amount : 0
      const available = selectedBudget.amount - (selectedBudget.paid - ownPayment)
      if (value > available) {
        setError(`지급 가능한 금액은 ${won(Math.max(available, 0))}원이에요. 초과 지급하려면 예산을 먼저 수정해 주세요.`)
        return
      }
    }
    working.current = true; setSubmitting(true); setError('')
    try {
      if (keepWriting && kind === 'transactions') await onSave(draft, item ? undefined : { idempotencyKey: attempt.keyFor({ kind, managementMonth, draft }) }, true)
      else if (item) await onSave(draft)
      else await onSave(draft, { idempotencyKey: attempt.keyFor({ kind, managementMonth, draft }) })
      attempt.reset()
    } catch (error) { if (active.current) setError(errorMessage(error)) }
    finally { working.current = false; if (active.current) setSubmitting(false) }
  }
  const remove = async () => {
    if (blocked || working.current) return
    working.current = true; setSubmitting(true)
    try { await onDelete() } catch (error) { if (active.current) setError(errorMessage(error)) }
    finally { working.current = false; if (active.current) setSubmitting(false) }
  }
  return <form className="record-form" onSubmit={event => { event.preventDefault(); void submit() }} noValidate
    onCompositionStartCapture={() => { composing.current = true }} onCompositionEndCapture={() => { composing.current = false }}
    onKeyDownCapture={event => {
      if ((event.key === 'Enter' || event.code === 'Enter') && (composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) {
        event.preventDefault(); event.stopPropagation()
      }
    }}>
    <fieldset className="form-fields" disabled={blocked}>
    {(kind === 'transactions' || isMemo) && <div className="segment wide direction-segment" data-selected={direction} role="group" aria-label={isMemo ? '메모 입출금 구분' : '거래 구분'}>
      <button type="button" data-direction="expense" className={direction === 'expense' ? 'active' : ''} aria-pressed={direction === 'expense'} onClick={() => { setDirection('expense'); if (direction !== 'expense') setCategoryId(null) }}>{isMemo ? '임시 출금' : '지출'}</button>
      <button type="button" data-direction="income" className={direction === 'income' ? 'active' : ''} aria-pressed={direction === 'income'} onClick={() => { setDirection('income'); if (direction !== 'income') setCategoryId(null) }}>{isMemo ? '임시 입금' : '입금'}</button>
    </div>}
    <div className="record-date-time">
      <label className="field"><span>날짜</span><input type="date" value={date} min={managementMonth + '-01'} max={managementMonth + '-' + daysInMonth(managementMonth)} onChange={event => setDate(event.target.value)} required /></label>
      <div className="field"><span>시간</span><TimePicker value={time} onChange={setTime} disabled={blocked} /></div>
    </div>
    {isFixed && <>
      <label className="field"><span>고정지출 예산 항목</span><select aria-label="고정지출 예산 항목" value={budgetItemId} onChange={event => setBudgetItemId(event.target.value)}><option value="">항목 선택</option>{(budget?.items ?? []).map(value => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label>
      {selectedBudget && <div className="read-only-pair"><span>항목 예산<b>{won(selectedBudget.amount)}원</b></span><span>월 누적 지급<b>{won(selectedBudget.paid)}원</b></span></div>}
    </>}
    {kind === 'transactions' && <CategoryPicker key={direction} value={categoryId} onChange={setCategoryId} scope="mainTransaction" direction={direction} />}
    <label className="field"><span>{amountLabel}</span><div className="money-input"><MoneyInput aria-label={amountLabel} value={amount} onValueChange={setAmount} required /><b>원</b></div></label>
    {!isFixed && <label className="field"><span>내용</span><input ref={contentInput} type="text" lang="ko" inputMode="text" value={title} onChange={event => setTitle(event.target.value)} required /></label>}
    {isMemo && <p className="form-help">완료·취소는 메모 목록의 체크박스에서 처리해 주세요.{item?.completedOn ? ` 완료일: ${item.completedOn}` : ''}</p>}
    {error && <p className="field-error" role="alert">{error}</p>}
    <p className="form-help">{isMemo ? '메모는 Main 잔액에만 반영돼요. 완료한 날짜의 완료 목록에 저장됩니다.' : isFixed ? '지급일은 선택한 예산과 같은 월이어야 해요. 잔여 예산은 저장 후 계산돼요.' : kind === 'transactions' ? '카테고리는 비워둘 수 있어요. 저장한 기록은 다시 접속해도 확인할 수 있어요.' : '월별 수입·그 외 지출 기록입니다.'}</p>
    <div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>취소</button><button type="submit" className="primary-button">저장</button></div>
    {kind === 'transactions' && <button type="button" className="secondary-button" onClick={() => void submit(true)}>저장 및 계속 이어쓰기</button>}
    {item && <button type="button" className="delete-button" onClick={() => void remove()}>삭제</button>}
    </fieldset>
  </form>
}
