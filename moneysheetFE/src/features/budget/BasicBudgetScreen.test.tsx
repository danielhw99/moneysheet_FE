import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import { currentMonth } from '../../utils/date'
import type { BudgetSummary } from '../../data/MoneySheetDataAccess'
import BasicBudget from './BasicBudgetScreen'
function Editor() {
  const [locked, setLocked] = useState(false)
  return <BasicBudget month={currentMonth()} locked={locked} setLocked={setLocked} go={() => {}} />
}
function fixture() {
  const api = createMockDataAccess()
  let server: BudgetSummary = { month: currentMonth(), items: [], food: { weekday: 11000, saturday: 15000, sunday: 10000 }, fixedTotal: 0, foodSummary: { total: 350000, installments: [1, 1, 1] } }
  api.getBudget = vi.fn(async () => structuredClone(server))
  api.updateFoodBudget = vi.fn(async (_month, food) => { server = { ...server, food }; return structuredClone(server) })
  return { api, changeServer: () => { server = { ...server, food: { weekday: 22000, saturday: 22000, sunday: 22000 } } } }
}
describe('food draft refresh', () => {
  it('clears a saved draft so later server food updates are shown', async () => {
    const { api, changeServer } = fixture()
    const view = render(<DataProvider implementation={api} refreshToken={0}><Editor /></DataProvider>)
    await screen.findByLabelText(/주중/)
    fireEvent.change(screen.getByLabelText(/주중/), { target: { value: '12000' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(screen.getByRole('button', { name: '예산 잠금 해제' })).toBeInTheDocument())
    changeServer()
    view.rerender(<DataProvider implementation={api} refreshToken={1}><Editor /></DataProvider>)
    await waitFor(() => expect(screen.getByLabelText(/주중/)).toHaveValue('22,000'))
  })
  it('retains an unsaved food draft while refreshed queries replace server data', async () => {
    const { api, changeServer } = fixture()
    api.updateFoodBudget = vi.fn().mockRejectedValue(new Error('식비 저장 실패'))
    const view = render(<DataProvider implementation={api} refreshToken={0}><Editor /></DataProvider>)
    await screen.findByLabelText(/주중/)
    fireEvent.change(screen.getByLabelText(/주중/), { target: { value: '12345' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('식비 저장 실패')
    changeServer()
    view.rerender(<DataProvider implementation={api} refreshToken={1}><Editor /></DataProvider>)
    await waitFor(() => expect(api.getBudget).toHaveBeenCalledTimes(2))
    expect(screen.getByLabelText(/주중/)).toHaveValue('12345')
  })
})
