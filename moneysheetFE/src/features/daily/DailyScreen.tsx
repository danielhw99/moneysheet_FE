import { demoComparisonAmount } from '../../data/mock/fixtures'
import { useState } from 'react'
import type { Screen } from '../../types/navigation'
import type { MoneyRecord } from '../../moneyRecords'
import { memoActive, recordValue, foodForDate, foodThrough, daysInMonth } from '../../moneyRecords'
import { allowanceId, type MonthBudget } from '../budget/budget'
import { won, signedWon } from '../../utils/money'
import Icon from '../../components/Icon'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'
import MiniList from '../../components/MiniList'

export default function Daily({ go, date, memoRecords, transactions, payments, budget, toggleMemo }: {
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
            <label><span>실제 계좌 잔액</span><input disabled={locked} defaultValue={demoComparisonAmount} inputMode="numeric" /><b>원</b></label>
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
