import MoneyInput from '../../components/MoneyInput'
import { useEffect, useState } from 'react'
import type { Screen, DailyRecordKind, RecordEntry } from '../../types/navigation'
import { useDataAccess, errorMessage } from '../../data/DataProvider'
import { useDataQuery } from '../../data/useDataQuery'
import { recordValue } from '../../data/values'
import { won, signedWon } from '../../utils/money'
import Icon from '../../components/Icon'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import MiniList from '../../components/MiniList'
import QueryStatus from '../../components/QueryStatus'
import { currentMonth, localDateValue } from '../../utils/date'

export default function Daily({ go, date, changeDate, openRecord }: { go: (s: Screen) => void; date: string; changeDate?: (date: string) => void; openRecord?: (kind: DailyRecordKind, entry: RecordEntry) => void }) {
  const { pending, mutate } = useDataAccess()
  const query = useDataQuery(`daily:${date}`, api => api.getDaily(date))
  const [actionError, setActionError] = useState('')
  const foodSettings=useDataQuery(`daily-food:${date.slice(0,7)}`,api=>api.getBudget(date.slice(0,7)))
  const summary = query.data
  const open = (kind: DailyRecordKind, entry: RecordEntry) => {
    if (pending || query.loading || !!query.error) return
    if (openRecord) openRecord(kind, entry)
    else go(kind)
  }
  const toggleMemo = async (id: string) => {
    setActionError('')
    try { await mutate(api => api.completeMemo(date.slice(0, 7), id, date)) } catch (error) { setActionError(errorMessage(error)) }
  }
  const adjacentDate = (offset: number) => {
    const next = new Date(date + 'T12:00:00')
    next.setDate(next.getDate() + offset)
    return localDateValue(next)
  }
  const moveDate = (offset: number) => {
    const next = adjacentDate(offset)
    if (!pending && next.slice(0, 7) <= currentMonth()) changeDate?.(next)
  }
  const dateHeader = <><Header title="Daily" onBack={() => go('home')} /><div className="date-strip">
    <button type="button" disabled={pending || !changeDate} aria-label="이전 날짜" onClick={() => moveDate(-1)}><Icon name="back" size={17} /></button>
    <strong>{new Date(date + 'T12:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })}</strong>
    <button type="button" className="flip" disabled={pending || !changeDate || adjacentDate(1).slice(0, 7) > currentMonth()} aria-label="다음 날짜" onClick={() => moveDate(1)}><Icon name="back" size={17} /></button>
  </div></>
  if (!summary) return <main className="app-shell"><section className="screen-content">{dateHeader}<QueryStatus {...query} /></section><BottomNav screen="daily" go={go} /></main>
  const { mainBalance, freeBalance, transactions: dayTransactions, activeMemos, payments: dayPayments } = summary
  return (
    <main className="app-shell">
      <section className="screen-content daily-content">
        {dateHeader}
        <QueryStatus loading={false} error={query.error} retry={query.retry} />
        {actionError && <p className="query-status" role="alert">{actionError}</p>}
        <section className="balance-card">
          <div className="main-balance"><span>Main 계산 잔액</span><strong>{won(mainBalance)}원</strong></div>
          <BalanceCheck key={date} date={date} />
        </section>
        <section className="budget-pair">
          <div><span>오늘 여유비</span><strong>{won(freeBalance)}원</strong></div>
          {foodSettings.data?.food.enabled && <div><span>오늘 식비 예산</span><strong>{won(summary.foodBudget)}원</strong></div>}
        </section>
        <div className="split-panels">
          <MiniList title="내역" onOpen={() => go('transactions')} addLabel="내역 추가" onAdd={() => open('transactions', 'new')}>
            {dayTransactions.length === 0 && <p className="record-empty">해당 날짜의 내역이 없습니다.</p>}{dayTransactions.map(item => <button className="compact-row" key={item.id} onClick={() => open('transactions', { id: item.id })}><span className="truncate">{item.title}</span><b className={item.direction === 'income' ? 'amount-income' : 'amount-expense'}>{signedWon(recordValue(item))}</b></button>)}
          </MiniList>
          <MiniList title="메모" onOpen={() => go('memos')} addLabel="메모 추가" onAdd={() => open('memos', 'new')}>
            {activeMemos.length === 0 && <p className="record-empty">미완료 메모가 없습니다.</p>}
            {activeMemos.map(item => <div className="memo-row" key={item.id}><button className="checkbox" role="checkbox" aria-checked={false} aria-label={`${item.title} 완료`} disabled={pending || query.loading || !!query.error} onClick={() => void toggleMemo(item.id)} /><button className="memo-main" onClick={() => open('memos', { id: item.id })}><span className="truncate">{item.title}</span><b>{signedWon(recordValue(item))}</b></button></div>)}
          </MiniList>
        </div>
        <section className="fixed-panel">
          <button className="panel-heading" onClick={() => go('fixed-pay')}><strong>고정지출</strong><Icon name="chevron" size={17} /></button>
          <div className="fixed-scroll">
            {dayPayments.length === 0 && <p className="record-empty">해당 날짜의 지급 기록이 없습니다.</p>}
            {dayPayments.map(payment => <button className="fixed-row" key={payment.record.id} onClick={() => open('fixed-pay', { id: payment.record.id })}><span><b>{payment.itemName}</b><small className={payment.complete ? 'complete' : ''}>{payment.complete ? '지급 완료' : `잔여 ${won(payment.remaining)}원`}</small></span><strong className="amount-expense">{won(payment.record.amount)}원</strong></button>)}
          </div>
          <button className="panel-add" onClick={() => open('fixed-pay', 'new')}><Icon name="plus" size={16} />지급 기록</button>
        </section>
      </section>
      <BottomNav screen="daily" go={go} />
    </main>
  )
}

function BalanceCheck({ date }: { date: string }) {
 const query = useDataQuery(`balance-check:${date}`, api => api.getBalanceCheck(date))
 if (!query.data) return <QueryStatus {...query} />
 return <><QueryStatus loading={false} error={query.error} retry={query.retry} /><BalanceCheckForm key={date} date={date} initial={query.data} blocked={query.loading || !!query.error} /></>
}

function BalanceCheckForm({ date, initial, blocked }: { date: string; initial: import('../../data/MoneySheetDataAccess').DailyBalanceCheck; blocked: boolean }) {
 const { mutate, pending } = useDataAccess()
 const [amount, setAmount] = useState(initial.actualBalance === null ? '' : String(initial.actualBalance))
 const [locked, setLocked] = useState(initial.locked)
 const [dirty, setDirty] = useState(false)
 const [saving, setSaving] = useState(false)
 const [error, setError] = useState('')
 useEffect(() => {
  if (dirty || blocked || pending || saving) return
  setAmount(initial.actualBalance === null ? '' : String(initial.actualBalance))
  setLocked(initial.locked)
 }, [initial, dirty, blocked, pending, saving])
 const toggle = async () => {
  if (blocked || pending || saving) return
  setSaving(true)
  setError('')
  try {
   if (amount !== '' && !/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(amount)) throw new Error('금액의 쉼표 위치를 확인해 주세요.')
   const actualBalance = amount === '' ? null : Number(amount.replace(/,/g, ''))
   if (actualBalance !== null && (!Number.isSafeInteger(actualBalance) || actualBalance < 0 || actualBalance > 9999999999)) throw new Error('실제 잔액은 0~9,999,999,999원으로 입력해 주세요.')
   const saved = await mutate(api => api.saveBalanceCheck(date, { actualBalance, locked: !locked }))
   setAmount(saved.actualBalance === null ? '' : String(saved.actualBalance))
   setLocked(saved.locked)
   setDirty(false)
  } catch (e) { setError(errorMessage(e)) }
  finally { setSaving(false) }
 }
 return <>
  <div className="account-balance">
   <label><span>실제 계좌 잔액</span><MoneyInput aria-label="실제 계좌 잔액" disabled={locked || pending || saving || blocked} value={amount} onValueChange={value => { setAmount(value); setDirty(true) }} placeholder="미입력" /><b>원</b></label>
   <button type="button" className={locked ? 'lock-button locked' : 'lock-button'} disabled={pending || saving || blocked} onClick={() => void toggle()} aria-label={locked ? '잔액 잠금 해제' : '잔액 잠금'}><Icon name={locked ? 'lock' : 'unlock'} size={17} /></button>
  </div>
  <p className="helper">{pending ? '저장 중…' : locked ? amount === '' ? '잠금을 해제하고 실제 잔액을 입력해 주세요.' : '실제 잔액이 저장되어 잠겨 있어요.' : '입력 후 잠금을 누르면 저장돼요. 계산 잔액에는 반영되지 않아요.'}</p>
  {error && <p role="alert">{error}</p>}
 </>
}
