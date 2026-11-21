import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import Home from './HomeScreen'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import { currentMonth } from '../../utils/date'
import type { Screen } from '../../types/navigation'

describe('홈 날짜 선택',()=>{
 const month=currentMonth(),first=month+'-01',second=month+'-02'
 function SelectedHome({shownMonth=month,go=vi.fn()}:{shownMonth?:string;go?:(screen:Screen)=>void}){
  const [selected,setSelected]=useState(first)
  return <Home month={shownMonth} selectedDate={selected} selectDate={setSelected} changeMonth={vi.fn()} go={go}/>
 }
 it('selects even the initial date on the first click and opens Daily only on reselection',()=>{
  const go=vi.fn()
  render(<DataProvider implementation={createMockDataAccess()}><SelectedHome go={go}/></DataProvider>)
  const date=screen.getByRole('button',{name:new RegExp('^'+first)})
  fireEvent.click(date)
  expect(date).toHaveAttribute('aria-pressed','true');expect(go).not.toHaveBeenCalled()
  fireEvent.click(date)
  expect(go).toHaveBeenCalledExactlyOnceWith('daily')
 })
 it('replaces selection without navigating when another date is clicked',()=>{
  const go=vi.fn()
  render(<DataProvider implementation={createMockDataAccess()}><SelectedHome go={go}/></DataProvider>)
  fireEvent.click(screen.getByRole('button',{name:new RegExp('^'+first)}))
  const next=screen.getByRole('button',{name:new RegExp('^'+second)})
  fireEvent.click(next)
  expect(go).not.toHaveBeenCalled();expect(next).toHaveAttribute('aria-pressed','true')
  expect(screen.getByRole('button',{name:new RegExp('^'+first)})).toHaveAttribute('aria-pressed','false')
  fireEvent.click(next);expect(go).toHaveBeenCalledExactlyOnceWith('daily')
 })
 it('resets the activation after month changes, including returning to the original month',()=>{
  const go=vi.fn(),api=createMockDataAccess()
  const view=(shownMonth:string)=><DataProvider implementation={api}><SelectedHome shownMonth={shownMonth} go={go}/></DataProvider>
  const rendered=render(view(month))
  fireEvent.click(screen.getByRole('button',{name:new RegExp('^'+first)}))
  rendered.rerender(view('2024-02'));rendered.rerender(view(month))
  fireEvent.click(screen.getByRole('button',{name:new RegExp('^'+first)}))
  expect(go).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button',{name:new RegExp('^'+first)}))
  expect(go).toHaveBeenCalledExactlyOnceWith('daily')
 })
})
