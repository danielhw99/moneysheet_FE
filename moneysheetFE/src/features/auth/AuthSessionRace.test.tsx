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

it.each(['focus', 'online'])('shares an in-flight check on %s and preserves same-user workspace', async event => {
  const pending = deferred()
  const fetcher = vi.fn().mockResolvedValueOnce(json(profile)).mockReturnValueOnce(pending.promise)
  const client = createHttpClient({ fetcher })
  render(<AuthProvider api={createAuthApi(client)}><Probe /></AuthProvider>)
  await screen.findByText(profile.email)
  await userEvent.type(screen.getByLabelText('작업 메모'), '보존할 입력')
  fireEvent(window, new Event('focus')); fireEvent(window, new Event(event))
  expect(fetcher).toHaveBeenCalledTimes(2)
  await act(async () => pending.resolve(json(profile)))
  expect(screen.getByText(profile.email)).toBeInTheDocument()
  expect(screen.getByLabelText('작업 메모')).toHaveValue('보존할 입력')
})

it('still clears the profile and CSRF cache when the latest session check returns 401', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(json(profile)).mockResolvedValueOnce(expired())
    .mockResolvedValueOnce(json({token:'csrf',headerName:'X-CSRF-TOKEN'})).mockResolvedValueOnce(expired())
  const api = createAuthApi(createHttpClient({ fetcher }))
  const reset = vi.spyOn(api, 'resetCsrf')
  render(<AuthProvider api={api}><Probe /></AuthProvider>)
  await screen.findByText(profile.email); reset.mockClear()
  fireEvent(window, new Event('focus'))
  expect(await screen.findByText('로그아웃 상태')).toBeInTheDocument()
  expect(screen.queryByLabelText('작업 메모')).not.toBeInTheDocument()
  expect(reset).toHaveBeenCalledTimes(1)
})

it('preserves same-user draft after actual cookie restoration and never replays a write', async()=>{
 const fetcher=vi.fn().mockResolvedValueOnce(json(profile)).mockResolvedValueOnce(expired())
  .mockResolvedValueOnce(json({token:'before',headerName:'X-CSRF-TOKEN'})).mockResolvedValueOnce(json(profile))
  .mockResolvedValueOnce(json({token:'after',headerName:'X-CSRF-TOKEN'}));
 render(<AuthProvider api={createAuthApi(createHttpClient({fetcher}))}><Probe /></AuthProvider>);
 await screen.findByText(profile.email);const input=screen.getByLabelText('작업 메모');await userEvent.type(input,'복원 후에도 유지');
 fireEvent(window,new Event('focus'));await vi.waitFor(()=>expect(fetcher).toHaveBeenCalledTimes(5));
 expect(screen.getByLabelText('작업 메모')).toBe(input);expect(input).toHaveValue('복원 후에도 유지');
 expect(fetcher.mock.calls.filter(([,options])=>options.method==='POST').map(([url])=>url)).toEqual(['/api/v1/auth/session']);
});
