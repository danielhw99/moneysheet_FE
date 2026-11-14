import { describe, it, expect, vi } from 'vitest'
import { createHttpClient } from '../api/httpClient'
import { createBudgetApi } from './budgetApi'
function setup(response: unknown) {
  const fetcher = vi.fn(async (url: RequestInfo | URL, _options?: RequestInit) => new Response(JSON.stringify(String(url).endsWith('/auth/csrf') ? { token: 'csrf', headerName: 'X-CSRF-TOKEN' } : response)))
  return { api: createBudgetApi(createHttpClient({ fetcher })), fetcher }
}
describe('budget HTTP boundary', () => {
  it('sends fixed category direction as explicit null and reuses server ID', async () => {
    const { api, fetcher } = setup({ id: '8', name: 'Rent', scope: 'fixedBudget', direction: null })
    expect((await api.createCategory({ name: 'Rent', scope: 'fixedBudget' })).id).toBe('8')
    expect(JSON.parse(String(fetcher.mock.calls.at(-1)?.[1]?.body))).toEqual({ name: 'Rent', scope: 'fixedBudget', direction: null })
  })
  it('rejects malformed server data rather than showing zero budgets', async () => {
    const { api } = setup({ month: '2026-11', status: 'ready', items: [], food: {}, fixedTotal: 0, foodSummary: { total: 0, installments: [] } })
    await expect(api.getBudget('2026-11')).rejects.toMatchObject({ code: 'PROTOCOL' })
  })
  it('preserves missing first-month allowance values and never auto-finalizes', async () => {
    const { api, fetcher } = setup({ month: '2026-11', status: 'draft', copiedFromMonth: null, items: [{ id: null, kind: 'freeAllowance', name: '고정여유비', categoryId: null, amount: null }], food: { weekday: null, saturday: null, sunday: null } })
    expect((await api.prepareBudget('2026-11')).items[0].amount).toBeNull()
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
  it('PUT and DELETE include CSRF and DELETE accepts an empty 204', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL, options?: RequestInit) => String(url).endsWith('/auth/csrf')
      ? new Response(JSON.stringify({ token: 'csrf', headerName: 'X-CSRF-TOKEN' }))
      : options?.method === 'DELETE' ? new Response(null, { status: 204 }) : new Response('{}'))
    const client = createHttpClient({ fetcher })
    await client.put('/example', { amount: 1 }); await client.delete('/example')
    for (const [, options] of fetcher.mock.calls.slice(1)) expect(new Headers(options?.headers).get('X-CSRF-TOKEN')).toBe('csrf')
    expect(fetcher.mock.calls.map(([, o]) => o?.method)).toEqual(['GET', 'PUT', 'DELETE'])
  })
  it('preserves IDs and explicit nulls in setup, uses PUT for edits, and never retries a failed write', async () => {
    const requests: { path: string; method: string; body: unknown }[] = []
    const fetcher = vi.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
      if (String(url).endsWith('/auth/csrf')) return new Response(JSON.stringify({ token: 'csrf', headerName: 'X-CSRF-TOKEN' }))
      requests.push({ path: String(url), method: options?.method ?? '', body: options?.body ? JSON.parse(String(options.body)) : null })
      return new Response(JSON.stringify({ code: 'BUDGET_BELOW_PAID', message: '지급액보다 작습니다.' }), { status: 409 })
    })
    const api = createBudgetApi(createHttpClient({ fetcher }))
    const items = [{ id: '51', kind: 'fixedExpense' as const, name: 'Rent', categoryId: '9', amount: 50 }, { id: null, kind: 'freeAllowance' as const, name: 'Pocket', categoryId: '9', amount: 10 }]
    await expect(api.setupBudget('2026-11', { items, food: { weekday: 1, saturday: 1, sunday: 1 } })).rejects.toMatchObject({ code: 'BUDGET_BELOW_PAID' })
    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({ path: '/api/v1/months/2026-11/budget-setup', method: 'PUT', body: { items } })
    await expect(api.updateBudgetItem('2026-11', '51', { kind: 'fixedExpense', name: 'Rent', categoryId: '9', amount: 1 })).rejects.toMatchObject({ code: 'BUDGET_BELOW_PAID' })
    expect(requests[1].method).toBe('PUT')
    expect(requests).toHaveLength(2)
  })

})
