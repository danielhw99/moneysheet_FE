import { describe, it, expect, vi } from 'vitest'
import { createHttpClient } from '../api/httpClient'
import { createBudgetApi } from './budgetApi'
function setup(response: unknown) {
  const fetcher = vi.fn(async (url: RequestInfo | URL, _options?: RequestInit) => new Response(JSON.stringify(String(url).endsWith('/auth/csrf') ? { token: 'csrf', headerName: 'X-CSRF-TOKEN' } : response)))
  return { api: createBudgetApi(createHttpClient({ fetcher })), fetcher }
}
describe('UR07 category HTTP boundary', () => {
  it('accepts an uncategorized fixed item without losing the null', async () => {
    const { api } = setup({ month: '2026-11', status: 'ready', items: [{ id: '51', name: 'Rent', categoryId: null, amount: 100, paid: 0, remaining: 100, complete: false }], food: { enabled: true, paymentMode: 'threeInstallments', weekday: 1, saturday: 1, sunday: 1 }, fixedTotal: 100, foodSummary: { total: 30, installments: [11, 10, 9] } })
    expect((await api.getBudget('2026-11')).items[0].categoryId).toBeNull()
  })
  it('PATCH sends only a name and preserves server category identity', async () => {
    const { api, fetcher } = setup({ id: '8', name: 'New', scope: 'fixedBudget', direction: null })
    expect((await api.updateCategory('8', { name: 'New' })).id).toBe('8')
    const [url, options] = fetcher.mock.calls.at(-1)!
    expect(String(url)).toBe('/api/v1/categories/8')
    expect(options?.method).toBe('PATCH')
    expect(JSON.parse(String(options?.body))).toEqual({ name: 'New' })
    expect(new Headers(options?.headers).get('X-CSRF-TOKEN')).toBe('csrf')
  })
  it('DELETE accepts 204 without parsing a JSON body', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => String(url).endsWith('/auth/csrf')
      ? new Response(JSON.stringify({ token: 'csrf', headerName: 'X-CSRF-TOKEN' }))
      : new Response(null, { status: 204 }))
    await expect(createBudgetApi(createHttpClient({ fetcher })).deleteCategory('8')).resolves.toBeUndefined()
  })
})

describe('budget HTTP boundary', () => {
  it('forwards an item creation key as a header while keeping the original DTO', async () => {
    const {api,fetcher}=setup({id:'51',name:'Rent',categoryId:null,amount:100})
    await api.createBudgetItem('2026-11',{name:'Rent',categoryId:null,amount:100},{idempotencyKey:'a0f71aa0-8f45-4972-a31f-9629c557e353'})
    const [,init]=fetcher.mock.calls.at(-1)!
    expect(new Headers(init?.headers).get('Idempotency-Key')).toBe('a0f71aa0-8f45-4972-a31f-9629c557e353')
    expect(JSON.parse(String(init?.body))).toEqual({name:'Rent',categoryId:null,amount:100})
  })
  it('sends fixed category direction as explicit null and reuses server ID', async () => {
    const { api, fetcher } = setup({ id: '8', name: 'Rent', scope: 'fixedBudget', direction: null })
    expect((await api.createCategory({ name: 'Rent', scope: 'fixedBudget' })).id).toBe('8')
    expect(JSON.parse(String(fetcher.mock.calls.at(-1)?.[1]?.body))).toEqual({ name: 'Rent', scope: 'fixedBudget', direction: null })
  })
  it('rejects malformed server data rather than showing zero budgets', async () => {
    const { api } = setup({ month: '2026-11', status: 'ready', items: [], food: {}, fixedTotal: 0, foodSummary: { total: 0, installments: [] } })
    await expect(api.getBudget('2026-11')).rejects.toMatchObject({ code: 'PROTOCOL' })
  })
  it('preserves draft values and never auto-finalizes', async () => {
    const { api, fetcher } = setup({ month: '2026-11', status: 'draft', copiedFromMonth: null, items: [{ id: null, name: '고정여유비', categoryId: null, amount: null }], food: { enabled: null, paymentMode: 'threeInstallments', weekday:null, saturday: null, sunday: null } })
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
    const items = [{ id: '51', name: 'Rent', categoryId: '9', amount: 50 }, { id: null, name: 'Pocket', categoryId: '9', amount: 10 }]
    await expect(api.setupBudget('2026-11', { items, food: { enabled: true, paymentMode: 'threeInstallments', weekday: 1, saturday: 1, sunday: 1 } })).rejects.toMatchObject({ code: 'BUDGET_BELOW_PAID' })
    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({ path: '/api/v1/months/2026-11/budget-setup', method: 'PUT', body: { items } })
    await expect(api.updateBudgetItem('2026-11', '51', { name: 'Rent', categoryId: '9', amount: 1 })).rejects.toMatchObject({ code: 'BUDGET_BELOW_PAID' })
    expect(requests[1].method).toBe('PUT')
    expect(requests).toHaveLength(2)
  })

})
