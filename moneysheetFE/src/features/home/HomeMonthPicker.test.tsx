import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomeMonthHeader } from './HomeScreen'
import { currentMonth } from '../../utils/date'

beforeEach(()=>{
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
})
describe('홈 연월 선택',()=>{
 it('applies the selected year and month only after confirmation',()=>{
  const changeMonth=vi.fn(),month=currentMonth()
  render(<HomeMonthHeader month={month} changeMonth={changeMonth}/>)
  fireEvent.click(screen.getByRole('button',{name:'연월 선택'}))
  fireEvent.change(screen.getByLabelText('연도'),{target:{value:'2024'}})
  fireEvent.change(screen.getByLabelText('월'),{target:{value:'2'}})
  expect(changeMonth).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button',{name:'이동'}))
  expect(changeMonth).toHaveBeenCalledExactlyOnceWith((2024-Number(month.slice(0,4)))*12+2-Number(month.slice(5)))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
 })
 it('keeps the selected date when applying the same month and restores focus on cancel',()=>{
  const changeMonth=vi.fn()
  render(<HomeMonthHeader month={currentMonth()} changeMonth={changeMonth}/>)
  const trigger=screen.getByRole('button',{name:'연월 선택'})
  fireEvent.click(trigger);fireEvent.click(screen.getByRole('button',{name:'이동'}))
  expect(changeMonth).not.toHaveBeenCalled()
  fireEvent.click(trigger);fireEvent.click(screen.getByRole('button',{name:'취소'}))
  expect(trigger).toHaveFocus();expect(changeMonth).not.toHaveBeenCalled()
 })
 it('prevents future months, supports Escape and closes when disabled',()=>{
  const changeMonth=vi.fn(),ui=(disabled:boolean)=><HomeMonthHeader month={currentMonth()} changeMonth={changeMonth} disabled={disabled}/>
  const view=render(ui(false))
  fireEvent.click(screen.getByRole('button',{name:'연월 선택'}))
  const next=Number(currentMonth().slice(5))+1
  if(next<=12)expect(screen.getByRole('option',{name:`${next}월`})).toBeDisabled()
  fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'})
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button',{name:'연월 선택'}));view.rerender(ui(true))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button',{name:'연월 선택'})).toBeDisabled();expect(changeMonth).not.toHaveBeenCalled()
 })
})
