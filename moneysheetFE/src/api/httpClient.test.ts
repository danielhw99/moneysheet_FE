import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHttpClient, ApiError } from './httpClient'
const json = (body: unknown, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })
afterEach(() => vi.useRealTimers())
describe('HTTP/CSRF contract', () => {
  it('sends same-origin cookies and coalesces concurrent CSRF reads', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json({ token: 'csrf-one', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(json({ ok: true })).mockResolvedValueOnce(json({ ok: true }))
    const api = createHttpClient({ fetcher })
    await Promise.all([api.post('/auth/signup', { password: ' untrimmed password ' }), api.post('/auth/login', {})])
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(fetcher.mock.calls[0][0]).toBe('/api/v1/auth/csrf')
    for (const [, init] of fetcher.mock.calls.slice(1)) {
      expect(init.credentials).toBe('same-origin')
      expect(new Headers(init.headers).get('X-CSRF-TOKEN')).toBe('csrf-one')
    }
    expect(fetcher.mock.calls[1][1].body).toContain(' untrimmed password ')
  })
  it('refreshes rejected CSRF but never automatically repeats a write', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json({ token: 'old', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(json({ code: 'CSRF_INVALID', message: 'invalid', fieldErrors: [], traceId: 'trace' }, 403))
      .mockResolvedValueOnce(json({ token: 'fresh', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    const api = createHttpClient({ fetcher })
    await expect(api.post('/auth/logout')).rejects.toMatchObject({ status: 403, code: 'CSRF_INVALID' })
    expect(fetcher.mock.calls.filter(([, init]) => init.method === 'POST')).toHaveLength(1)
    await api.post('/auth/logout')
    expect(new Headers(fetcher.mock.calls.at(-1)![1].headers).get('X-CSRF-TOKEN')).toBe('fresh')
  })
  it('keeps structured errors and Retry-After while excluding credentials failures from expiry events', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json({ code: 'RATE_LIMITED', message: 'limited', fieldErrors: [], traceId: 't' }, 429, { 'Retry-After': '60' }))
      .mockResolvedValueOnce(json({ code: 'UNAUTHENTICATED', message: 'expired' }, 401))
      .mockResolvedValueOnce(json({ code: 'INVALID_CREDENTIALS', message: 'bad' }, 401))
    const api = createHttpClient({ fetcher }); const expired = vi.fn(); api.onUnauthorized(expired)
    await expect(api.get('/me')).rejects.toMatchObject({ retryAfterSeconds: 60, traceId: 't' })
    await expect(api.get('/me')).rejects.toBeInstanceOf(ApiError)
    await expect(api.get('/me')).rejects.toBeInstanceOf(ApiError)
    expect(expired).toHaveBeenCalledTimes(1)
  })
  it('does not use a stale CSRF response after invalidation', async () => {
    let resolve!: (response: Response) => void
    const fetcher = vi.fn().mockImplementationOnce(() => new Promise<Response>(done => { resolve = done }))
    const api = createHttpClient({ fetcher }); const pending = api.post('/auth/signup', {})
    api.invalidateCsrf(); resolve(json({ token: 'stale', headerName: 'X-CSRF-TOKEN' }))
    await expect(pending).rejects.toMatchObject({ code: 'SESSION_CHANGED' })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it('aborts timed out requests and reports a safe network error', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn((_url, init) => new Promise<Response>((_resolve, reject) => {
      init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    const api = createHttpClient({ fetcher, timeoutMs: 10 })
    const pending = expect(api.get('/me')).rejects.toMatchObject({ code: 'NETWORK' })
    await vi.advanceTimersByTimeAsync(11); await pending
  })

  it('does not expire a new session when an older request returns 401', async () => {
    let done!: (response: Response) => void
    const fetcher = vi.fn().mockImplementationOnce(() => new Promise<Response>(resolve => { done = resolve }))
    const api = createHttpClient({ fetcher }); const expired = vi.fn(); api.onUnauthorized(expired)
    const old = api.get('/me'); api.invalidateCsrf()
    done(json({ code: 'UNAUTHENTICATED', message: 'old session' }, 401))
    await expect(old).rejects.toMatchObject({ status: 401 })
    expect(expired).not.toHaveBeenCalled()
  })

  it('leaves writes unrepeated even when CSRF refresh fails, then fetches a new token on explicit retry', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json({ token: 'old', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(json({ code: 'CSRF_INVALID', message: 'invalid' }, 403))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(json({ token: 'recovered', headerName: 'X-CSRF-TOKEN' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
    const api = createHttpClient({ fetcher })
    await expect(api.post('/auth/logout')).rejects.toMatchObject({ code: 'CSRF_INVALID' })
    expect(fetcher.mock.calls.filter(([, init]) => init.method === 'POST')).toHaveLength(1)
    await api.post('/auth/logout')
    expect(new Headers(fetcher.mock.calls.at(-1)![1].headers).get('X-CSRF-TOKEN')).toBe('recovered')
  })
})
