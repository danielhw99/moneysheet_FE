import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import Home from './HomeScreen'
import { DataProvider, useDataAccess } from '../../data/DataProvider'
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
 it('blocks quick entry while loading or failed and enables it after retry',async()=>{
  const api=createMockDataAccess(),summary=await api.getHome(month)
  let reject!:(error:Error)=>void
  vi.spyOn(api,'getHome').mockImplementationOnce(()=>new Promise((_done,fail)=>{reject=fail})).mockResolvedValue(summary)
  render(<DataProvider implementation={api}><Home month={month} selectedDate={first} selectDate={vi.fn()} changeMonth={vi.fn()} go={vi.fn()} openRecord={vi.fn()}/></DataProvider>)
  const trigger=screen.getByRole('button',{name:'빠른 작성'})
  expect(trigger).toBeDisabled()
  await waitFor(()=>expect(api.getHome).toHaveBeenCalledOnce())
  await act(async()=>reject(new Error('홈 조회 실패')))
  expect(trigger).toBeDisabled()
  fireEvent.click(screen.getByRole('button',{name:'다시 불러오기'}))
  await waitFor(()=>expect(trigger).toBeEnabled())
 })
 it('blocks calendar and quick entry while another save is pending',async()=>{
  let finish!:()=>void
  const saving=new Promise<void>(resolve=>{finish=resolve})
  function SavingHome(){
   const {mutate}=useDataAccess()
   return <><button onClick={()=>void mutate(()=>saving)}>저장 시작</button><Home month={month} selectedDate={first} selectDate={vi.fn()} changeMonth={vi.fn()} go={vi.fn()} openRecord={vi.fn()}/></>
  }
  render(<DataProvider implementation={createMockDataAccess()}><SavingHome/></DataProvider>)
  const trigger=screen.getByRole('button',{name:'빠른 작성'})
  await waitFor(()=>expect(trigger).toBeEnabled())
  fireEvent.click(trigger);fireEvent.click(screen.getByRole('button',{name:'저장 시작'}))
  expect(trigger).toBeDisabled();expect(screen.queryByRole('navigation',{name:'빠른 작성 항목'})).not.toBeInTheDocument()
  expect(screen.getByRole('button',{name:new RegExp('^'+first)})).toBeDisabled()
  expect(screen.getByRole('button',{name:'이전 달'})).toBeDisabled()
  await act(async()=>finish())
  await waitFor(()=>expect(trigger).toBeEnabled())
 })
})
