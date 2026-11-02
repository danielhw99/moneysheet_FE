import { useState } from 'react'
import type { Screen } from '../../types/navigation'
import type { BudgetItemSummary } from '../../data/MoneySheetDataAccess'
import { useDataAccess } from '../../data/DataProvider'
import { useDataQuery } from '../../data/useDataQuery'
import Icon from '../../components/Icon'
import Header from '../../components/Header'
import QueryStatus from '../../components/QueryStatus'
import FixedBudgetForm from './FixedBudgetForm'
import { currentMonth } from '../../utils/date'
import { won } from '../../utils/money'

export default function BasicBudget({ go, month, locked, setLocked }: { go: (s: Screen) => void; month: string; locked: boolean; setLocked: (locked: boolean) => void }) {
  const { pending, mutate } = useDataAccess()
  const query = useDataQuery(`budget:${month}`, api => api.getBudget(month))
  const budget = query.data
  const [editing, setEditing] = useState<BudgetItemSummary | 'new' | null>(null)
  const [, refreshMonth] = useState(currentMonth)
  const pastMonth = month < currentMonth()
  const readOnly = locked || pastMonth || pending || query.loading || !!query.error
  const openForm = (item: BudgetItemSummary | 'new') => {
    const nowMonth = currentMonth()
    if (month < nowMonth) { refreshMonth(nowMonth); return }
    if (!readOnly) setEditing(item)
  }
  if (!budget) return <main className="detail-shell"><Header title="기본지출" onBack={() => go('monthly')} /><QueryStatus {...query} /></main>
  if (editing) return <FixedBudgetForm item={editing === 'new' ? undefined : editing} refreshing={query.loading} loadError={query.error} retry={query.retry}
    onCancel={() => setEditing(null)} onDelete={async () => {
      if (locked || month < currentMonth()) throw new Error('예산 잠금·지난달 여부를 확인해 주세요.')
      if (editing !== 'new') await mutate(api => api.deleteBudgetItem(month, editing.id))
      setEditing(null)
    }} onSave={async input => {
      if (locked || month < currentMonth()) throw new Error('예산 잠금·지난달 여부를 확인해 주세요.')
      await mutate(api => editing === 'new' ? api.createBudgetItem(month, input) : api.updateBudgetItem(month, editing.id, input))
      setEditing(null)
    }} />
  return (
    <main className="detail-shell budget-detail">
      <Header title="기본지출" onBack={() => go('monthly')} right={<button className={`lock-button ${locked ? 'locked' : ''}`} disabled={pastMonth || pending} aria-label={locked ? '예산 잠금 해제' : '예산 잠금'} onClick={() => setLocked(!locked)}><Icon name={locked ? 'lock' : 'unlock'} size={17} /></button>} />
      <QueryStatus {...query} />
      <div className="sub-month">{month.replace('-', '.')} <span>{pastMonth ? '지난달 · 조회 전용' : locked ? '예산 잠금' : '편집 중'}</span></div>
      <p className="notice">{pastMonth ? '지난달 예산은 수정할 수 없어요.' : locked ? '잠금을 해제하면 이번 달 예산을 수정할 수 있어요.' : `수정한 값은 ${Number(month.slice(5))}월 전체에 적용됩니다.`}</p>
      <div className="budget-columns">
        <section className="budget-column">
          <div className="column-head"><b>고정지출</b><span>합계 <strong>{won(budget.fixedTotal)}원</strong></span></div>
          <div className="column-scroll">
            {budget.items.map(item => {
              const state = item.automatic ? '1일 자동 반영' : item.complete ? '완료' : `잔여 ${won(item.remaining)}원`
              return <button className="budget-row" key={item.id} disabled={readOnly} onClick={() => openForm(item)}><span><b className="truncate">{item.name}</b><small className={state === '완료' ? 'complete' : ''}>{state}</small></span><strong>{won(item.amount)}</strong></button>
            })}
          </div>
          <button className="panel-add" disabled={readOnly} onClick={() => openForm('new')}><Icon name="plus" size={16} />항목 추가</button>
        </section>
        <section className="budget-column food-column">
          <div className="column-head"><b>식비</b><span>월 합계 <strong>{won(budget.foodSummary.total)}원</strong></span></div>
          <div className="column-scroll">
            {[['주중', budget.food.weekday], ['토요일', budget.food.saturday], ['일요일', budget.food.sunday]].map(([label, amount]) => {
              const value = won(Number(amount))
              return <label className="budget-input" key={label}><span>{label}</span><div><input disabled={readOnly} defaultValue={value} /><b>원</b></div></label>
            })}
            <div className="periods">
              <span><small>1차</small><b>1~11일</b><strong>{won(budget.foodSummary.installments[0])}원</strong></span>
              <span><small>2차</small><b>12~21일</b><strong>{won(budget.foodSummary.installments[1])}원</strong></span>
              <span><small>3차</small><b>22일~말일</b><strong>{won(budget.foodSummary.installments[2])}원</strong></span>
            </div>
          </div>
        </section>
      </div>
      <button className="primary-button bottom-action" disabled={readOnly} onClick={() => setLocked(true)}>저장</button>
    </main>
  )
}
