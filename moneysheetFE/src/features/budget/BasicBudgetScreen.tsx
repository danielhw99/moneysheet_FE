import MoneyInput from '../../components/MoneyInput'
import { useState } from 'react'
import type { FoodBudget } from '../../data/models'
import type { Screen } from '../../types/navigation'
import type { BudgetItemSummary } from '../../data/MoneySheetDataAccess'
import { useDataAccess, errorMessage } from '../../data/DataProvider'
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
  const [foodDraft, setFoodDraft] = useState<Record<keyof FoodBudget, string> | null>(null)
  const [saveError, setSaveError] = useState('')
  const hasUnsavedFood = foodDraft !== null && (['weekday', 'saturday', 'sunday'] as const).some(key => foodDraft[key].replace(/,/g, '') !== String(budget?.food[key] ?? ''))
  const saveFood = async () => {
    if (!budget || locked || pending || query.loading || query.error) return
    if (month < currentMonth()) { setSaveError('지난달 식비 예산은 수정할 수 없어요.'); return }
    setSaveError('')
    const values = foodDraft ?? { weekday: won(budget.food.weekday), saturday: won(budget.food.saturday), sunday: won(budget.food.sunday) }
    if (Object.values(values).some(value => !/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value))) { setSaveError('주중·토요일·일요일 식비를 원 단위 정수로 입력해 주세요.'); return }
    const input: FoodBudget = { weekday: Number(values.weekday.replace(/,/g, '')), saturday: Number(values.saturday.replace(/,/g, '')), sunday: Number(values.sunday.replace(/,/g, '')) }
    if (Object.values(input).some(value => !Number.isSafeInteger(value))) { setSaveError('정확하게 계산할 수 있는 식비를 입력해 주세요.'); return }
    try {
      const saved = await mutate(api => api.updateFoodBudget(month, input))
      setFoodDraft({ weekday: won(saved.food.weekday), saturday: won(saved.food.saturday), sunday: won(saved.food.sunday) })
      setLocked(true)
    } catch (error) { setSaveError(errorMessage(error)) }
  }
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
      <Header title="기본지출" onBack={() => go('monthly')} right={<button className={`lock-button ${locked ? 'locked' : ''}`} disabled={pastMonth || pending || query.loading || !!query.error} aria-label={locked ? '예산 잠금 해제' : '예산 잠금'} onClick={() => { setSaveError(''); setLocked(!locked) }}><Icon name={locked ? 'lock' : 'unlock'} size={17} /></button>} />
      <QueryStatus {...query} />
      <div className="sub-month">{month.replace('-', '.')} <span>{pastMonth ? '지난달 · 조회 전용' : locked ? '예산 잠금' : '편집 중'}</span></div>
      <p className="notice">{pastMonth ? '지난달 예산은 수정할 수 없어요.' : locked ? hasUnsavedFood && !query.loading ? '미저장 식비 변경이 있어요. 잠금을 해제하고 저장해 주세요.' : '잠금을 해제하면 이번 달 예산을 수정할 수 있어요.' : `수정한 값은 ${Number(month.slice(5))}월 전체에 적용됩니다.`}</p>
      {saveError && <p className="query-status" role="alert">{saveError}</p>}
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
            {([['주중', 'weekday'], ['토요일', 'saturday'], ['일요일', 'sunday']] as const).map(([label, key]) => <label className="budget-input" key={key}><span>{label}</span><div><MoneyInput disabled={readOnly} value={foodDraft?.[key] ?? won(budget.food[key])} onValueChange={value => setFoodDraft(previous => ({ ...(previous ?? { weekday: won(budget.food.weekday), saturday: won(budget.food.saturday), sunday: won(budget.food.sunday) }), [key]: value }))} /><b>원</b></div></label>)}
            <div className="periods">
              <span><small>1차</small><b>1~11일</b><strong>{won(budget.foodSummary.installments[0])}원</strong></span>
              <span><small>2차</small><b>12~21일</b><strong>{won(budget.foodSummary.installments[1])}원</strong></span>
              <span><small>3차</small><b>22일~말일</b><strong>{won(budget.foodSummary.installments[2])}원</strong></span>
            </div>
          </div>
        </section>
      </div>
      <button className="primary-button bottom-action" disabled={readOnly} onClick={() => void saveFood()}>저장</button>
    </main>
  )
}
