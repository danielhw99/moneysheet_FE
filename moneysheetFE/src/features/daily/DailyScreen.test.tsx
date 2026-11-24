import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Daily from './DailyScreen'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import type { DailyBalanceCheck } from '../../data/MoneySheetDataAccess'
import { currentMonth, daysInMonth } from '../../utils/date'
function deferred<T>() {
 let resolve!: (value: T) => void
 const promise=new Promise<T>(done=>{ resolve=done })
 return {promise,resolve}
}
describe('Daily actual balance', () => {
 it('shows an already loaded account balance while the summary is still pending',async()=>{
  const api=createMockDataAccess({today:()=> '2026-11-17'});
  await api.saveBalanceCheck('2026-11-17',{actualBalance:123,locked:false});
  const late=deferred<Awaited<ReturnType<typeof api.getDaily>>>();
  const original=api.getDaily.bind(api);
  vi.spyOn(api,'getDaily').mockImplementationOnce(()=>late.promise);
  render(<DataProvider implementation={api}><Daily date="2026-11-17" go={()=>{}}/></DataProvider>);
  const field=await screen.findByLabelText('실제 계좌 잔액');
  await waitFor(()=>expect(field).toHaveValue('123'));
  expect(field).toHaveAttribute('aria-busy','false');
  expect(field).toBeDisabled();
  await act(async()=>late.resolve(await original('2026-11-17')));
  await waitFor(()=>expect(field).toBeEnabled());
 })
 it('preserves the just-saved amount when its refetch fails',async()=>{
  const api=createMockDataAccess({today:()=> '2026-11-17'});
  await api.saveBalanceCheck('2026-11-17',{actualBalance:100,locked:false});
  const original=api.getBalanceCheck.bind(api);
  vi.spyOn(api,'getBalanceCheck').mockImplementationOnce(original).mockRejectedValue(new Error('잔액 재조회 실패'));
  render(<DataProvider implementation={api}><Daily date="2026-11-17" go={()=>{}}/></DataProvider>);
  const field=await screen.findByLabelText('실제 계좌 잔액');
  await waitFor(()=>expect(field).toBeEnabled());
  fireEvent.change(field,{target:{value:'333'}});
  fireEvent.click(screen.getByRole('button',{name:'잔액 잠금'}));
  await screen.findByText('잔액 재조회 실패');
  expect(field).toHaveValue('333');
  expect(screen.getByRole('button',{name:'잔액 잠금 해제'})).toBeDisabled();
 })
 it('does not request a future account balance and shows a disabled explanation',async()=>{
  const api=createMockDataAccess({today:()=> '2026-11-17'});
  const load=vi.spyOn(api,'getBalanceCheck');
  render(<DataProvider implementation={api}><Daily date="2099-11-01" go={()=>{}}/></DataProvider>);
  await screen.findByText('미래 날짜의 실제 계좌 잔액은 조회하거나 입력할 수 없어요.');
  expect(screen.getByLabelText('실제 계좌 잔액')).toBeDisabled();
  expect(screen.getByLabelText('실제 계좌 잔액')).toHaveAttribute('aria-busy','false');
  expect(load).not.toHaveBeenCalled();
 })
 it.each([
  ['2026-11-01','이전 날짜','2026-10-31'],
  ['2026-01-01','이전 날짜','2025-12-31'],
  ['2024-03-01','이전 날짜','2024-02-29'],
  ['2024-02-29','다음 날짜','2024-03-01'],
 ])('moves %s through %s to %s', async (date,label,expected) => {
  const api=createMockDataAccess({today:()=> '2026-11-17'}), changeDate=vi.fn()
  render(<DataProvider implementation={api}><Daily date={date} go={()=>{}} changeDate={changeDate} /></DataProvider>)
  fireEvent.click(screen.getByRole('button',{name:label}))
  expect(changeDate).toHaveBeenCalledWith(expected)
 })
 it('prevents navigation into a future month', () => {
  const date=`${currentMonth()}-${daysInMonth(currentMonth())}`, changeDate=vi.fn()
  render(<DataProvider implementation={createMockDataAccess()}><Daily date={date} go={()=>{}} changeDate={changeDate} /></DataProvider>)
  expect(screen.getByRole('button',{name:'다음 날짜'})).toBeDisabled()
  fireEvent.click(screen.getByRole('button',{name:'다음 날짜'}))
  expect(changeDate).not.toHaveBeenCalled()
 })
 it('keeps navigation available after a summary query fails', async () => {
  const api=createMockDataAccess(), changeDate=vi.fn()
  vi.spyOn(api,'getDaily').mockRejectedValue(new Error('조회 실패'))
  render(<DataProvider implementation={api}><Daily date="2026-11-01" go={()=>{}} changeDate={changeDate} /></DataProvider>)
  await screen.findByText('조회 실패')
  fireEvent.click(screen.getByRole('button',{name:'이전 날짜'}))
  expect(changeDate).toHaveBeenCalledWith('2026-10-31')
 })
 it('syncs a same-date refetch when clean and preserves unsaved edits', async () => {
  const api=createMockDataAccess({today:()=> '2026-11-17'})
  await api.saveBalanceCheck('2026-11-17',{actualBalance:100,locked:false})
  const load=vi.spyOn(api,'getBalanceCheck')
  const ui=(refreshToken:number)=><DataProvider implementation={api} refreshToken={refreshToken}><Daily date="2026-11-17" go={()=>{}} /></DataProvider>
  const view=render(ui(0))
  const field=await screen.findByLabelText('실제 계좌 잔액')
  await waitFor(()=>expect(field).toHaveAttribute('aria-busy','false'))
  await waitFor(()=>expect(field).toHaveValue('100'))
  await api.saveBalanceCheck('2026-11-17',{actualBalance:200,locked:true})
  view.rerender(ui(1))
  await waitFor(()=>{ expect(load).toHaveBeenCalledTimes(2); expect(field).toHaveValue('200'); expect(field).toBeDisabled() })
  fireEvent.click(screen.getByRole('button',{name:'잔액 잠금 해제'}))
  await waitFor(()=>{ expect(load).toHaveBeenCalledTimes(3); expect(field).toBeEnabled() })
  fireEvent.change(field,{target:{value:'333'}})
  expect(field).toHaveValue('333')
  await api.saveBalanceCheck('2026-11-17',{actualBalance:444,locked:true})
  const late=deferred<DailyBalanceCheck>()
  load.mockImplementationOnce(()=>late.promise)
  view.rerender(ui(2))
  await waitFor(()=>expect(load).toHaveBeenCalledTimes(4))
  await waitFor(()=>expect(field).toBeDisabled())
  expect(field).toHaveValue('333')
  await act(async()=>late.resolve({date:'2026-11-17',actualBalance:444,locked:true}))
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
  await waitFor(()=>{expect(field).toHaveValue('100');expect(field).toBeEnabled()})
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
  const changeDate=vi.fn()
  const ui=(date:string)=><DataProvider implementation={api}><Daily date={date} go={()=>{}} changeDate={changeDate} /></DataProvider>
  const view=render(ui('2026-11-17'))
  const field=await screen.findByLabelText('실제 계좌 잔액')
  await waitFor(()=>{expect(field).toHaveValue('100');expect(field).toBeEnabled()})
  fireEvent.change(field,{target:{value:'333'}})
  fireEvent.click(screen.getByRole('button',{name:'잔액 잠금'}))
  await waitFor(()=>expect(field).toBeDisabled())
  expect(screen.getByRole('button',{name:'잔액 잠금'})).toBeDisabled()
  expect(screen.getByRole('button',{name:'이전 날짜'})).toBeDisabled()
  expect(screen.getByRole('button',{name:'다음 날짜'})).toBeDisabled()
  fireEvent.click(screen.getByRole('button',{name:'이전 날짜'}))
  expect(changeDate).not.toHaveBeenCalled()
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
  const unlock=await screen.findByRole('button',{name:'잔액 잠금 해제'})
  await waitFor(()=>expect(unlock).toBeEnabled())
  fireEvent.click(unlock)
  const field=await screen.findByLabelText('실제 계좌 잔액')
  await waitFor(()=>expect(field).toHaveAttribute('aria-busy','false'))
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
  await waitFor(()=>expect(screen.getByLabelText('실제 계좌 잔액')).toHaveValue('0'))
  next.rerender(<DataProvider implementation={api}><Daily date="2026-11-16" go={()=>{}} /></DataProvider>)
  await waitFor(()=>expect(screen.getByLabelText('실제 계좌 잔액')).toHaveValue(''))
 })
})

it('formats a loaded and saved actual balance with commas while persisting a number',async()=>{
 const api=createMockDataAccess({today:()=> '2026-11-17'});
 await api.saveBalanceCheck('2026-11-17',{actualBalance:1234567,locked:false});
 const save=vi.spyOn(api,'saveBalanceCheck');
 render(<DataProvider implementation={api}><Daily date="2026-11-17" go={()=>{}}/></DataProvider>);
 const field=await screen.findByLabelText('실제 계좌 잔액');
 await waitFor(()=>{expect(field).toHaveValue('1,234,567');expect(field).toBeEnabled()});
 fireEvent.change(field,{target:{value:'2345678'}});
 fireEvent.click(screen.getByRole('button',{name:'잔액 잠금'}));
 await waitFor(()=>{expect(field).toHaveValue('2,345,678');expect(field).toBeDisabled()});
 expect(save).toHaveBeenCalledWith('2026-11-17',{actualBalance:2345678,locked:true});
})
