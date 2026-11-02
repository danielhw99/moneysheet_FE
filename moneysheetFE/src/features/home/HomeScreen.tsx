import type { Screen } from '../../types/navigation'
import Icon from '../../components/Icon'
import BottomNav from '../../components/BottomNav'
import { localDateValue } from '../../utils/date'

const dayData: Record<number, { a: string; b?: string; type?: string }> = {
  1: { a: '고정 850,000', type: 'red' }, 2: { a: '내역 22,000', b: '메모 3건', type: 'blue' },
  4: { a: '내역 8,500', type: 'blue' }, 7: { a: '여유 42,000', type: 'green' },
  9: { a: '고정 59,000', type: 'red' }, 12: { a: '내역 31,200', b: '+2건', type: 'blue' },
  16: { a: '여유 28,000', type: 'green' }, 20: { a: '메모 1건', type: 'gray' },
  23: { a: '내역 19,800', type: 'blue' }, 27: { a: '고정 12,900', type: 'red' },
}

export default function Home({ go, month, changeMonth, selectedDate, selectDate }: {
  go: (s: Screen) => void; month: string; changeMonth: (offset: number) => void;
  selectedDate: string; selectDate: (date: string) => void;
}) {
  const year = Number(month.slice(0, 4))
  const monthIndex = Number(month.slice(5)) - 1
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const calendarDays = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => index - firstWeekday + 1)
  const today = localDateValue(new Date())
  const hasSampleData = month === '2026-10'
  return (
    <main className="app-shell">
      <section className="screen-content home-content">
        <div className="month-head">
          <button className="icon-button" aria-label="이전 달" onClick={() => changeMonth(-1)}><Icon name="back" /></button>
          <strong className="month-picker">{year}년 {monthIndex + 1}월</strong>
          <button className="icon-button flip" aria-label="다음 달" onClick={() => changeMonth(1)}><Icon name="back" /></button>
        </div>
        <div className="legend">
          <span><i className="dot blue" />내역</span><span><i className="dot red" />고정지출</span>
          <span><i className="dot green" />여유비</span><span><i className="dot gray" />메모</span>
        </div>
        <div className="calendar">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => <div className={`weekday ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`} key={d}>{d}</div>)}
          {calendarDays.map((day, i) => {
            const valid = day > 0 && day <= daysInMonth
            const date = month + '-' + String(day).padStart(2, '0')
            const info = valid && hasSampleData ? dayData[day] : undefined
            return (
              <button key={i} disabled={!valid} aria-label={valid ? [date, info?.a, info?.b].filter(Boolean).join(', ') : undefined} onClick={() => { selectDate(date); go('daily') }} className={`day-cell ${valid && date === selectedDate ? 'selected' : ''} ${valid && date === today ? 'today' : ''}`}>
                <span className="day-number">{valid ? day : ''}</span>
                {info && <span className={`day-info ${info.type}`}>{info.a}</span>}
                {info?.b && <span className="day-sub">{info.b}</span>}
              </button>
            )
          })}
        </div>
        <button className="month-summary" onClick={() => go('monthly')}>
          <span><small>{monthIndex + 1}월 지출</small><strong>{hasSampleData ? '1,250,000원' : '0원'}</strong></span>
          <span className="summary-free"><small>남은 여유비</small><strong>{hasSampleData ? '68,100원' : '0원'}</strong></span>
          <Icon name="chevron" />
        </button>
      </section>
      <BottomNav screen="home" go={go} />
    </main>
  )
}
