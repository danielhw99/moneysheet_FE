import type { BudgetPreparation } from '../../data/budgetApi'
import { OnboardingProvider, useOnboarding } from '../onboarding/OnboardingProvider'
import { StrictMode } from 'react'
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import type { MoneySheetDataAccess } from '../../data/MoneySheetDataAccess'
import type { Category } from '../../data/models'
import { currentMonth } from '../../utils/date'
import BudgetSetupScreen from './BudgetSetupScreen'

describe('budget preparation', () => {
  it('automatically prepares and keeps food input when setup fails', async () => {
    const api = createMockDataAccess()
    api.prepareBudget = vi.fn().mockResolvedValue({ month: currentMonth(), status: 'draft', copiedFromMonth: null, items: [], food: { enabled: null, paymentMode: 'threeInstallments', weekday: null, saturday: null, sunday: null } })
    api.setupBudget = vi.fn().mockRejectedValue(new Error('저장 실패'))
    render(<DataProvider implementation={api}><BudgetSetupScreen month={currentMonth()} onDone={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    expect(screen.queryByRole('button', { name: '예산 초안 불러오기' })).not.toBeInTheDocument()
    await screen.findByRole('button', { name: '다음: 식비 설정' })
    fireEvent.click(screen.getByRole('button', { name: '다음: 식비 설정' }))
    fireEvent.click(screen.getByRole('switch', { name: '식비 사용' }))
    for (const label of ['주중 식비', '토요일 식비', '일요일 식비']) fireEvent.change(screen.getByLabelText(label), { target: { value: '11000' } })
    fireEvent.click(screen.getByRole('button', { name: '예산 저장' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패')
    expect(screen.getByLabelText('주중 식비')).toHaveValue('11000')
    expect(api.setupBudget).toHaveBeenCalledWith(currentMonth(), { items: [], food: { enabled: true, paymentMode: 'threeInstallments', weekday: 11000, saturday: 11000, sunday: 11000 } })
  })
  it('saves an explicit OFF choice without food amounts', async () => {
    const api=createMockDataAccess(),done=vi.fn()
    api.prepareBudget=vi.fn().mockResolvedValue({month:currentMonth(),status:'draft',copiedFromMonth:null,items:[],food:{enabled:null,paymentMode:'threeInstallments',weekday:null,saturday:null,sunday:null}})
    api.setupBudget=vi.fn().mockResolvedValue({})
    render(<DataProvider implementation={api}><BudgetSetupScreen month={currentMonth()} onDone={done} onCancel={vi.fn()}/></DataProvider>)
    fireEvent.click(await screen.findByRole('button',{name:'다음: 식비 설정'}))
    fireEvent.click(screen.getByRole('button',{name:'식비 사용하지 않기'}))
    expect(screen.getByLabelText('주중 식비')).toBeDisabled()
    fireEvent.click(screen.getByRole('button',{name:'예산 저장'}))
    await waitFor(()=>expect(done).toHaveBeenCalledWith(true))
    expect(api.setupBudget).toHaveBeenCalledWith(currentMonth(),{items:[],food:{enabled:false,paymentMode:'threeInstallments',weekday:null,saturday:null,sunday:null}})
  })
  it('shows the initial category lookup and keeps loaded choices during refresh', async () => {
    const api = createMockDataAccess()
    const category: Readonly<Category> = { id: '9', name: 'Housing', scope: 'fixedBudget' }
    let resolveInitial!: (value: Awaited<ReturnType<MoneySheetDataAccess['getCategories']>>) => void
    let resolveRefresh!: (value: Awaited<ReturnType<MoneySheetDataAccess['getCategories']>>) => void
    api.prepareBudget = vi.fn().mockResolvedValue({
      month: currentMonth(), status: 'draft', copiedFromMonth: null,
      items: [{ id: null, name: 'Rent', categoryId: null, amount: 100 }],
      food: { enabled: true, paymentMode: 'threeInstallments', weekday: 11000, saturday: 11000, sunday: 11000 },
    })
    api.getCategories = vi.fn<MoneySheetDataAccess['getCategories']>()
      .mockImplementationOnce(() => new Promise(resolve => { resolveInitial = resolve }))
      .mockImplementationOnce(() => new Promise(resolve => { resolveRefresh = resolve }))
    const view = render(<DataProvider implementation={api} refreshToken={0}><BudgetSetupScreen month={currentMonth()} onDone={vi.fn()} onCancel={vi.fn()} /></DataProvider>)

    await screen.findByRole('button', { name: '다음: 식비 설정' })
    await waitFor(() => {
      expect(api.getCategories).toHaveBeenCalledOnce()
      expect(screen.getByRole('combobox', {name:/^카테고리/})).toHaveAttribute('aria-busy','true')
    })
    expect(screen.getByRole('combobox', {name:/^카테고리/})).toBeDisabled()
    expect(screen.getByRole('option',{name:'카테고리 불러오는 중…'})).toBeInTheDocument()
    await act(async () => { resolveInitial([category]) })
    expect(await screen.findByRole('option', { name: 'Housing' })).toBeInTheDocument()

    view.rerender(<DataProvider implementation={api} refreshToken={1}><BudgetSetupScreen month={currentMonth()} onDone={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    await waitFor(() => expect(api.getCategories).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('combobox', {name:/^카테고리/})).toHaveAttribute('aria-busy','true')
    expect(screen.getByRole('combobox', {name:/^카테고리/})).toBeDisabled()
    expect(screen.getByRole('option', { name: 'Housing' })).toBeInTheDocument()
    await act(async () => { resolveRefresh([category]) })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
  it.each(['2000-01', '2999-01'])('does not write read-only budget %s', async month => {
    const api = createMockDataAccess(); api.prepareBudget = vi.fn()
    render(<DataProvider implementation={api}><BudgetSetupScreen month={month} onDone={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    expect(await screen.findByRole('alert')).toHaveTextContent('현재 월만')
    await waitFor(() => expect(api.prepareBudget).not.toHaveBeenCalled())
  })
  it('prepares once under StrictMode and only retries after an explicit retry', async () => {
    const api = createMockDataAccess()
    api.prepareBudget = vi.fn().mockRejectedValueOnce(new Error('연결 실패')).mockResolvedValue({ month: currentMonth(), status: 'draft', copiedFromMonth: null, items: [], food: { enabled: null, paymentMode: 'threeInstallments', weekday: null, saturday: null, sunday: null } })
    render(<StrictMode><DataProvider implementation={api}><BudgetSetupScreen month={currentMonth()} onDone={vi.fn()} onCancel={vi.fn()} /></DataProvider></StrictMode>)
    expect(await screen.findByRole('alert')).toHaveTextContent('연결 실패')
    expect(api.prepareBudget).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: '다시 불러오기' }))
    await screen.findByRole('button', { name: '다음: 식비 설정' })
    expect(api.prepareBudget).toHaveBeenCalledTimes(2)
  })
  it('preserves copied item IDs and does not finalize a prepared draft', async () => {
    const api = createMockDataAccess()
    api.prepareBudget = vi.fn().mockResolvedValue({ month: currentMonth(), status: 'draft', copiedFromMonth: '2026-10', items: [{ id: '51', name: '월세', categoryId: 'housing', amount: 100 }], food: { enabled: true, paymentMode: 'threeInstallments', weekday: 1, saturday: 2, sunday: 3 } })
    api.setupBudget = vi.fn().mockResolvedValue({})
    render(<DataProvider implementation={api}><BudgetSetupScreen month={currentMonth()} onDone={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    expect(await screen.findByLabelText('항목명 1')).toHaveValue('월세')
    expect(api.setupBudget).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '다음: 식비 설정' }))
    fireEvent.click(screen.getByRole('button', { name: '예산 저장' }))
    await waitFor(() => expect(api.setupBudget).toHaveBeenCalledWith(currentMonth(), expect.objectContaining({ items: [{ id: '51', name: '월세', categoryId: 'housing', amount: 100 }] })))
  })
  it('returns to the saved budget when prepare observes READY', async () => {
    const api = createMockDataAccess(); api.prepareBudget = vi.fn().mockResolvedValue({ status: 'ready' })
    const done = vi.fn()
    render(<DataProvider implementation={api}><BudgetSetupScreen month={currentMonth()} onDone={done} onCancel={vi.fn()} /></DataProvider>)
    await waitFor(() => expect(done).toHaveBeenCalledWith(false))
    expect(screen.queryByLabelText('주중 식비')).not.toBeInTheDocument()
  })

  it('skipping the tutorial never finalizes the budget or loses food input', async () => {
    localStorage.clear()
    const api = createMockDataAccess()
    api.prepareBudget = vi.fn().mockResolvedValue({ month: currentMonth(), status: 'draft', copiedFromMonth: null, items: [], food: { enabled: null, paymentMode: 'threeInstallments', weekday: null, saturday: null, sunday: null } })
    api.setupBudget = vi.fn().mockRejectedValue(new Error('실패'))
    const done = vi.fn()
    function State() { return <output data-testid="tutorial-state">{useOnboarding()?.stage}</output> }
    render(<OnboardingProvider userId="setup-test"><State /><DataProvider implementation={api}><BudgetSetupScreen month={currentMonth()} onDone={done} onCancel={vi.fn()} /></DataProvider></OnboardingProvider>)
    await screen.findByRole('complementary', { name: '첫 예산 설정 안내' })
    fireEvent.click(screen.getByRole('button', { name: '다음: 식비 설정' }))
    fireEvent.click(screen.getByRole('switch', { name: '식비 사용' }))
    for (const label of ['주중 식비', '토요일 식비', '일요일 식비']) fireEvent.change(screen.getByLabelText(label), { target: { value: '11000' } })
    fireEvent.click(screen.getByRole('button', { name: '안내 건너뛰기' }))
    expect(screen.getByTestId('tutorial-state')).toHaveTextContent('skipped')
    expect(api.setupBudget).not.toHaveBeenCalled(); expect(done).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '예산 저장' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('실패')
    expect(screen.getByLabelText('주중 식비')).toHaveValue('11000')
    expect(done).not.toHaveBeenCalled()
    localStorage.clear()
  })

  it('rejects missing or zero food without calling setup', async () => {
    const api = createMockDataAccess()
    api.prepareBudget = vi.fn().mockResolvedValue({ month: currentMonth(), status: 'draft', copiedFromMonth: null, items: [], food: { enabled: null, paymentMode: 'threeInstallments', weekday: null, saturday: null, sunday: null } })
    api.setupBudget = vi.fn()
    render(<DataProvider implementation={api}><BudgetSetupScreen month={currentMonth()} onDone={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    fireEvent.click(await screen.findByRole('button', { name: '다음: 식비 설정' }))
    fireEvent.click(screen.getByRole('button', { name: '예산 저장' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('switch', { name: '식비 사용' }))
    for (const label of ['주중 식비', '토요일 식비', '일요일 식비']) fireEvent.change(screen.getByLabelText(label), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: '예산 저장' }))
    expect(api.setupBudget).not.toHaveBeenCalled()
  })
  it('ignores a delayed ready response after leaving the setup screen', async () => {
    const api = createMockDataAccess()
    let resolve!: (value: BudgetPreparation) => void
    api.prepareBudget = vi.fn(() => new Promise<BudgetPreparation>(done => { resolve = done }))
    const done = vi.fn()
    const rendered = render(<DataProvider implementation={api}><BudgetSetupScreen month={currentMonth()} onDone={done} onCancel={vi.fn()} /></DataProvider>)
    await waitFor(() => expect(api.prepareBudget).toHaveBeenCalledOnce())
    rendered.unmount()
    await act(async () => { resolve({ month: currentMonth(), status: 'ready', copiedFromMonth: null, items: [], food: { enabled: true, paymentMode: 'threeInstallments', weekday: 1, saturday: 1, sunday: 1 } }) })
    expect(done).not.toHaveBeenCalled()
  })

  it('announces saving and prevents duplicate submits until a delayed save fails', async () => {
    const api = createMockDataAccess()
    api.prepareBudget = vi.fn().mockResolvedValue({ month: currentMonth(), status: 'draft', copiedFromMonth: null, items: [], food: { enabled: true, paymentMode: 'threeInstallments', weekday: 11000, saturday: 11000, sunday: 11000 } })
    let reject!: (error: Error) => void
    api.setupBudget = vi.fn(() => new Promise<Awaited<ReturnType<typeof api.setupBudget>>>((_resolve, fail) => { reject = fail }))
    render(<DataProvider implementation={api}><BudgetSetupScreen month={currentMonth()} onDone={vi.fn()} onCancel={vi.fn()} /></DataProvider>)
    fireEvent.click(await screen.findByRole('button', { name: '다음: 식비 설정' }))
    fireEvent.click(screen.getByRole('button', { name: '예산 저장' }))
    const saving = await screen.findByRole('button', { name: '저장 중…' })
    expect(saving).toBeDisabled(); expect(saving).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(saving)
    expect(api.setupBudget).toHaveBeenCalledOnce()
    await act(async () => { reject(new Error('저장 실패')) })
    expect(await screen.findByRole('alert')).toHaveTextContent('저장 실패')
    expect(screen.getByRole('button', { name: '예산 저장' })).toBeEnabled()
    expect(screen.getByLabelText('주중 식비')).toHaveValue('11000')
  })

})
