import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthProvider'
import AuthScreen from './AuthScreen'
import { ApiError } from '../../api/httpClient'
import type { AuthApi } from './authApi'
const profile = { id: '1', email: 'user@example.com', nickname: 'User' }
function fakeApi(): AuthApi {
  return { me: vi.fn().mockRejectedValue(new ApiError(401, 'UNAUTHENTICATED', 'login')),
    signup: vi.fn().mockResolvedValue(profile), login: vi.fn().mockResolvedValue(profile),
    logout: vi.fn().mockResolvedValue(undefined), resetCsrf: vi.fn(), onUnauthorized: vi.fn(() => () => {}) }
}
function Probe({ signup = false }: { signup?: boolean }) {
  const auth = useAuth()
  if (auth.initializing) return <p>확인 중</p>
  if (auth.bootstrapError) return <button onClick={auth.retry}>다시 확인</button>
  if (auth.profile) return <><p>{auth.profile.email}</p><button onClick={() => { void auth.logout().catch(() => {}) }}>종료</button></>
  return <AuthScreen signup={signup} go={() => {}} />
}
const start = (api: AuthApi, signup = false) => render(<AuthProvider api={api}><Probe signup={signup} /></AuthProvider>)
describe('real authentication UI', () => {
  it('keeps invalid credential inputs and never navigates to authenticated content', async () => {
    const api = fakeApi(); vi.mocked(api.login).mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'bad'))
    start(api); const user = userEvent.setup()
    await user.type(await screen.findByLabelText('이메일'), profile.email)
    await user.type(screen.getByLabelText('비밀번호'), ' wrong password ')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('이메일 또는 비밀번호')
    expect(screen.getByLabelText('비밀번호')).toHaveValue(' wrong password ')
    expect(api.login).toHaveBeenCalledWith({ email: profile.email, password: ' wrong password ' })
    expect(screen.queryByText(profile.email)).not.toBeInTheDocument()
  })
  it('requires signup policy and Unicode length, then does not automatically log in', async () => {
    const api = fakeApi(); start(api, true); const user = userEvent.setup()
    await user.type(await screen.findByLabelText('이메일'), profile.email)
    await user.type(screen.getByLabelText('닉네임'), ' Nick ')
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '😀'.repeat(14) } })
    await user.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('button', { name: '가입하기' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '😀'.repeat(15) } })
    await user.click(screen.getByRole('button', { name: '가입하기' }))
    await waitFor(() => expect(api.signup).toHaveBeenCalledWith({ email: profile.email, nickname: 'Nick', password: '😀'.repeat(15), privacyPolicyVersion: 'v1', privacyAgreed: true }))
    expect(api.login).not.toHaveBeenCalled()
    expect(screen.queryByText(profile.email)).not.toBeInTheDocument()
  })
  it('blocks duplicate submits while login is pending', async () => {
    const api = fakeApi(); let done!: (value: typeof profile) => void
    vi.mocked(api.login).mockImplementation(() => new Promise(resolve => { done = resolve }))
    start(api); const user = userEvent.setup()
    await user.type(await screen.findByLabelText('이메일'), profile.email)
    await user.type(screen.getByLabelText('비밀번호'), 'valid password')
    const form = screen.getByRole('button', { name: '로그인' }).closest('form')!
    fireEvent.submit(form); fireEvent.submit(form)
    expect(api.login).toHaveBeenCalledTimes(1)
    await act(async () => done(profile))
    expect(await screen.findByText(profile.email)).toBeInTheDocument()
  })
  it('restores a session and clears it on unauthorized events', async () => {
    const api = fakeApi(); vi.mocked(api.me).mockResolvedValue(profile)
    let expired!: () => void; vi.mocked(api.onUnauthorized).mockImplementation(listener => { expired = listener; return () => {} })
    start(api); expect(await screen.findByText(profile.email)).toBeInTheDocument()
    act(() => expired())
    expect(await screen.findByLabelText('이메일')).toBeInTheDocument()
    expect(screen.getByText(/로그인이 만료/)).toBeInTheDocument()
  })
  it('ignores a delayed focus response after logout', async () => {
    const api = fakeApi(); let done!: (value: typeof profile) => void
    vi.mocked(api.me).mockResolvedValueOnce(profile).mockImplementationOnce(() => new Promise(resolve => { done = resolve }))
    start(api); await screen.findByText(profile.email)
    fireEvent(window, new Event('focus'))
    await userEvent.click(screen.getByRole('button', { name: '종료' }))
    await screen.findByLabelText('이메일')
    await act(async () => done(profile))
    expect(screen.queryByText(profile.email)).not.toBeInTheDocument()
  })
  it('shows retry after startup network failure instead of a fake session', async () => {
    const api = fakeApi(); vi.mocked(api.me).mockRejectedValueOnce(new ApiError(0, 'NETWORK', 'offline')).mockResolvedValue(profile)
    start(api); await userEvent.click(await screen.findByRole('button', { name: '다시 확인' }))
    expect(await screen.findByText(profile.email)).toBeInTheDocument()
  })

  it('keeps the latest session check when focus requests finish out of order', async () => {
    const api = fakeApi(); let old!: (value: typeof profile) => void
    const other = { ...profile, id: '2', email: 'other@example.com' }
    vi.mocked(api.me).mockResolvedValueOnce(profile)
      .mockImplementationOnce(() => new Promise(resolve => { old = resolve }))
      .mockResolvedValueOnce(other)
    start(api); await screen.findByText(profile.email)
    fireEvent(window, new Event('focus')); fireEvent(window, new Event('focus'))
    await screen.findByText(other.email)
    await act(async () => old(profile))
    expect(screen.queryByText(profile.email)).not.toBeInTheDocument()
    expect(screen.getByText(other.email)).toBeInTheDocument()
  })

  it('shows server field errors without losing accessible field names or values', async () => {
    const api = fakeApi()
    vi.mocked(api.login).mockRejectedValue(new ApiError(400, 'VALIDATION', 'invalid', [{ field: 'email', message: '이메일을 다시 확인해 주세요.' }]))
    start(api); const user = userEvent.setup()
    await user.type(await screen.findByLabelText('이메일', { exact: true }), profile.email)
    await user.type(screen.getByLabelText('비밀번호'), 'preserved password')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    await screen.findByText('이메일을 다시 확인해 주세요.')
    expect(screen.getByLabelText('이메일', { exact: true })).toHaveValue(profile.email)
  })
  it('shows Retry-After and retains login input without automatically resubmitting', async () => {
    const api = fakeApi(); vi.mocked(api.login).mockRejectedValue(new ApiError(429, 'RATE_LIMITED', 'limited', [], '', 60))
    start(api); const user = userEvent.setup()
    await user.type(await screen.findByLabelText('이메일'), profile.email)
    await user.type(screen.getByLabelText('비밀번호'), 'preserved password')
    await user.click(screen.getByRole('button', { name: '로그인' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('60초')
    expect(api.login).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText('비밀번호')).toHaveValue('preserved password')
  })
  it('restores sessions under React StrictMode without a stuck loading screen', async () => {
    const api = fakeApi(); vi.mocked(api.me).mockResolvedValue(profile)
    render(<StrictMode><AuthProvider api={api}><Probe /></AuthProvider></StrictMode>)
    expect(await screen.findByText(profile.email)).toBeInTheDocument()
  })
})
