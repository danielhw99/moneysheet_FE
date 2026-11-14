import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import App from './App'
import type { AuthApi } from './features/auth/authApi'
import { ApiError } from './api/httpClient'
import { currentMonth } from './utils/date'
const first = { id: '1', email: 'first@example.com', nickname: 'First' }
const second = { id: '2', email: 'second@example.com', nickname: 'Second' }
function api(): AuthApi {
  return { me: vi.fn().mockResolvedValue(first), login: vi.fn().mockResolvedValue(first), signup: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined), resetCsrf: vi.fn(), onUnauthorized: vi.fn(() => () => {}) }
}
beforeEach(() => vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ code: 'BUDGET_NOT_READY', message: '예산 설정 필요' }), { status: 409 }))))
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
it('resets navigation and date state on user changes, without showing a demo profile', async () => {
  vi.stubEnv('DEV', true)
  const auth = api(); vi.mocked(auth.me).mockResolvedValueOnce(first).mockResolvedValueOnce(second)
  render(<App authApi={auth} />)
  await screen.findByRole('button', { name: 'MY' })
  const month = currentMonth()
  await userEvent.click(screen.getByRole('button', { name: '월 선택' }))
  expect(document.querySelector('.sub-month')!.textContent).toContain(month)
  await userEvent.click(screen.getByRole('button', { name: '이전 월' }))
  expect(document.querySelector('.sub-month')!.textContent).not.toContain(month)
  await userEvent.click(screen.getByRole('button', { name: 'MY' }))
  expect(await screen.findByText(first.email)).toBeInTheDocument()
  fireEvent(window, new Event('focus'))
  await screen.findByRole('button', { name: '예산' })
  await userEvent.click(screen.getByRole('button', { name: '월 선택' }))
  expect(document.querySelector('.sub-month')!.textContent).toContain(month)
  await userEvent.click(screen.getByRole('button', { name: 'MY' }))
  expect(await screen.findByText(second.email)).toBeInTheDocument()
  expect(screen.queryByText(first.email)).not.toBeInTheDocument()
})
it('does not render business mock screens in a production build', async () => {
  vi.stubEnv('DEV', false)
  render(<App authApi={api()} />)
  expect(await screen.findByRole('button', { name: '예산 설정 시작' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'MY' }))
  expect(await screen.findByText(first.email)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Daily' })).not.toBeInTheDocument()
  expect(document.querySelector('.calendar')).not.toBeInTheDocument()
})
it('removes the protected workspace when the session expires', async () => {
  vi.stubEnv('DEV', true)
  const auth = api(); let expired!: () => void
  vi.mocked(auth.onUnauthorized).mockImplementation(listener => { expired = listener; return () => {} })
  render(<App authApi={auth} />); await screen.findByRole('button', { name: 'MY' })
  act(() => expired())
  expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Daily' })).not.toBeInTheDocument()
})
it('preserves an authenticated session on CSRF logout rejection and allows explicit retry', async () => {
  vi.stubEnv('DEV', true)
  const auth = api(); vi.mocked(auth.logout).mockRejectedValueOnce(new ApiError(403, 'CSRF_INVALID', 'csrf')).mockResolvedValueOnce(undefined)
  render(<App authApi={auth} />); await userEvent.click(await screen.findByRole('button', { name: 'MY' }))
  await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('다시 눌러')
  expect(screen.getByText(first.email)).toBeInTheDocument()
  expect(auth.logout).toHaveBeenCalledTimes(1)
  await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))
  expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument()
})
