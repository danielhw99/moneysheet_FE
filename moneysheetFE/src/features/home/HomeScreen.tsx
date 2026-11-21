import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { HomeDayEntry } from '../../data/MoneySheetDataAccess'
import { useDataAccess } from '../../data/DataProvider'
import { useDataQuery } from '../../data/useDataQuery'
import QueryStatus from '../../components/QueryStatus'
import { won } from '../../utils/money'
import type { Screen, DailyRecordKind, RecordEntry } from '../../types/navigation'
import HomeQuickAdd from './HomeQuickAdd'
import HomeMonthPicker from './HomeMonthPicker'
import Icon from '../../components/Icon'
import BottomNav from '../../components/BottomNav'
import { currentMonth, localDateValue } from '../../utils/date'

export function HomeMonthHeader({ month, changeMonth, disabled = false }: { month: string; changeMonth: (offset: number) => void; disabled?: boolean }) {
  const [choosing, setChoosing] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (disabled) setChoosing(false) }, [disabled])
  const year = Number(month.slice(0, 4))
  const monthNumber = Number(month.slice(5))
  return <div className="month-head home-month-head">
    <button ref={trigger} type="button" className="month-picker home-month-picker" aria-label="연월 선택" aria-haspopup="dialog" aria-expanded={choosing && !disabled} disabled={disabled} onClick={() => setChoosing(true)}><span>{year}년 {monthNumber}월</span><span className="month-caret" aria-hidden="true">▾</span></button>
    <div className="home-month-arrows"><button className="icon-button" aria-label="이전 달" disabled={disabled} onClick={() => changeMonth(-1)}><Icon name="back" /></button>
    <button className="icon-button flip" aria-label="다음 달" disabled={disabled || month >= currentMonth()} onClick={() => changeMonth(1)}><Icon name="back" /></button></div>
    {choosing && !disabled && <HomeMonthPicker key={month} month={month} disabled={disabled} trigger={trigger} changeMonth={changeMonth} close={() => setChoosing(false)}/>}
  </div>
}

export default function Home({ go, month, changeMonth, selectedDate, selectDate, openRecord }: {
  go: (s: Screen) => void; month: string; changeMonth: (offset: number) => void;
  selectedDate: string; selectDate: (date: string) => void;
  openRecord?: (kind: DailyRecordKind, entry: RecordEntry) => void;
}) {
  const { pending } = useDataAccess()
  const [lastPicked, setLastPicked] = useState<string | null>(null)
  useEffect(() => { setLastPicked(null) }, [month])
  const activateDate = (date: string) => {
    if (pending) return
    if (lastPicked === date && selectedDate === date) go('daily')
    else { setLastPicked(date); selectDate(date) }
  }
  const query = useDataQuery(`home:${month}`, api => api.getHome(month))
  const summary = query.data
  const colors = { fixed: 'red', transaction: 'blue', free: 'green', memo: 'black' }
  const entryValue = (entry: HomeDayEntry) => entry.amount !== undefined ? `${entry.kind === 'transaction' && entry.amount > 0 ? '+' : ''}${won(entry.amount)}` : `${entry.count}건`
  const year = Number(month.slice(0, 4))
  const monthIndex = Number(month.slice(5)) - 1
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const calendarDays = Array.from({ length: Math.ceil((firstWeekday + daysInMonth) / 7) * 7 }, (_, index) => index - firstWeekday + 1)
  const today = localDateValue(new Date())
  return (
    <main className="app-shell">
      <section className="screen-content home-content home-calendar-content">
        <HomeMonthHeader month={month} changeMonth={changeMonth} disabled={pending} />
        {query.error ? <QueryStatus {...query} /> : summary && query.loading ? <QueryStatus {...query} quietLoading /> : null}
        <div className="legend">
          <span><i className="dot blue" />내역</span><span><i className="dot red" />고정지출</span>
          <span><i className="dot green" />여유비</span><span><i className="dot black" />메모</span>
        </div>
        <div className="calendar" style={{ '--calendar-weeks': calendarDays.length / 7 } as CSSProperties}>
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => <div className={`weekday ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`} key={d}>{d}</div>)}
          {calendarDays.map((day, i) => {
            const valid = day > 0 && day <= daysInMonth
            const date = month + '-' + String(day).padStart(2, '0')
            const info = valid ? summary?.days[day] : undefined
            return (
              <button key={i} disabled={!valid || pending} aria-pressed={valid ? date === selectedDate : undefined} aria-label={valid ? [date, ...(info?.entries.map(entry => `${entry.label} ${entryValue(entry)}`) ?? [])].join(', ') : undefined} onClick={() => activateDate(date)} className={`day-cell ${valid && date === selectedDate ? 'selected' : ''} ${valid && date === today ? 'today' : ''}`}>
                <span className="day-number">{valid ? day : ''}</span>
                {info && <span className="day-summary" aria-hidden="true">{info.entries.map((entry, index) => <span className="calendar-entry" key={entry.label + index} title={`${entry.label} ${entryValue(entry)}`}><i className={`dot ${colors[entry.kind]}`} /><span className="calendar-entry-value">{entryValue(entry)}</span></span>)}</span>}
              </button>
            )
          })}
        </div>
        {!summary && query.loading && <div className="home-calendar-loading"><QueryStatus loading error="" retry={query.retry}/></div>}
      </section>
      {openRecord && <HomeQuickAdd key={selectedDate} date={selectedDate} disabled={pending || query.loading || !!query.error || !summary || selectedDate.slice(0, 7) !== month} onSelect={kind => openRecord(kind, 'new')}/>}
      <BottomNav screen="home" go={go} />
    </main>
  )
}
