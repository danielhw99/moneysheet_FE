import { useState } from 'react'
import type { Screen } from './types/navigation'
import Icon from './components/Icon'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import MiniList from './components/MiniList'
import Login from './features/auth/AuthScreen'
import Home from './features/home/HomeScreen'
import My from './features/account/MyScreen'
import SimpleSettings from './features/account/SettingsScreen'
import { currentMonth, localDateValue } from './utils/date'
import { won, signedWon } from './utils/money'
import CategoryPicker, { type AddCategory } from './components/CategoryPicker'
import { initialCategories, initialRecords, recordValue, memoActive, validateRecord, foodForDate, foodThrough, daysInMonth, type Category, type Direction, type ListKind, type MoneyRecord, type RecordDraft } from './moneyRecords'


function Daily({ go, date, memoRecords, transactions, payments, budget, toggleMemo }: {
  go: (s: Screen) => void; date: string; memoRecords: MoneyRecord[]; transactions: MoneyRecord[];
  payments: MoneyRecord[]; budget: MonthBudget; toggleMemo: (id: string) => void;
}) {
  const activeMemos = memoRecords.filter(item => memoActive(item, date))
  const month = date.slice(0, 7)
  const day = Number(date.slice(8))
  const allowance = budget.fixed.find(item => item.id === allowanceId)?.amount ?? 0
  const monthTransactions = transactions.filter(item => item.date.slice(0, 7) === month && item.date <= date)
  const spending = monthTransactions.reduce((sum, item) => sum + (item.direction === 'expense' ? item.amount : 0), 0)
  const paidThrough = day >= 22 ? daysInMonth(month) : day >= 12 ? 21 : 11
  const mainBalance = allowance + foodThrough(month, paidThrough) + monthTransactions.reduce((sum, item) => sum + recordValue(item), 0) + activeMemos.reduce((sum, item) => sum + recordValue(item), 0)
  const freeBalance = allowance + foodThrough(month, day) - spending
  const dayTransactions = transactions.filter(item => item.date === date)
  const dayPayments = payments.filter(item => item.date === date)
  const [locked, setLocked] = useState(true)
  return (
    <main className="app-shell">
      <section className="screen-content daily-content">
        <Header title={new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8))).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })} onBack={() => go('home')} />
        <section className="balance-card">
          <div className="main-balance"><span>Main 계산 잔액</span><strong>{won(mainBalance)}원</strong></div>
          <div className="account-balance">
            <label><span>실제 계좌 잔액</span><input disabled={locked} defaultValue="67,800" inputMode="numeric" /><b>원</b></label>
            <button className={locked ? 'lock-button locked' : 'lock-button'} onClick={() => setLocked(!locked)} aria-label={locked ? '잔액 잠금 해제' : '잔액 잠금'}>
              <Icon name={locked ? 'lock' : 'unlock'} size={17} />
            </button>
          </div>
          <p className="helper">{locked ? '비교 잔액이 잠겨 있어요' : '비교용 값이며 계산 잔액에는 반영되지 않아요'}</p>
        </section>
        <section className="budget-pair">
          <div><span>남은 여유비</span><strong>{won(freeBalance)}원</strong></div>
          <div><span>오늘 식비 예산</span><strong>{won(foodForDate(date))}원</strong></div>
        </section>
        <div className="split-panels">
          <MiniList title="내역" onOpen={() => go('transactions')} addLabel="내역 추가" onAdd={() => go('transactions')}>
            {dayTransactions.length === 0 && <p className="record-empty">해당 날짜의 내역이 없습니다.</p>}{dayTransactions.map(item => <button className="compact-row" key={item.id} onClick={() => go('transactions')}><span className="truncate">{item.title}</span><b className={item.direction === 'income' ? 'amount-income' : 'amount-expense'}>{signedWon(recordValue(item))}</b></button>)}
          </MiniList>
          <MiniList title="메모" onOpen={() => go('memos')} addLabel="메모 추가" onAdd={() => go('memos')}>
            {activeMemos.length === 0 && <p className="record-empty">미완료 메모가 없습니다.</p>}
            {activeMemos.map(item => <div className="memo-row" key={item.id}><button className="checkbox" role="checkbox" aria-checked={false} aria-label={`${item.title} 완료`} onClick={() => toggleMemo(item.id)} /><button className="memo-main" onClick={() => go('memos')}><span className="truncate">{item.title}</span><b>{signedWon(recordValue(item))}</b></button></div>)}
          </MiniList>
        </div>
        <section className="fixed-panel">
          <button className="panel-heading" onClick={() => go('fixed-pay')}><strong>고정지출</strong><Icon name="chevron" size={17} /></button>
          <div className="fixed-scroll">
            {dayPayments.length === 0 && <p className="record-empty">해당 날짜의 지급 기록이 없습니다.</p>}
            {dayPayments.map(payment => {
              const item = budget.fixed.find(item => item.id === payment.budgetItemId)
              if (!item) return null
              const paid = payments.filter(value => value.budgetItemId === item.id && value.date.slice(0, 7) === month && value.date <= date).reduce((sum, value) => sum + value.amount, 0)
              return <button className="fixed-row" key={payment.id} onClick={() => go('fixed-pay')}><span><b>{item.name}</b><small className={item.amount === paid ? 'complete' : ''}>{item.amount === paid ? '지급 완료' : `잔여 ${won(item.amount - paid)}원`}</small></span><strong className="amount-expense">{won(payment.amount)}원</strong></button>
            })}
          </div>
          <button className="panel-add" onClick={() => go('fixed-pay')}><Icon name="plus" size={16} />지급 기록</button>
        </section>
      </section>
      <BottomNav screen="daily" go={go} />
    </main>
  )
}

type FixedBudgetItem = { id: string; name: string; categoryId: string; amount: number; paid: number }
type MonthBudget = { locked: boolean; fixed: FixedBudgetItem[] }
const allowanceId = 'free-allowance'
const monthFoodBudget = (month: string) => foodThrough(month, daysInMonth(month))
const initialBudget = (): MonthBudget => ({
  locked: true,
  fixed: [
    { id: 'rent', name: '월세', categoryId: 'housing', amount: 800000, paid: 0 },
    { id: 'phone', name: '휴대폰 요금', categoryId: 'phone', amount: 59000, paid: 0 },
    { id: 'subscription', name: '구독 서비스', categoryId: 'subscription', amount: 12900, paid: 0 },
    { id: 'insurance', name: '보험료', categoryId: 'insurance', amount: 80000, paid: 0 },
    { id: allowanceId, name: '고정여유비', categoryId: 'allowance', amount: 120000, paid: 0 },
  ],
})
const fixedTotal = (budget: MonthBudget) => budget.fixed.reduce((total, item) => total + item.amount, 0)

const monthlySections = [
  { title: '기본지출', desc: '고정지출 + 식비 예산', target: 'basic' as Screen },
  { title: '그 외 지출', desc: '저축계좌 출금', target: 'extra' as Screen },
  { title: '수입', desc: '이번 달 수동 입력', target: 'income' as Screen },
]

function Monthly({ go, month, changeMonth, budget, income, extra }: { go: (s: Screen) => void; month: string; changeMonth: (offset: number) => void; budget: MonthBudget; income: number; extra: number }) {
  const basicTotal = fixedTotal(budget) + monthFoodBudget(month)
  const totalExpense = basicTotal + extra
  const net = income - totalExpense
  return (
    <main className="app-shell">
      <section className="screen-content">
        <div className="month-head monthly-head">
          <button className="icon-button" aria-label="이전 달" onClick={() => changeMonth(-1)}><Icon name="back" /></button>
          <strong className="month-picker">{month.slice(0, 4)}년 {Number(month.slice(5))}월</strong>
          <button className="icon-button flip" aria-label="다음 달" onClick={() => changeMonth(1)}><Icon name="back" /></button>
        </div>
        <div className="monthly-list">
          {monthlySections.map((item) => (
            <button className="monthly-card" key={item.title} onClick={() => go(item.target)}>
              <span className={`section-icon ${item.title === '수입' ? 'income' : item.title === '그 외 지출' ? 'extra' : ''}`}><Icon name={item.title === '기본지출' ? 'wallet' : item.title === '수입' ? 'plus' : 'monthly'} size={19} /></span>
              <span className="monthly-copy"><b>{item.title}</b><small>{item.desc}</small></span>
              <strong className={item.target === 'income' ? 'amount-income' : 'amount-expense'}>{item.target === 'basic' ? `${won(basicTotal)}원` : `${won(item.target === 'income' ? income : extra)}원`}</strong><Icon name="chevron" size={17} />
            </button>
          ))}
        </div>
        <section className="status-card">
          <div className="status-title"><span>이번 달 현황</span><small>예산 기준</small></div>
          <dl><div><dt>총수입</dt><dd className="amount-income">{won(income)}원</dd></div><div><dt>총지출</dt><dd className="amount-expense">{won(totalExpense)}원</dd></div><div className="net"><dt>순증감</dt><dd>{net >= 0 ? '+' : '-'}{won(Math.abs(net))}원</dd></div></dl>
          <p>순증감은 월 수입에서 총지출을 뺀 금액이에요.</p>
        </section>
      </section>
      <BottomNav screen="monthly" go={go} />
    </main>
  )
}

function FixedBudgetForm({ item, categories, addCategory, onSave, onDelete, onCancel }: { item?: FixedBudgetItem; categories: Category[]; addCategory: AddCategory; onSave: (values: Pick<FixedBudgetItem, 'name' | 'categoryId' | 'amount'>) => boolean; onDelete: () => boolean; onCancel: () => void }) {
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

function BasicBudget({ go, month, budget, categories, addCategory, setLocked, saveItem, deleteItem }: { go: (s: Screen) => void; month: string; budget: MonthBudget; categories: Category[]; addCategory: AddCategory; setLocked: (locked: boolean) => void; saveItem: (item: FixedBudgetItem) => boolean; deleteItem: (id: string) => boolean }) {
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
            {['주중|11,000', '토요일|18,000', '일요일|15,000'].map((row) => {
              const [label, value] = row.split('|')
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

const listConfig: Record<ListKind, { title: string; add: string }> = {
  transactions: { title: '내역', add: '거래 추가' }, memos: { title: '메모', add: '메모 추가' },
  'fixed-pay': { title: '고정지출 지급', add: '지급 기록 추가' }, income: { title: '수입', add: '수입 추가' }, extra: { title: '그 외 지출', add: '지출 추가' },
}

function RecordList({ kind, go, date, changeDate, records, categories, addCategory, budget, saveRecord, deleteRecord, toggleMemo }: {
  kind: ListKind; go: (s: Screen) => void; date: string; changeDate: (date: string) => void;
  records: MoneyRecord[]; categories: Category[]; addCategory: AddCategory; budget: MonthBudget;
  saveRecord: (kind: ListKind, id: string | null, draft: RecordDraft, managementMonth: string) => string;
  deleteRecord: (kind: ListKind, id: string) => void; toggleMemo: (id: string) => void;
}) {
  const [editing, setEditing] = useState<MoneyRecord | 'new' | null>(null)
  const [memoTab, setMemoTab] = useState<'pending' | 'completed'>('pending')
  const cfg = listConfig[kind]
  const monthly = kind === 'income' || kind === 'extra'
  const month = date.slice(0, 7)
  const pending = records.filter(item => memoActive(item, date))
  const completed = records.filter(item => item.completedOn === date)
  const rows = kind === 'memos' ? memoTab === 'pending' ? pending : completed
    : records.filter(item => monthly ? item.date.slice(0, 7) === month : item.date === date)
  const moveDate = (offset: number) => {
    const [year, month, day] = date.split('-').map(Number)
    changeDate(localDateValue(new Date(year, month - 1 + (monthly ? offset : 0), monthly ? 1 : day + offset)))
  }
  const amountTotal = (income: boolean) => rows.reduce((total, item) => total + (item.direction === (income ? 'income' : 'expense') ? item.amount : 0), 0)
  const total = kind === 'memos' ? pending.reduce((sum, item) => sum + recordValue(item), 0)
    : rows.reduce((sum, item) => sum + Math.abs(item.amount), 0)
  return <main className="detail-shell">
    <Header title={editing ? `${cfg.title} ${editing === 'new' ? '추가' : '편집'}` : cfg.title} onBack={() => editing ? setEditing(null) : go(monthly ? 'monthly' : 'daily')} />
    {editing ? <RecordForm kind={kind} item={editing === 'new' ? undefined : editing} initialDate={date} budget={budget} categories={categories} addCategory={addCategory}
      onSave={draft => { const error = saveRecord(kind, editing === 'new' ? null : editing.id, draft, month); if (!error) setEditing(null); return error }}
      onDelete={() => { if (editing !== 'new') deleteRecord(kind, editing.id); setEditing(null) }} onCancel={() => setEditing(null)} /> : <>
      <div className="date-strip">
        <button type="button" aria-label={monthly ? '이전 달' : '이전 날짜'} onClick={() => moveDate(-1)}><Icon name="back" size={17} /></button>
        <strong>{new Date(date + 'T12:00:00').toLocaleDateString('ko-KR', monthly ? { year: 'numeric', month: 'long' } : { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })}</strong>
        <button type="button" className="flip" aria-label={monthly ? '다음 달' : '다음 날짜'} onClick={() => moveDate(1)}><Icon name="back" size={17} /></button>
      </div>
      {kind === 'memos' && <div className="segment" role="group" aria-label="메모 상태">
        <button type="button" className={memoTab === 'pending' ? 'active' : ''} aria-pressed={memoTab === 'pending'} onClick={() => setMemoTab('pending')}>미완료 {pending.length}</button>
        <button type="button" className={memoTab === 'completed' ? 'active' : ''} aria-pressed={memoTab === 'completed'} onClick={() => setMemoTab('completed')}>완료 이력 {completed.length}</button>
      </div>}
      <div className="record-list">
        {rows.length === 0 && <p className="record-empty">{kind === 'memos' ? memoTab === 'completed' ? '이 날짜에 완료한 메모가 없습니다.' : '미완료 메모가 없습니다.' : '해당 기간의 기록이 없습니다.'}</p>}
        {rows.map(item => {
          const category = categories.find(category => category.id === item.categoryId)
          const budgetItem = budget.fixed.find(value => value.id === item.budgetItemId)
          const detail = kind === 'memos' ? item.completedOn === date ? '완료일 ' + item.completedOn : '작성일 ' + item.date
            : kind === 'fixed-pay' ? budgetItem ? budgetItem.amount === budgetItem.paid ? '지급 완료' : `잔여 ${won(budgetItem.amount - budgetItem.paid)}원` : '예산 항목 없음'
            : kind === 'transactions' ? category?.name ?? '미분류' : item.date
          return <div className={`record-row ${kind === 'memos' ? 'memo-record-row' : ''}`} key={item.id}>
            {kind === 'memos' ? <label className="memo-record-check"><input type="checkbox" checked={item.completedOn === date} onChange={() => toggleMemo(item.id)} aria-label={item.title + ' 완료'} /></label>
              : <span className="record-date">{monthly ? Number(item.date.slice(8)) + '일' : item.time}</span>}
            <button type="button" className="memo-record-open" onClick={() => setEditing(item)}>
              <span className="record-title"><b>{kind === 'fixed-pay' ? budgetItem?.name ?? item.title : item.title}</b><small>{detail}</small></span>
              <strong className={kind === 'memos' ? undefined : kind === 'income' || kind === 'transactions' && item.direction === 'income' ? 'amount-income' : 'amount-expense'}>{kind === 'transactions' || kind === 'memos' ? signedWon(recordValue(item)) : won(item.amount) + '원'}</strong><Icon name="chevron" size={16} />
            </button>
          </div>
        })}
      </div>
      {kind === 'transactions' ? <dl className="transaction-totals" aria-label="지출 및 입금 합계">
        <div><dt>지출 합계</dt><dd className="amount-expense">{won(amountTotal(false))}원</dd></div>
        <div><dt>입금 합계</dt><dd className="amount-income">{won(amountTotal(true))}원</dd></div>
      </dl> : <div className="list-total"><span>{kind === 'memos' ? '미완료 보정' : kind === 'fixed-pay' ? '지급 합계' : '월 합계'}</span><strong className={kind === 'memos' ? undefined : kind === 'income' ? 'amount-income' : 'amount-expense'}>{kind === 'memos' ? signedWon(total) : won(total) + '원'}</strong></div>}
      <button className="primary-button bottom-action" onClick={() => setEditing('new')}><Icon name="plus" size={18} />{cfg.add}</button>
    </>}
  </main>
}

function RecordForm({ kind, item, initialDate, budget, categories, addCategory, onSave, onDelete, onCancel }: {
  kind: ListKind; item?: MoneyRecord; initialDate: string; budget: MonthBudget; categories: Category[]; addCategory: AddCategory;
  onSave: (draft: RecordDraft) => string; onDelete: () => void; onCancel: () => void;
}) {
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
  const selectedBudget = budget.fixed.find(value => value.id === budgetItemId && value.id !== allowanceId)
  const managementMonth = initialDate.slice(0, 7)
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
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
    setError(onSave(draft))
  }
  return <form className="record-form" onSubmit={submit} noValidate>
    {(kind === 'transactions' || isMemo) && <div className="segment wide" role="group" aria-label={isMemo ? '메모 입출금 구분' : '거래 구분'}>
      <button type="button" className={direction === 'expense' ? 'active' : ''} aria-pressed={direction === 'expense'} onClick={() => { setDirection('expense'); if (direction !== 'expense') setCategoryId(null) }}>{isMemo ? '임시 출금' : '지출'}</button>
      <button type="button" className={direction === 'income' ? 'active' : ''} aria-pressed={direction === 'income'} onClick={() => { setDirection('income'); if (direction !== 'income') setCategoryId(null) }}>{isMemo ? '임시 입금' : '입금'}</button>
    </div>}
    <div className="record-date-time">
      <label className="field"><span>날짜</span><input type="date" value={date} min={isFixed ? managementMonth + '-01' : undefined} max={isFixed ? managementMonth + '-' + daysInMonth(managementMonth) : undefined} onChange={event => setDate(event.target.value)} required /></label>
      <label className="field"><span>시간</span><input type="time" value={time} onChange={event => setTime(event.target.value)} step={60} required /></label>
    </div>
    {isFixed && <>
      <label className="field"><span>고정지출 예산 항목</span><select value={budgetItemId} onChange={event => setBudgetItemId(event.target.value)}><option value="">항목 선택</option>{budget.fixed.filter(value => value.id !== allowanceId).map(value => <option key={value.id} value={value.id}>{value.name}</option>)}</select></label>
      {selectedBudget && <div className="read-only-pair"><span>항목 예산<b>{won(selectedBudget.amount)}원</b></span><span>누적 지급<b>{won(selectedBudget.paid)}원</b></span></div>}
    </>}
    {kind === 'transactions' && <CategoryPicker key={direction} categories={categories} value={categoryId} onChange={setCategoryId} onAdd={addCategory} scope="mainTransaction" direction={direction} />}
    <label className="field"><span>{isFixed ? '이번 지급액' : isMemo ? direction === 'income' ? '임시 입금 금액' : '임시 출금 금액' : kind === 'transactions' ? direction === 'income' ? '입금 금액' : '지출 금액' : '금액'}</span><div className="money-input"><input value={amount} onChange={event => setAmount(event.target.value)} inputMode="numeric" required /><b>원</b></div></label>
    {!isFixed && <label className="field"><span>내용</span><input value={title} onChange={event => setTitle(event.target.value)} required /></label>}
    {isMemo && <>
      <label className="policy"><input type="checkbox" checked={completed} onChange={event => setCompleted(event.target.checked)} /> <span>완료 상태로 저장</span></label>
      {completed && <label className="field"><span>완료일</span><input type="date" min={date} max={date.slice(0, 7) + '-' + daysInMonth(date.slice(0, 7))} value={completedOn} onChange={event => setCompletedOn(event.target.value)} required /></label>}
    </>}
    {error && <p className="field-error" role="alert">{error}</p>}
    <p className="form-help">{isMemo ? '메모는 Main 잔액에만 반영돼요. 완료한 날짜의 완료 목록에 저장됩니다.' : isFixed ? '지급일은 선택한 예산과 같은 월이어야 해요. 잔여 예산은 저장 후 계산돼요.' : kind === 'transactions' ? '카테고리는 비워둘 수 있어요. 입력한 기록은 앱 실행 중에 유지됩니다.' : '월별 수입·그 외 지출 기록입니다.'}</p>
    <div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>취소</button><button type="submit" className="primary-button">저장</button></div>
    {item && <button type="button" className="delete-button" onClick={onDelete}>삭제</button>}
  </form>
}


export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [recordDate, setRecordDate] = useState(() => localDateValue(new Date()))
  const [month, setMonth] = useState(currentMonth)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [records, setRecords] = useState(() => initialRecords(currentMonth()))
  const [budgets, setBudgets] = useState<Record<string, MonthBudget>>(() => ({ [currentMonth()]: initialBudget() }))
  const baseBudget = budgets[month]
  const budget: MonthBudget = { ...baseBudget, fixed: baseBudget.fixed.map(item => ({ ...item, paid: records['fixed-pay'].filter(record => record.budgetItemId === item.id && record.date.slice(0, 7) === month).reduce((sum, record) => sum + record.amount, 0) })) }
  const changeDate = (nextDate: string) => {
    const nextMonth = nextDate.slice(0, 7)
    setBudgets(previous => previous[nextMonth] ? previous : { ...previous, [nextMonth]: initialBudget() })
    setMonth(nextMonth)
    setRecordDate(nextDate)
  }
  const changeMonth = (offset: number) => {
    const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + offset, 1)
    const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    changeDate(recordDate.slice(0, 7) === next ? recordDate : next + '-01')
  }
  const addCategory: AddCategory = (name, scope, direction) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    const existing = categories.find(item => item.scope === scope && item.direction === direction && item.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())
    if (existing) return existing
    const category: Category = { id: crypto.randomUUID(), name: trimmed, scope, direction }
    setCategories(previous => [...previous, category])
    return category
  }
  const setLocked = (locked: boolean) => {
    if (month < currentMonth()) return
    setBudgets(previous => ({ ...previous, [month]: { ...previous[month], locked } }))
  }
  const saveItem = (item: FixedBudgetItem) => {
    if (budget.locked || month < currentMonth()) return false
    if (!categories.some(category => category.id === item.categoryId && category.scope === 'fixedBudget')) return false
    const fixed = budget.fixed.some(value => value.id === item.id) ? budget.fixed.map(value => value.id === item.id ? item : value) : [...budget.fixed, item]
    if (!Number.isSafeInteger(fixedTotal({ ...budget, fixed }) + monthFoodBudget(month))) return false
    setBudgets(previous => ({ ...previous, [month]: { ...previous[month], fixed: fixed.map(value => ({ ...value, paid: 0 })) } }))
    return true
  }
  const deleteItem = (id: string) => {
    if (budget.locked || month < currentMonth()) return false
    if (records['fixed-pay'].some(record => record.budgetItemId === id && record.date.slice(0, 7) === month)) return false
    setBudgets(previous => ({ ...previous, [month]: { ...previous[month], fixed: previous[month].fixed.filter(item => item.id !== id) } }))
    return true
  }
  const saveRecord = (kind: ListKind, id: string | null, draft: RecordDraft, managementMonth: string) => {
    const validationError = validateRecord(kind, draft, managementMonth)
    if (validationError) return validationError
    if (id && !records[kind].some(item => item.id === id)) return '수정할 기록을 찾을 수 없어요.'
    if (kind === 'fixed-pay') {
      const item = budgets[managementMonth]?.fixed.find(item => item.id === draft.budgetItemId && item.id !== allowanceId)
      if (!item) return '고정지출 예산 항목을 선택해 주세요.'
      const paid = records[kind].filter(item => item.id !== id && item.date.slice(0, 7) === managementMonth && item.budgetItemId === draft.budgetItemId).reduce((sum, item) => sum + item.amount, draft.amount)
      if (!Number.isSafeInteger(paid) || draft.amount < 0) return '지급액 합계를 정확하게 계산할 수 없어요.'
    }
    if (kind === 'transactions' && draft.categoryId && !categories.some(category => category.id === draft.categoryId && category.scope === 'mainTransaction' && category.direction === draft.direction)) return '입출금 구분에 맞는 카테고리를 선택해 주세요.'
    const record: MoneyRecord = { ...draft, id: id ?? crypto.randomUUID() }
    setRecords(previous => ({ ...previous, [kind]: id ? previous[kind].map(item => item.id === id ? record : item) : [...previous[kind], record] }))
    return ''
  }
  const deleteRecord = (kind: ListKind, id: string) => setRecords(previous => ({ ...previous, [kind]: previous[kind].filter(item => item.id !== id) }))
  const toggleMemo = (id: string) => {
    const memo = records.memos.find(item => item.id === id)
    if (!memo || memo.date > recordDate || memo.date.slice(0, 7) !== recordDate.slice(0, 7)) return
    const completedOn = memo.completedOn === recordDate ? null : recordDate
    if (validateRecord('memos', { ...memo, completedOn }, recordDate.slice(0, 7))) return
    setRecords(previous => ({ ...previous, memos: previous.memos.map(item => item.id === id ? { ...item, completedOn } : item) }))
  }
  const monthTotal = (kind: ListKind) => records[kind].filter(item => item.date.slice(0, 7) === month).reduce((sum, item) => sum + item.amount, 0)
  let view: React.ReactNode
  if (screen === 'login' || screen === 'signup') view = <Login key={screen} go={setScreen} signup={screen === 'signup'} />
  else if (screen === 'home') view = <Home go={setScreen} month={month} changeMonth={changeMonth} selectedDate={recordDate} selectDate={changeDate} />
  else if (screen === 'daily') view = <Daily go={setScreen} date={recordDate} memoRecords={records.memos} transactions={records.transactions} payments={records['fixed-pay']} budget={budget} toggleMemo={toggleMemo} />
  else if (screen === 'monthly') view = <Monthly go={setScreen} month={month} changeMonth={changeMonth} budget={budget} income={monthTotal('income')} extra={monthTotal('extra')} />
  else if (screen === 'basic') view = <BasicBudget key={month} go={setScreen} month={month} budget={budget} categories={categories} addCategory={addCategory} setLocked={setLocked} saveItem={saveItem} deleteItem={deleteItem} />
  else if (screen === 'my') view = <My go={setScreen} />
  else if (screen === 'account' || screen === 'settings') view = <SimpleSettings type={screen} go={setScreen} />
  else view = <RecordList key={screen} kind={screen as ListKind} go={setScreen} date={recordDate} changeDate={changeDate} records={records[screen as ListKind]} categories={categories} addCategory={addCategory} budget={budget} saveRecord={saveRecord} deleteRecord={deleteRecord} toggleMemo={toggleMemo} />
  return <div className="prototype"><div className="phone-frame">{view}</div></div>
}
