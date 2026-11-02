import type { Screen } from '../../types/navigation'
import { fixedTotal, monthFoodBudget, type MonthBudget } from '../budget/budget'
import { won } from '../../utils/money'
import Icon from '../../components/Icon'
import BottomNav from '../../components/BottomNav'

const monthlySections = [
  { title: '기본지출', desc: '고정지출 + 식비 예산', target: 'basic' as Screen },
  { title: '그 외 지출', desc: '저축계좌 출금', target: 'extra' as Screen },
  { title: '수입', desc: '이번 달 수동 입력', target: 'income' as Screen },
]

export default function Monthly({ go, month, changeMonth, budget, income, extra }: { go: (s: Screen) => void; month: string; changeMonth: (offset: number) => void; budget: MonthBudget; income: number; extra: number }) {
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
