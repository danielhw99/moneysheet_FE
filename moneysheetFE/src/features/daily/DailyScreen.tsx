import MoneyInput from '../../components/MoneyInput'
import { useState } from 'react'
import type { Screen } from '../../types/navigation'
import { useDataAccess, errorMessage } from '../../data/DataProvider'
import { useDataQuery } from '../../data/useDataQuery'
import { recordValue } from '../../data/values'
import { won, signedWon } from '../../utils/money'
import Icon from '../../components/Icon'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import MiniList from '../../components/MiniList'
import QueryStatus from '../../components/QueryStatus'

export default function Daily({ go, date }: { go: (s: Screen) => void; date: string }) {
  const { pending, mutate } = useDataAccess()
  const query = useDataQuery(`daily:${date}`, api => api.getDaily(date))
  const [locked, setLocked] = useState(true)
  const [comparisonAmount, setComparisonAmount] = useState('')
  const [actionError, setActionError] = useState('')
  const summary = query.data
  const toggleMemo = async (id: string) => {
    setActionError('')
    try { await mutate(api => api.completeMemo(id, date)) } catch (error) { setActionError(errorMessage(error)) }
  }
  if (!summary) return <main className="app-shell"><section className="screen-content"><Header title="Daily" onBack={() => go('home')} /><QueryStatus {...query} /></section><BottomNav screen="daily" go={go} /></main>
  const { mainBalance, freeBalance, transactions: dayTransactions, activeMemos, payments: dayPayments } = summary
  return (
    <main className="app-shell">
      <section className="screen-content daily-content">
        <Header title={new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8))).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })} onBack={() => go('home')} />
        <QueryStatus loading={false} error={query.error} retry={query.retry} />
        {actionError && <p className="query-status" role="alert">{actionError}</p>}
        <section className="balance-card">
          <div className="main-balance"><span>Main 계산 잔액</span><strong>{won(mainBalance)}원</strong></div>
          <div className="account-balance">
            <label><span>실제 계좌 잔액</span><MoneyInput disabled={locked} value={comparisonAmount} onValueChange={setComparisonAmount} placeholder="미입력" /><b>원</b></label>
            <button className={locked ? 'lock-button locked' : 'lock-button'} onClick={() => setLocked(!locked)} aria-label={locked ? '잔액 잠금 해제' : '잔액 잠금'}>
              <Icon name={locked ? 'lock' : 'unlock'} size={17} />
            </button>
          </div>
          <p className="helper">{query.loading ? '불러오는 중…' : comparisonAmount === '' ? locked ? '잠금을 해제하고 실제 잔액을 입력해 주세요.' : '비교 잔액은 아직 입력하지 않았어요.' : locked ? '비교 잔액이 잠겨 있어요' : '비교용 값이며 계산 잔액에는 반영되지 않아요'}</p>
        </section>
        <section className="budget-pair">
          <div><span>오늘 여유비</span><strong>{won(freeBalance)}원</strong></div>
          <div><span>오늘 식비 예산</span><strong>{won(summary.foodBudget)}원</strong></div>
        </section>
        <div className="split-panels">
          <MiniList title="내역" onOpen={() => go('transactions')} addLabel="내역 추가" onAdd={() => go('transactions')}>
            {dayTransactions.length === 0 && <p className="record-empty">해당 날짜의 내역이 없습니다.</p>}{dayTransactions.map(item => <button className="compact-row" key={item.id} onClick={() => go('transactions')}><span className="truncate">{item.title}</span><b className={item.direction === 'income' ? 'amount-income' : 'amount-expense'}>{signedWon(recordValue(item))}</b></button>)}
          </MiniList>
          <MiniList title="메모" onOpen={() => go('memos')} addLabel="메모 추가" onAdd={() => go('memos')}>
            {activeMemos.length === 0 && <p className="record-empty">미완료 메모가 없습니다.</p>}
            {activeMemos.map(item => <div className="memo-row" key={item.id}><button className="checkbox" role="checkbox" aria-checked={false} aria-label={`${item.title} 완료`} disabled={pending || query.loading || !!query.error} onClick={() => void toggleMemo(item.id)} /><button className="memo-main" onClick={() => go('memos')}><span className="truncate">{item.title}</span><b>{signedWon(recordValue(item))}</b></button></div>)}
          </MiniList>
        </div>
        <section className="fixed-panel">
          <button className="panel-heading" onClick={() => go('fixed-pay')}><strong>고정지출</strong><Icon name="chevron" size={17} /></button>
          <div className="fixed-scroll">
            {dayPayments.length === 0 && <p className="record-empty">해당 날짜의 지급 기록이 없습니다.</p>}
            {dayPayments.map(payment => <button className="fixed-row" key={payment.record.id} onClick={() => go('fixed-pay')}><span><b>{payment.itemName}</b><small className={payment.complete ? 'complete' : ''}>{payment.complete ? '지급 완료' : `잔여 ${won(payment.remaining)}원`}</small></span><strong className="amount-expense">{won(payment.record.amount)}원</strong></button>)}
          </div>
          <button className="panel-add" onClick={() => go('fixed-pay')}><Icon name="plus" size={16} />지급 기록</button>
        </section>
      </section>
      <BottomNav screen="daily" go={go} />
    </main>
  )
}
