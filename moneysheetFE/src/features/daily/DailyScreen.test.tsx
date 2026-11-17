import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Daily from './DailyScreen'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
describe('Daily actual balance', () => {
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
