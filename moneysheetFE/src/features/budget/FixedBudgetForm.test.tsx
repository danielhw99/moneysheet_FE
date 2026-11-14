import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import FixedBudgetForm from './FixedBudgetForm'
import { budgetAmount } from './budgetInput'

describe('ready budget editing', () => {
  it('rejects zero, unsafe amounts, decimals and malformed commas', () => {
    for (const value of ['0', '10000000000', '1.5', '1,,000', '10,00', 'text']) expect(() => budgetAmount(value)).toThrow()
    expect(budgetAmount('9,999,999,999')).toBe(9999999999)
  })
  it('allows reducing automatic allowance and preserves its kind on save', async () => {
    const api = createMockDataAccess(); api.getCategories = vi.fn().mockResolvedValue([{ id: '9', name: 'Pocket', scope: 'fixedBudget' }])
    const onSave = vi.fn().mockRejectedValue(new Error('저장 실패'))
    render(<DataProvider implementation={api}><FixedBudgetForm item={{ id: '51', kind: 'freeAllowance', name: '고정여유비', categoryId: '9', amount: 100, paid: 100, remaining: 0, automatic: true, complete: true }} refreshing={false} loadError="" retry={vi.fn()} onSave={onSave} onDelete={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    await screen.findByRole('option', { name: 'Pocket' })
    fireEvent.change(screen.getByLabelText('예산 금액'), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패')
    expect(onSave).toHaveBeenCalledWith({ kind: 'freeAllowance', name: '고정여유비', categoryId: '9', amount: 50 })
    expect(screen.getByLabelText('예산 금액')).toHaveValue('50')
  })
})
