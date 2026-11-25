import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import App from './App'
import type { AuthApi } from './features/auth/authApi'
import { ApiError } from './api/httpClient'
import { currentMonth } from './utils/date'
const first = { id: '1', email: 'first@example.com', nickname: 'First' }
const second = { id: '2', email: 'second@example.com', nickname: 'Second' }
function api(): AuthApi {
  return { requestEmailVerification: vi.fn(), confirmEmailVerification: vi.fn(), me: vi.fn().mockResolvedValue(first), login: vi.fn().mockResolvedValue(first), signup: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined), uploadAvatar: vi.fn(), deleteAvatar: vi.fn(), updateProfile:vi.fn(),changePassword:vi.fn(),deleteAccount:vi.fn(),resetCsrf: vi.fn(), restoreSession:vi.fn().mockRejectedValue(new ApiError(401,'UNAUTHENTICATED','expired')),onUnauthorized: vi.fn(() => () => {}) }
}
beforeEach(() => vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => {
  const path = String(url)
  if (path.endsWith('/auth/csrf')) return new Response(JSON.stringify({ token: 'test', headerName: 'X-CSRF-TOKEN' }))
  if (path.endsWith('/budget-preparation')) return new Response(JSON.stringify({ month: currentMonth(), status: 'draft',foodStartDateEditable:true, copiedFromMonth: null, items: [], foodStartDate:new Date().toLocaleDateString('sv-SE').slice(0,7)+'-01',food: { paymentMode: 'threeInstallments', weekday:null, saturday: null, sunday: null } }))
  return new Response(JSON.stringify({ code: 'BUDGET_NOT_READY', message: '예산 설정 필요' }), { status: 409 })
})))
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
it('opens separate category management screens before any budget is ready', async () => {
 vi.stubGlobal('fetch', vi.fn(async (url: RequestInfo | URL) => {
  const path=String(url)
  if(path.includes('/categories'))return new Response(JSON.stringify({items:[]}))
  if(path.endsWith('/auth/csrf'))return new Response(JSON.stringify({token:'test',headerName:'X-CSRF-TOKEN'}))
  if(path.endsWith('/budget-preparation'))return new Response(JSON.stringify({month:currentMonth(),status:'draft',foodStartDateEditable:true,copiedFromMonth:null,items:[],foodStartDate:new Date().toLocaleDateString('sv-SE').slice(0,7)+'-01',food:{paymentMode: 'threeInstallments', weekday:null,saturday:null,sunday:null}}))
  return new Response(JSON.stringify({code:'BUDGET_NOT_READY',message:'예산 설정 필요'}),{status:409})
 }))
 render(<App authApi={api()} />)
 await enterSetup()
 await userEvent.click(screen.getByRole('button',{name:'앱 설정'}))
 await userEvent.click(screen.getByRole('button',{name:'카테고리 관리'}))
 await userEvent.click(screen.getByRole('button',{name:/고정비 카테고리/}))
 await screen.findByText('등록한 카테고리가 없습니다.')
 expect(screen.queryByRole('tab')).not.toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:'뒤로가기'}))
 await userEvent.click(screen.getByRole('button',{name:/내역 카테고리/}))
 expect(await screen.findByRole('tab',{name:'지출'})).toHaveAttribute('aria-selected','true')
 await userEvent.click(screen.getByRole('tab',{name:'입금'}))
 expect(screen.getByRole('tab',{name:'입금'})).toHaveAttribute('aria-selected','true')
})

it('keeps app settings accessible before the first budget is configured', async () => {
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
 render(<App authApi={api()} />)
 await enterSetup()
 expect(screen.queryByRole('navigation',{name:'업무 메뉴'})).not.toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:'앱 설정'}))
 await userEvent.click(screen.getByRole('button',{name:'사용 가이드'}))
 expect(await screen.findByRole('dialog',{name:'머니시트 100% 활용 가이드!'})).toBeVisible()
 await userEvent.click(screen.getByRole('button',{name:'건너뛰기'}))
 expect(screen.getByRole('button',{name:'다음: 식비 설정'})).toBeInTheDocument()
})
it('resets navigation and date state on user changes, without showing a demo profile', async () => {
  vi.stubEnv('DEV', true)
  const auth = api(); vi.mocked(auth.me).mockResolvedValueOnce(first).mockResolvedValueOnce(second)
  render(<App authApi={auth} />)
  await enterSetup()
  await screen.findByRole('button', { name: 'MY' })
  await userEvent.click(screen.getByRole('button', { name: 'MY' }))
  expect(await screen.findByText(first.email)).toBeInTheDocument()
  fireEvent(window, new Event('focus'))
  await waitFor(() => expect(auth.me).toHaveBeenCalledTimes(2))
  await enterSetup()
  await userEvent.click(screen.getByRole('button', { name: 'MY' }))
  expect(await screen.findByText(second.email)).toBeInTheDocument()
  expect(screen.queryByText(first.email)).not.toBeInTheDocument()
})
it('does not render business mock screens in a production build', async () => {
  vi.stubEnv('DEV', false)
  render(<App authApi={api()} />)
  expect(await enterSetup()).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'MY' }))
  expect(await screen.findByText(first.email)).toBeInTheDocument()
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
  render(<App authApi={auth} />); await enterSetup(); await userEvent.click(await screen.findByRole('button', { name: 'MY' }))
  await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('다시 눌러')
  expect(screen.getByText(first.email)).toBeInTheDocument()
  expect(auth.logout).toHaveBeenCalledTimes(1)
  await userEvent.click(screen.getByRole('button', { name: '로그아웃' }))
  expect(await screen.findByRole('button', { name: '로그인' })).toBeInTheDocument()
})

it('revalidates budgets after successful same-user focus and online checks', async () => {
  const auth = api()
  render(<App authApi={auth} />)
  await enterSetup()
  const requests = () => vi.mocked(fetch).mock.calls.filter(([path]) => String(path).endsWith('/budget')).length
  const initial = requests()
  fireEvent(window, new Event('focus'))
  await waitFor(() => expect(requests()).toBeGreaterThan(initial))
  const afterFocus = requests()
  fireEvent(window, new Event('online'))
  await waitFor(() => expect(requests()).toBeGreaterThan(afterFocus))
})

async function enterSetup(){
 const button=await screen.findByRole('button',{name:/^(시작하기|다음: 식비 설정)$/})
 if(button.textContent==='시작하기')fireEvent.click(button)
 return screen.findByRole('button',{name:'다음: 식비 설정'})
}
