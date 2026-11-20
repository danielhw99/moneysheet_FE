import { ApiError } from '../../api/httpClient'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
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
  let server: BudgetSummary = { month: currentMonth(), items: [], food: { enabled: true, paymentMode: 'threeInstallments', weekday: 11000, saturday: 15000, sunday: 10000 }, fixedTotal: 0, foodSummary: { total: 350000, installments: [1, 1, 1] } }
  api.getBudget = vi.fn(async () => structuredClone(server))
  api.updateFoodBudget = vi.fn(async (_month, food) => { server = { ...server, food }; return structuredClone(server) })
  return { api, changeServer: () => { server = { ...server, food: { enabled: true, paymentMode: 'threeInstallments', weekday: 22000, saturday: 22000, sunday: 22000 } } } }
}
describe('food draft refresh', () => {
  it.each([true,false])('shows future-month read-only guidance before lock state %s', async locked => {
    const {api}=fixture()
    render(<DataProvider implementation={api}><BasicBudget month="9999-12" locked={locked} setLocked={vi.fn()} go={vi.fn()}/></DataProvider>)
    expect(await screen.findByText('미래 월 예산은 조회만 할 수 있어요.')).toBeInTheDocument()
    expect(screen.queryByText(/잠금을 해제하면 이번 달/)).not.toBeInTheDocument()
    expect(screen.queryByText(/수정한 값은 12월/)).not.toBeInTheDocument()
  })
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
  it('opens missing current-month setup automatically and keeps edits through prepare refresh', async () => {
    const api = createMockDataAccess()
    let finishRefresh!: () => void
    const refreshed = new Promise<BudgetSummary>((_resolve, reject) => { finishRefresh = () => reject(new ApiError(409, 'BUDGET_NOT_READY', '예산 미설정')) })
    api.getBudget = vi.fn().mockRejectedValueOnce(new ApiError(409, 'BUDGET_NOT_READY', '예산 미설정')).mockReturnValueOnce(refreshed)
    api.prepareBudget = vi.fn().mockResolvedValue({ month: currentMonth(), status: 'draft', copiedFromMonth: null, items: [], food: { enabled: true, paymentMode: 'threeInstallments', weekday: null, saturday: null, sunday: null } })
    render(<DataProvider implementation={api}><Editor /></DataProvider>)
    const food = await screen.findByLabelText('주중 식비')
    expect(screen.queryByRole('button', { name: '예산 설정 시작' })).not.toBeInTheDocument()
    fireEvent.change(food, { target: { value: '12345' } })
    await waitFor(() => expect(api.getBudget).toHaveBeenCalledTimes(2))
    await act(async () => { finishRefresh(); await refreshed.catch(() => undefined) })
    expect(screen.getByLabelText('주중 식비')).toHaveValue('12345')
    expect(api.prepareBudget).toHaveBeenCalledTimes(1)
  })

})
