import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthProvider'
import { createAuthApi } from './authApi'
import { createHttpClient } from '../../api/httpClient'

const profile = { id: '1', email: 'same@example.com', nickname: 'Same user' }
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { 'Content-Type': 'application/json' },
})
const expired = () => json({ code: 'UNAUTHENTICATED', message: 'expired', fieldErrors: [], traceId: 'old' }, 401)
function deferred() {
  let resolve!: (response: Response) => void
  const promise = new Promise<Response>(done => { resolve = done })
  return { promise, resolve }
}
function Workspace() {
  return <input aria-label="작업 메모" defaultValue="" />
}
function Probe() {
  const auth = useAuth()
  if (auth.initializing) return <p>확인 중</p>
  if (!auth.profile) return <p>로그아웃 상태</p>
  return <><p>{auth.profile.email}</p><Workspace key={auth.sessionKey} /></>
}

it.each(['before', 'after'])('preserves same-user profile and unsaved workspace when old 401 arrives %s latest success', async order => {
  const old = deferred(), latest = deferred()
  const fetcher = vi.fn().mockResolvedValueOnce(json(profile))
    .mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
  const client = createHttpClient({ fetcher })
  const globalExpired = vi.fn(); client.onUnauthorized(globalExpired)
  render(<AuthProvider api={createAuthApi(client)}><Probe /></AuthProvider>)
  await screen.findByText(profile.email)
  await userEvent.type(screen.getByLabelText('작업 메모'), '보존할 입력')
  fireEvent(window, new Event('focus')); fireEvent(window, new Event('focus'))
  if (order === 'before') {
    await act(async () => old.resolve(expired()))
    expect(screen.getByLabelText('작업 메모')).toHaveValue('보존할 입력')
    await act(async () => latest.resolve(json(profile)))
  } else {
    await act(async () => latest.resolve(json(profile)))
    await act(async () => old.resolve(expired()))
  }
  expect(screen.getByText(profile.email)).toBeInTheDocument()
  expect(screen.getByLabelText('작업 메모')).toHaveValue('보존할 입력')
  expect(screen.queryByText('로그아웃 상태')).not.toBeInTheDocument()
  expect(globalExpired).not.toHaveBeenCalled()
})

it('still clears the profile and CSRF cache when the latest session check returns 401', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(json(profile)).mockResolvedValueOnce(expired())
  const api = createAuthApi(createHttpClient({ fetcher }))
  const reset = vi.spyOn(api, 'resetCsrf')
  render(<AuthProvider api={api}><Probe /></AuthProvider>)
  await screen.findByText(profile.email); reset.mockClear()
  fireEvent(window, new Event('focus'))
  expect(await screen.findByText('로그아웃 상태')).toBeInTheDocument()
  expect(screen.queryByLabelText('작업 메모')).not.toBeInTheDocument()
  expect(reset).toHaveBeenCalledTimes(1)
})
