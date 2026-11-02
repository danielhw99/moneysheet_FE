import { useState } from 'react'
import type { Category } from '../../moneyRecords'
import CategoryPicker, { type AddCategory } from '../../components/CategoryPicker'
import Header from '../../components/Header'
import { allowanceId, type FixedBudgetItem } from './budget'
import { won } from '../../utils/money'

export default function FixedBudgetForm({ item, categories, addCategory, onSave, onDelete, onCancel }: { item?: FixedBudgetItem; categories: Category[]; addCategory: AddCategory; onSave: (values: Pick<FixedBudgetItem, 'name' | 'categoryId' | 'amount'>) => boolean; onDelete: () => boolean; onCancel: () => void }) {
  const [name, setName] = useState(item?.name ?? '')
  const [categoryId, setCategoryId] = useState<string | null>(item?.categoryId ?? null)
  const [amount, setAmount] = useState(item ? won(item.amount) : '')
  const [error, setError] = useState('')
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !categoryId || !amount.trim()) {
      setError('항목명, 카테고리, 예산 금액을 모두 입력해 주세요.')
      return
    }
    const numericAmount = Number(amount.trim().replace(/,/g, ''))
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(amount.trim()) || !Number.isSafeInteger(numericAmount)) {
      setError('예산 금액은 정확하게 계산할 수 있는 0 이상의 원 단위 정수로 입력해 주세요.')
      return
    }
    if (!onSave({ name: name.trim(), categoryId, amount: numericAmount })) {
      setError('예산이 잠겨 있거나 지난달이면 저장할 수 없어요. 금액 합계도 확인해 주세요.')
    }
  }
  return (
    <main className="detail-shell">
      <Header title={item ? '고정지출 예산 편집' : '고정지출 예산 추가'} onBack={onCancel} />
      <form className="record-form fixed-budget-form" onSubmit={submit} noValidate>
        <label className="field"><span>항목명</span><input required value={name} readOnly={item?.id === allowanceId} onChange={event => setName(event.target.value)} /></label>
        <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} onAdd={addCategory} scope="fixedBudget" optional={false} />
        <label className="field"><span>예산 금액</span><div className="money-input"><input required aria-label="예산 금액" inputMode="numeric" value={amount} onChange={event => setAmount(event.target.value)} /><b>원</b></div></label>
        {item?.id === allowanceId && <p className="form-help">1일에 자동 반영됩니다. 삭제하면 이번 달 고정여유비는 0원으로 계산돼요.</p>}
        {error && <p className="form-help" role="alert">{error}</p>}
        <div className="form-actions"><button className="secondary-button" type="button" onClick={onCancel}>취소</button><button className="primary-button" type="submit">저장</button></div>
        {item && <button type="button" className="delete-button" onClick={() => { if (!onDelete()) setError('예산 잠금·지난달 여부를 확인해 주세요. 지급 기록이 있는 항목은 기록을 먼저 삭제해 주세요.') }}>삭제</button>}
      </form>
    </main>
  )
}
