import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import { currentMonth } from '../../utils/date'
import BudgetSetupScreen from './BudgetSetupScreen'

describe('budget preparation', () => {
  it('only prepares on explicit action, then keeps food input when setup fails', async () => {
    const api = createMockDataAccess()
    api.prepareBudget = vi.fn().mockResolvedValue({ month: currentMonth(), status: 'draft', copiedFromMonth: null, items: [], food: { weekday: null, saturday: null, sunday: null } })
    api.setupBudget = vi.fn().mockRejectedValue(new Error('저장 실패'))
    render(<DataProvider implementation={api}><BudgetSetupScreen month={currentMonth()} onDone={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    expect(api.prepareBudget).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '예산 초안 불러오기' }))
    await screen.findByRole('button', { name: '예산 설정 완료' })
    for (const label of ['주중 식비', '토요일 식비', '일요일 식비']) fireEvent.change(screen.getByLabelText(label), { target: { value: '11000' } })
    fireEvent.click(screen.getByRole('button', { name: '예산 설정 완료' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패')
    expect(screen.getByLabelText('주중 식비')).toHaveValue('11000')
    expect(api.setupBudget).toHaveBeenCalledWith(currentMonth(), { items: [], food: { weekday: 11000, saturday: 11000, sunday: 11000 } })
  })
  it('does not write past or future budgets', async () => {
    const api = createMockDataAccess(); api.prepareBudget = vi.fn()
    render(<DataProvider implementation={api}><BudgetSetupScreen month="2000-01" onDone={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    expect(screen.getByRole('button', { name: '예산 초안 불러오기' })).toBeDisabled()
    await waitFor(() => expect(api.prepareBudget).not.toHaveBeenCalled())
  })
})
