import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import Monthly from './MonthlyScreen'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'

it('keeps budget navigation available while summary data is loading', async () => {
 const api=createMockDataAccess(), go=vi.fn()
 vi.spyOn(api,'getMonthly').mockReturnValue(new Promise(()=>{}))
 render(<DataProvider implementation={api}><Monthly month="2026-11" go={go} changeMonth={()=>{}} /></DataProvider>)
 await userEvent.click(screen.getByRole('button',{name:/기본지출/}))
 expect(go).toHaveBeenCalledWith('basic')
 expect(screen.getAllByText('집계 중')).toHaveLength(3)
})
it('keeps navigation available on summary failure and restores totals on retry', async () => {
 const api=createMockDataAccess(), go=vi.fn()
 vi.spyOn(api,'getMonthly').mockRejectedValueOnce(new Error('요약 조회 실패')).mockResolvedValue({foodStartDate:'2026-11-01',month:'2026-11',income:500,extra:200,fixedBudget:1000,foodBudget:2000,basicTotal:3000,totalExpense:3200,net:-2700})
 render(<DataProvider implementation={api}><Monthly month="2026-11" go={go} changeMonth={()=>{}} /></DataProvider>)
 await screen.findByText('요약 조회 실패')
 await userEvent.click(screen.getByRole('button',{name:/기본지출/}))
 expect(go).toHaveBeenCalledWith('basic')
 expect(screen.getAllByText('집계 실패')).toHaveLength(3)
 await userEvent.click(screen.getByRole('button',{name:'다시 불러오기'}))
 expect(await screen.findByRole('button',{name:/기본지출.*3,000원/})).toBeInTheDocument()
})
