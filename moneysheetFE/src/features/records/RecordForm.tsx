import { useState } from 'react'
import type { ListKind, MoneyRecord, RecordDraft, Direction } from '../../data/models'
import type { BudgetSummary } from '../../data/MoneySheetDataAccess'
import { validateRecord } from '../../data/validation'
import { daysInMonth } from '../../utils/date'
import { useDataAccess, errorMessage } from '../../data/DataProvider'
import CategoryPicker from '../../components/CategoryPicker'
import { won } from '../../utils/money'

export default function RecordForm({ kind, item, initialDate, budget, refreshing, onSave, onDelete, onCancel }: {
  kind: ListKind; item?: Readonly<MoneyRecord>; initialDate: string; budget: BudgetSummary | null; refreshing: boolean;
  onSave: (draft: RecordDraft) => Promise<void>; onDelete: () => Promise<void>; onCancel: () => void;
}) {
  const { pending } = useDataAccess()
  const [date, setDate] = useState(item?.date ?? initialDate)
  const [time, setTime] = useState(item?.time ?? '10:30')
  const [direction, setDirection] = useState<Direction>(item?.direction ?? 'expense')
  const [categoryId, setCategoryId] = useState<string | null>(item?.categoryId ?? null)
  const [amount, setAmount] = useState(item ? won(Math.abs(item.amount)) : '')
  const [title, setTitle] = useState(item?.title ?? '')
  const [budgetItemId, setBudgetItemId] = useState(item?.budgetItemId ?? '')
  const [completed, setCompleted] = useState(!!item?.completedOn)
  const [completedOn, setCompletedOn] = useState(item?.completedOn ?? initialDate)
  const [error, setError] = useState('')
  const isMemo = kind === 'memos'
  const isFixed = kind === 'fixed-pay'
  const selectedBudget = budget?.items.find(value => value.id === budgetItemId && !value.automatic)
  const managementMonth = initialDate.slice(0, 7)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending || refreshing) return
    if (isFixed && !selectedBudget) {
      setError('고정지출 예산 항목을 선택해 주세요.')
      return
    }
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(amount.trim())) { setError('금액은 0 이상의 원 단위 정수로 입력해 주세요.'); return }
    const value = Number(amount.replace(/,/g, ''))
    const draft: RecordDraft = {
      date, time, direction: kind === 'transactions' || isMemo ? direction : kind === 'income' ? 'income' : 'expense', title: isFixed ? selectedBudget?.name ?? '' : title.trim(),
      amount: value,
      categoryId: kind === 'transactions' ? categoryId : null,
      budgetItemId: isFixed ? budgetItemId : undefined,
      completedOn: isMemo && completed ? completedOn : null,
    }
    const validationError = validateRecord(kind, draft, managementMonth)
    if (validationError) { setError(validationError); return }
    try { await onSave(draft) } catch (error) { setError(errorMessage(error)) }
  }
  const remove = async () => {
    if (pending || refreshing) return
    try { await onDelete() } catch (error) { setError(errorMessage(error)) }
  }
  return <form className="record-form" onSubmit={submit} noValidate>
    <fieldset className="form-fields" disabled={pending || refreshing}>
    {(kind === 'transactions' || isMemo) && <div className="segment wide" role="group" aria-label={isMemo ? '메모 입출금 구분' : '거래 구분'}>
      <button type="button" className={direction === 'expense' ? 'active' : ''} aria-pressed={direction === 'expense'} onClick={() => { setDirection('expense'); if (direction !== 'expense') setCategoryId(null) }}>{isMemo ? '임시 출금' : '지출'}</button>
      <button type="button" className={direction === 'income' ? 'active' : ''} aria-pressed={direction === 'income'} onClick={() => { setDirection('income'); if (direction !== 'income') setCategoryId(null) }}>{isMemo ? '임시 입금' : '입금'}</button>
    </div>}
    <div className="record-date-time">
      <label className="field"><span>날짜</span><input type="date" value={date} min={isFixed ? managementMonth + '-01' : undefined} max={isFixed ? managementMonth + '-' + daysInMonth(managementMonth) : undefined} onChange={event => setDate(event.target.value)} required /></label>
      <label className="field"><span>시간</span><input type="time" value={time} onChange={event => setTime(event.target.value)} step={60} required /></label>
    </div>
    {isFixed && <>
      <label className="field"><span>고정지출 예산 항목</span><select value={budgetItemId} onChange={event => setBudgetItemId(event.target.value)}><option value="">항목 선택</option>{(budget?.items ?? []).filter(value => !value.automatic).map(value => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label>
      {selectedBudget && <div className="read-only-pair"><span>항목 예산<b>{won(selectedBudget.amount)}원</b></span><span>누적 지급<b>{won(selectedBudget.paid)}원</b></span></div>}
    </>}
    {kind === 'transactions' && <CategoryPicker key={direction} value={categoryId} onChange={setCategoryId} scope="mainTransaction" direction={direction} />}
    <label className="field"><span>{isFixed ? '이번 지급액' : isMemo ? direction === 'income' ? '임시 입금 금액' : '임시 출금 금액' : kind === 'transactions' ? direction === 'income' ? '입금 금액' : '지출 금액' : '금액'}</span><div className="money-input"><input value={amount} onChange={event => setAmount(event.target.value)} inputMode="numeric" required /><b>원</b></div></label>
    {!isFixed && <label className="field"><span>내용</span><input value={title} onChange={event => setTitle(event.target.value)} required /></label>}
    {isMemo && <>
      <label className="policy"><input type="checkbox" checked={completed} onChange={event => setCompleted(event.target.checked)} /> <span>완료 상태로 저장</span></label>
      {completed && <label className="field"><span>완료일</span><input type="date" min={date} max={date.slice(0, 7) + '-' + daysInMonth(date.slice(0, 7))} value={completedOn} onChange={event => setCompletedOn(event.target.value)} required /></label>}
    </>}
    {error && <p className="field-error" role="alert">{error}</p>}
    <p className="form-help">{isMemo ? '메모는 Main 잔액에만 반영돼요. 완료한 날짜의 완료 목록에 저장됩니다.' : isFixed ? '지급일은 선택한 예산과 같은 월이어야 해요. 잔여 예산은 저장 후 계산돼요.' : kind === 'transactions' ? '카테고리는 비워둘 수 있어요. 입력한 기록은 앱 실행 중에 유지됩니다.' : '월별 수입·그 외 지출 기록입니다.'}</p>
    <div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>취소</button><button type="submit" className="primary-button">저장</button></div>
    {item && <button type="button" className="delete-button" onClick={() => void remove()}>삭제</button>}
    </fieldset>
  </form>
}
