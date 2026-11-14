import { budgetAmount } from './budgetInput'
import MoneyInput from '../../components/MoneyInput'
import { useState } from 'react'
import type { BudgetItemInput, BudgetKind } from '../../data/models'
import type { BudgetItemSummary } from '../../data/MoneySheetDataAccess'
import { useDataAccess, errorMessage } from '../../data/DataProvider'
import CategoryPicker from '../../components/CategoryPicker'
import Header from '../../components/Header'
import QueryStatus from '../../components/QueryStatus'
import { won } from '../../utils/money'

export default function FixedBudgetForm({ item, refreshing, loadError, retry, onSave, onDelete, onCancel }: {
  item?: BudgetItemSummary; refreshing: boolean; loadError: string; retry: () => void; onSave: (input: BudgetItemInput) => Promise<void>;
  onDelete: () => Promise<void>; onCancel: () => void;
}) {
  const { pending } = useDataAccess()
  const [kind, setKind] = useState<BudgetKind>(item?.kind ?? (item?.automatic ? 'freeAllowance' : 'fixedExpense'))
  const [name, setName] = useState(item?.name ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(item?.categoryId ?? null)
  const [amount, setAmount] = useState(item ? won(item.amount) : '')
  const [error, setError] = useState('')
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (pending || refreshing || loadError) return
    if (!name.trim() || !categoryId || !amount.trim()) {
      setError('항목명, 카테고리, 예산 금액을 모두 입력해 주세요.')
      return
    }
    let numericAmount: number
    try { numericAmount = budgetAmount(amount.trim()) } catch (error) { setError(errorMessage(error)); return }
    if ([...name.trim()].length > 100) { setError('항목명은 100자 이내로 입력해 주세요.'); return }
    if (item && !item.automatic && numericAmount < item.paid) {
      setError(`이미 지급한 ${won(item.paid)}원보다 작게 예산을 설정할 수 없어요.`)
      return
    }
    try { await onSave({ kind, name: name.trim(), categoryId, amount: numericAmount }) } catch (error) { setError(errorMessage(error)) }
  }
  const remove = async () => {
    if (pending || refreshing || loadError) return
    try { await onDelete() } catch (error) { setError(errorMessage(error)) }
  }
  return (
    <main className="detail-shell">
      <Header title={item ? '고정지출 예산 편집' : '고정지출 예산 추가'} onBack={() => { if (!pending) onCancel() }} />
      <QueryStatus loading={refreshing} error={loadError} retry={retry} />
      <form className="record-form fixed-budget-form" onSubmit={submit} noValidate>
        <fieldset className="form-fields" disabled={pending || refreshing || !!loadError}>
        <label className="field"><span>항목 종류</span><select value={kind} disabled={!!item} onChange={event => setKind(event.target.value as BudgetKind)}><option value="fixedExpense">고정지출</option><option value="freeAllowance">고정여유비</option></select></label>
        <label className="field"><span>항목명</span><input required value={name} readOnly={item?.automatic} onChange={event => setName(event.target.value)} /></label>
        <CategoryPicker value={categoryId} onChange={setCategoryId} scope="fixedBudget" optional={false} />
        <label className="field"><span>예산 금액</span><div className="money-input"><MoneyInput required aria-label="예산 금액" value={amount} onValueChange={setAmount} /><b>원</b></div></label>
        {item?.automatic && <p className="form-help">1일에 자동 반영됩니다. 삭제하면 이번 달 고정여유비는 0원으로 계산돼요.</p>}
        {error && <p className="form-help" role="alert">{error}</p>}
        <div className="form-actions"><button className="secondary-button" type="button" onClick={onCancel}>취소</button><button className="primary-button" type="submit">저장</button></div>
        {item && <button type="button" className="delete-button" onClick={() => void remove()}>삭제</button>}
        </fieldset>
      </form>
    </main>
  )
}
