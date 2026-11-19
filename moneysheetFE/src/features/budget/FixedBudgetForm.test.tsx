import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import FixedBudgetForm from './FixedBudgetForm'
import { budgetAmount } from './budgetInput'

describe('ready budget editing', () => {
  it('preserves a failed creation key and rotates it when the submitted input changes', async () => {
    const api=createMockDataAccess();api.getCategories=vi.fn().mockResolvedValue([])
    const onSave=vi.fn().mockRejectedValue(new Error('response lost'))
    render(<DataProvider implementation={api}><FixedBudgetForm refreshing={false} loadError="" retry={vi.fn()} onSave={onSave} onDelete={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    fireEvent.change(screen.getByLabelText('항목명'),{target:{value:'Rent'}})
    fireEvent.change(screen.getByLabelText('예산 금액'),{target:{value:'9000'}})
    fireEvent.click(screen.getByRole('button',{name:'저장'}));await screen.findByRole('alert')
    fireEvent.change(screen.getByLabelText('예산 금액'),{target:{value:'9,000'}})
    fireEvent.click(screen.getByRole('button',{name:'저장'}));await waitFor(()=>expect(onSave).toHaveBeenCalledTimes(2))
    expect(onSave.mock.calls[1][1].idempotencyKey).toBe(onSave.mock.calls[0][1].idempotencyKey)
    fireEvent.change(screen.getByLabelText('예산 금액'),{target:{value:'9001'}})
    fireEvent.click(screen.getByRole('button',{name:'저장'}));await waitFor(()=>expect(onSave).toHaveBeenCalledTimes(3))
    expect(onSave.mock.calls[2][1].idempotencyKey).not.toBe(onSave.mock.calls[1][1].idempotencyKey)
  })
  it('saves a fixed item without choosing a category', async () => {
    const api = createMockDataAccess(); api.getCategories = vi.fn().mockResolvedValue([])
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<DataProvider implementation={api}><FixedBudgetForm refreshing={false} loadError="" retry={vi.fn()} onSave={onSave} onDelete={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    await waitFor(() => expect(screen.getByRole('combobox')).not.toBeDisabled())
    fireEvent.change(screen.getByLabelText('항목명'), { target: { value: 'Rent' } })
    fireEvent.change(screen.getByLabelText('예산 금액'), { target: { value: '100' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ name: 'Rent', amount: 100, categoryId: null }, { idempotencyKey: expect.any(String) }))
  })
  it('rejects zero, unsafe amounts, decimals and malformed commas', () => {
    for (const value of ['0', '10000000000', '1.5', '1,,000', '10,00', 'text']) expect(() => budgetAmount(value)).toThrow()
    expect(budgetAmount('9,999,999,999')).toBe(9999999999)
  })
  it('edits a former allowance as an ordinary item and preserves failed input', async () => {
    const api = createMockDataAccess(); api.getCategories = vi.fn().mockResolvedValue([{ id: '9', name: 'Pocket', scope: 'fixedBudget' }])
    const onSave = vi.fn().mockRejectedValue(new Error('저장 실패'))
    render(<DataProvider implementation={api}><FixedBudgetForm item={{ id: '51', name: '고정여유비', categoryId: '9', amount: 100, paid: 0, remaining: 100, complete: false }} refreshing={false} loadError="" retry={vi.fn()} onSave={onSave} onDelete={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    await screen.findByRole('option', { name: 'Pocket' })
    fireEvent.change(screen.getByLabelText('예산 금액'), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패')
    expect(onSave).toHaveBeenCalledWith({ name: '고정여유비', categoryId: '9', amount: 50 })
    expect(screen.getByLabelText('예산 금액')).toHaveValue('50')
  })
  it('rejects a budget below actual payments for every item', async () => {
    const api = createMockDataAccess(); api.getCategories = vi.fn().mockResolvedValue([{ id: '9', name: 'Pocket', scope: 'fixedBudget' }])
    const onSave = vi.fn()
    render(<DataProvider implementation={api}><FixedBudgetForm item={{ id: '51', name: '고정여유비', categoryId: '9', amount: 100, paid: 60, remaining: 40, complete: false }} refreshing={false} loadError="" retry={vi.fn()} onSave={onSave} onDelete={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    await screen.findByRole('option', { name: 'Pocket' })
    expect(screen.queryByText('항목 종류')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('예산 금액'), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('이미 지급한 60원')
    expect(onSave).not.toHaveBeenCalled()
  })

})
