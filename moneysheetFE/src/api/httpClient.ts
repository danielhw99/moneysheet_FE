export type FieldError = { field: string; message: string }
export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string,
    public readonly fieldErrors: readonly FieldError[] = [], public readonly traceId = '',
    public readonly retryAfterSeconds?: number) { super(message); this.name = 'ApiError' }
}
type Csrf = { token: string; headerName: 'X-CSRF-TOKEN' }
type Options = { fetcher?: typeof fetch; timeoutMs?: number }
export type HttpClient = ReturnType<typeof createHttpClient>

export function createHttpClient({ fetcher = (...args) => fetch(...args), timeoutMs = 15000 }: Options = {}) {
  let token: Csrf | undefined
  let pendingCsrf: Promise<Csrf> | undefined
  let generation = 0
  const listeners = new Set<() => void>()
  const invalidateCsrf = () => { token = undefined; pendingCsrf = undefined; generation++ }

  async function send<T>(path: string, method: string, body?: unknown, csrf?: Csrf, notifyUnauthorized = true): Promise<T> {
    const requestGeneration = generation
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const headers = new Headers({ Accept: 'application/json' })
      if (body !== undefined) headers.set('Content-Type', 'application/json')
      if (csrf) headers.set(csrf.headerName, csrf.token)
      const response = await fetcher('/api/v1' + path, {
        method, headers, credentials: 'same-origin', signal: controller.signal,
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      if (response.status === 204) return undefined as T
      let data: Record<string, unknown>
      try { data = await response.json() } catch {
        throw new ApiError(response.status, 'PROTOCOL', '서버 응답을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.')
      }
      if (!response.ok) {
        const fields = Array.isArray(data?.fieldErrors) ? data.fieldErrors.filter((item): item is FieldError =>
          !!item && typeof item.field === 'string' && typeof item.message === 'string') : []
        const retry = response.headers.get('Retry-After')
        const retryAfter = retry && /^\d+$/.test(retry) && Number.isSafeInteger(Number(retry)) ? Math.min(Number(retry), 86400) : undefined
        const code = typeof data?.code === 'string' ? data.code : 'HTTP_ERROR'
        if (notifyUnauthorized && response.status === 401 && code !== 'INVALID_CREDENTIALS' && requestGeneration === generation) {
          invalidateCsrf(); listeners.forEach(listener => listener())
        }
        throw new ApiError(response.status, code,
          typeof data?.message === 'string' ? data.message : '요청을 처리하지 못했어요.', fields,
          typeof data?.traceId === 'string' ? data.traceId : '', retryAfter)
      }
      return data as T
    } catch (error) {
      if (error instanceof ApiError) throw error
      throw new ApiError(0, 'NETWORK', '서버와 연결하지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.')
    } finally { clearTimeout(timeout) }
  }

  function csrf(): Promise<Csrf> {
    if (token) return Promise.resolve(token)
    if (pendingCsrf) return pendingCsrf
    const current = generation
    const work = send<Csrf>('/auth/csrf', 'GET').then(value => {
      if (current !== generation) throw new ApiError(0, 'SESSION_CHANGED', '인증 상태가 변경됐어요. 다시 시도해 주세요.')
      if (!value || typeof value.token !== 'string' || !value.token || value.token.length > 4096 || value.headerName !== 'X-CSRF-TOKEN') {
        throw new ApiError(0, 'PROTOCOL', '인증 정보를 확인하지 못했어요.')
      }
      token = value
      return value
    }).finally(() => { if (pendingCsrf === work) pendingCsrf = undefined })
    pendingCsrf = work
    return work
  }

  return {
    get: <T,>(path: string, options: { notifyUnauthorized?: boolean } = {}) =>
      send<T>(path, 'GET', undefined, undefined, options.notifyUnauthorized ?? true),
    async post<T>(path: string, body?: unknown): Promise<T> {
      const current = generation
      const value = await csrf()
      if (generation !== current) throw new ApiError(0, 'SESSION_CHANGED', '인증 상태가 변경됐어요. 다시 시도해 주세요.')
      try { return await send<T>(path, 'POST', body, value) } catch (error) {
        if (error instanceof ApiError && error.code === 'CSRF_INVALID' && current === generation) {
          invalidateCsrf()
          // Refresh the token, but never repeat a state-changing request automatically.
          try { await csrf() } catch { /* The next explicit attempt can fetch a new token. */ }
        }
        throw error
      }
    },
    invalidateCsrf,
    onUnauthorized(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } },
  }
}
