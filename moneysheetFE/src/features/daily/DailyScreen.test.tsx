import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Daily from './DailyScreen'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import type { DailyBalanceCheck } from '../../data/MoneySheetDataAccess'
function deferred<T>() {
 let resolve!: (value: T) => void
 const promise=new Promise<T>(done=>{ resolve=done })
 return {promise,resolve}
}
describe('Daily actual balance', () => {
 it('syncs a same-date refetch when clean and preserves unsaved edits', async () => {
  const api=createMockDataAccess({today:()=> '2026-11-17'})
  await api.saveBalanceCheck('2026-11-17',{actualBalance:100,locked:false})
  const ui=(refreshToken:number)=><DataProvider implementation={api} refreshToken={refreshToken}><Daily date="2026-11-17" go={()=>{}} /></DataProvider>
  const view=render(ui(0))
  const field=await screen.findByLabelText('실제 계좌 잔액')
  expect(field).toHaveValue('100')
  await api.saveBalanceCheck('2026-11-17',{actualBalance:200,locked:true})
  view.rerender(ui(1))
  await waitFor(()=>{ expect(field).toHaveValue('200'); expect(field).toBeDisabled() })
  fireEvent.click(screen.getByRole('button',{name:'잔액 잠금 해제'}))
  await waitFor(()=>expect(field).toBeEnabled())
  fireEvent.change(field,{target:{value:'333'}})
  await api.saveBalanceCheck('2026-11-17',{actualBalance:444,locked:true})
  view.rerender(ui(2))
  await waitFor(()=>expect(field).toBeEnabled())
  expect(field).toHaveValue('333')
  expect(screen.getByRole('button',{name:'잔액 잠금'})).toBeEnabled()
 })
 it('blocks a delayed refetch and ignores its response after changing dates', async () => {
  const api=createMockDataAccess({today:()=> '2026-11-17'})
  await api.saveBalanceCheck('2026-11-17',{actualBalance:100,locked:false})
  await api.saveBalanceCheck('2026-11-16',{actualBalance:200,locked:false})
  const load=vi.spyOn(api,'getBalanceCheck')
  const ui=(date:string,refreshToken:number)=><DataProvider implementation={api} refreshToken={refreshToken}><Daily date={date} go={()=>{}} /></DataProvider>
  const view=render(ui('2026-11-17',0))
  const field=await screen.findByLabelText('실제 계좌 잔액')
  const late=deferred<DailyBalanceCheck>()
  load.mockImplementationOnce(()=>late.promise)
  view.rerender(ui('2026-11-17',1))
  await waitFor(()=>expect(field).toBeDisabled())
  expect(screen.getByRole('button',{name:'잔액 잠금'})).toBeDisabled()
  view.rerender(ui('2026-11-16',1))
  await waitFor(()=>expect(screen.getByLabelText('실제 계좌 잔액')).toHaveValue('200'))
  await act(async()=>late.resolve({date:'2026-11-17',actualBalance:999,locked:true}))
  expect(screen.getByLabelText('실제 계좌 잔액')).toHaveValue('200')
  expect(screen.getByLabelText('실제 계좌 잔액')).toBeEnabled()
 })
 it('blocks edits during delayed saving and keeps the new date intact', async () => {
  const api=createMockDataAccess({today:()=> '2026-11-17'})
  await api.saveBalanceCheck('2026-11-17',{actualBalance:100,locked:false})
  await api.saveBalanceCheck('2026-11-16',{actualBalance:200,locked:false})
  const late=deferred<DailyBalanceCheck>()
  vi.spyOn(api,'saveBalanceCheck').mockImplementationOnce(()=>late.promise)
  const ui=(date:string)=><DataProvider implementation={api}><Daily date={date} go={()=>{}} /></DataProvider>
  const view=render(ui('2026-11-17'))
  const field=await screen.findByLabelText('실제 계좌 잔액')
  fireEvent.change(field,{target:{value:'333'}})
  fireEvent.click(screen.getByRole('button',{name:'잔액 잠금'}))
  await waitFor(()=>expect(field).toBeDisabled())
  expect(screen.getByRole('button',{name:'잔액 잠금'})).toBeDisabled()
  view.rerender(ui('2026-11-16'))
  await waitFor(()=>expect(screen.getByLabelText('실제 계좌 잔액')).toHaveValue('200'))
  expect(screen.getByLabelText('실제 계좌 잔액')).toBeDisabled()
  await act(async()=>late.resolve({date:'2026-11-17',actualBalance:333,locked:true}))
  await waitFor(()=>expect(screen.getByLabelText('실제 계좌 잔액')).toBeEnabled())
  expect(screen.getByLabelText('실제 계좌 잔액')).toHaveValue('200')
 })
 it('saves zero and lock state, preserves input on failure', async () => {
  const api=createMockDataAccess({today:()=> '2026-11-17'})
  const save=vi.spyOn(api,'saveBalanceCheck')
  const view=render(<DataProvider implementation={api}><Daily date="2026-11-17" go={()=>{}} /></DataProvider>)
  fireEvent.click(await screen.findByRole('button',{name:'잔액 잠금 해제'}))
  const field=await screen.findByLabelText('실제 계좌 잔액')
  await waitFor(()=>expect(field).toBeEnabled())
  fireEvent.change(field,{target:{value:'0'}})
  save.mockRejectedValueOnce(new Error('저장 실패'))
  fireEvent.click(screen.getByRole('button',{name:'잔액 잠금'}))
  expect(await screen.findByText('저장 실패')).toBeInTheDocument()
  expect(field).toHaveValue('0')
  fireEvent.click(screen.getByRole('button',{name:'잔액 잠금'}))
  await waitFor(()=>expect(field).toBeDisabled())
  expect(await api.getBalanceCheck('2026-11-17')).toEqual({date:'2026-11-17',actualBalance:0,locked:true})
  expect((await api.getBalanceCheck('2026-11-16')).actualBalance).toBeNull()
  view.unmount()
  const next=render(<DataProvider implementation={api}><Daily date="2026-11-17" go={()=>{}} /></DataProvider>)
  expect(await screen.findByLabelText('실제 계좌 잔액')).toHaveValue('0')
  next.rerender(<DataProvider implementation={api}><Daily date="2026-11-16" go={()=>{}} /></DataProvider>)
  await waitFor(()=>expect(screen.getByLabelText('실제 계좌 잔액')).toHaveValue(''))
 })
})
