import { initialFoodBudget } from '../../data/mock/fixtures'
import { useState } from 'react'
import type { Screen } from '../../types/navigation'
import { foodThrough, type Category } from '../../moneyRecords'
import type { AddCategory } from '../../components/CategoryPicker'
import Icon from '../../components/Icon'
import Header from '../../components/Header'
import FixedBudgetForm from './FixedBudgetForm'
import { allowanceId, fixedTotal, monthFoodBudget, type FixedBudgetItem, type MonthBudget } from './budget'
import { currentMonth } from '../../utils/date'
import { won } from '../../utils/money'

export default function BasicBudget({ go, month, budget, categories, addCategory, setLocked, saveItem, deleteItem }: { go: (s: Screen) => void; month: string; budget: MonthBudget; categories: Category[]; addCategory: AddCategory; setLocked: (locked: boolean) => void; saveItem: (item: FixedBudgetItem) => boolean; deleteItem: (id: string) => boolean }) {
  const [editing, setEditing] = useState<FixedBudgetItem | 'new' | null>(null)
  const [, refreshMonth] = useState(currentMonth)
  const pastMonth = month < currentMonth()
  const readOnly = budget.locked || pastMonth
  const openForm = (item: FixedBudgetItem | 'new') => {
    const nowMonth = currentMonth()
    if (month < nowMonth) {
      // Refresh the read-only controls when the month changed while this list was idle.
      refreshMonth(nowMonth)
      return
    }
    if (!readOnly) setEditing(item)
  }
  if (editing) return <FixedBudgetForm categories={categories} addCategory={addCategory} item={editing === 'new' ? undefined : editing} onDelete={() => {
    if (editing === 'new' || !deleteItem(editing.id)) return false
    setEditing(null)
    return true
  }} onCancel={() => setEditing(null)} onSave={values => {
    if (readOnly || month < currentMonth()) return false
    const item = editing === 'new' ? { id: crypto.randomUUID(), paid: 0, ...values } : { ...editing, ...values }
    if (!saveItem(item)) return false
    setEditing(null)
    return true
  }} />
  return (
    <main className="detail-shell budget-detail">
      <Header title="기본지출" onBack={() => go('monthly')} right={<button className={`lock-button ${budget.locked ? 'locked' : ''}`} disabled={pastMonth} aria-label={budget.locked ? '예산 잠금 해제' : '예산 잠금'} onClick={() => setLocked(!budget.locked)}><Icon name={budget.locked ? 'lock' : 'unlock'} size={17} /></button>} />
      <div className="sub-month">{month.replace('-', '.')} <span>{pastMonth ? '지난달 · 조회 전용' : budget.locked ? '예산 잠금' : '편집 중'}</span></div>
      <p className="notice">{pastMonth ? '지난달 예산은 수정할 수 없어요.' : budget.locked ? '잠금을 해제하면 이번 달 예산을 수정할 수 있어요.' : `수정한 값은 ${Number(month.slice(5))}월 전체에 적용됩니다.`}</p>
      <div className="budget-columns">
        <section className="budget-column">
          <div className="column-head"><b>고정지출</b><span>합계 <strong>{won(fixedTotal(budget))}원</strong></span></div>
          <div className="column-scroll">
            {budget.fixed.map(item => {
              const remaining = item.amount - item.paid
              const state = item.id === allowanceId ? '1일 자동 반영' : remaining === 0 ? '완료' : `잔여 ${won(remaining)}원`
              return <button className="budget-row" key={item.id} disabled={readOnly} onClick={() => openForm(item)}><span><b className="truncate">{item.name}</b><small className={state === '완료' ? 'complete' : ''}>{state}</small></span><strong>{won(item.amount)}</strong></button>
            })}
          </div>
          <button className="panel-add" disabled={readOnly} onClick={() => openForm('new')}><Icon name="plus" size={16} />항목 추가</button>
        </section>
        <section className="budget-column food-column">
          <div className="column-head"><b>식비</b><span>월 합계 <strong>{won(monthFoodBudget(month))}원</strong></span></div>
          <div className="column-scroll">
            {[['주중', initialFoodBudget.weekday], ['토요일', initialFoodBudget.saturday], ['일요일', initialFoodBudget.sunday]].map(([label, amount]) => {
              const value = won(Number(amount))
              return <label className="budget-input" key={label}><span>{label}</span><div><input disabled={readOnly} defaultValue={value} /><b>원</b></div></label>
            })}
            <div className="periods">
              <span><small>1차</small><b>1~11일</b><strong>{won(foodThrough(month, 11))}원</strong></span>
              <span><small>2차</small><b>12~21일</b><strong>{won(foodThrough(month, 21) - foodThrough(month, 11))}원</strong></span>
              <span><small>3차</small><b>22일~말일</b><strong>{won(monthFoodBudget(month) - foodThrough(month, 21))}원</strong></span>
            </div>
          </div>
        </section>
      </div>
      <button className="primary-button bottom-action" disabled={readOnly} onClick={() => setLocked(true)}>저장</button>
    </main>
  )
}
