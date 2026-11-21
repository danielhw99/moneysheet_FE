import { useEffect, useRef, useState, type RefObject } from 'react'
import { currentMonth } from '../../utils/date'

export default function HomeMonthPicker({ month, disabled, changeMonth, close, trigger }: { month: string; disabled: boolean; changeMonth: (offset: number) => void; close: () => void; trigger: RefObject<HTMLButtonElement | null> }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [year, setYear] = useState(Number(month.slice(0, 4)))
  const [monthNumber, setMonthNumber] = useState(Number(month.slice(5)))
  const latest = currentMonth(), latestYear = Number(latest.slice(0, 4)), latestMonth = Number(latest.slice(5))
  const valid = Number.isInteger(year) && year >= 1 && year <= latestYear && monthNumber >= 1 && monthNumber <= 12 && (year < latestYear || monthNumber <= latestMonth)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => { if (element?.open) element.close(); trigger.current?.focus({ preventScroll: true }) }
  }, [trigger])
  const move = () => {
    if (disabled || !valid) return
    const offset = (year - Number(month.slice(0, 4))) * 12 + monthNumber - Number(month.slice(5))
    close()
    if (offset !== 0) changeMonth(offset)
  }
  return <dialog ref={dialog} className="month-picker-dialog" aria-labelledby="month-picker-title"
    onCancel={event => { event.preventDefault(); close() }}
    onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); close() } }}
    onClick={event => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close()
    }}>
    <form onSubmit={event => { event.preventDefault(); move() }}>
      <h2 id="month-picker-title">연월 선택</h2>
      <div className="month-picker-columns">
        <label><span>연도</span><select autoFocus aria-label="연도" value={year} disabled={disabled} onChange={event => {
          const next = Number(event.target.value)
          setYear(next)
          if (next === latestYear && monthNumber > latestMonth) setMonthNumber(latestMonth)
        }}>{Array.from({ length: latestYear }, (_, index) => latestYear - index).map(value => <option key={value} value={value}>{value}년</option>)}</select></label>
        <label><span>월</span><select aria-label="월" value={monthNumber} disabled={disabled} onChange={event => setMonthNumber(Number(event.target.value))}>
          {Array.from({ length: 12 }, (_, index) => index + 1).map(value => <option key={value} value={value} disabled={year === latestYear && value > latestMonth}>{value}월</option>)}
        </select></label>
      </div>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={close}>취소</button><button type="submit" className="primary-button" disabled={disabled || !valid}>이동</button></div>
    </form>
  </dialog>
}
