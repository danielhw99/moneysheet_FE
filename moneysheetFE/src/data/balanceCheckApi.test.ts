import { describe, it, expect, vi } from 'vitest'
import { createBalanceCheckApi } from './balanceCheckApi'
import type { HttpClient } from '../api/httpClient'
describe('balance check API', () => {
 it('preserves zero and null and checks response date', async () => {
  const get = vi.fn().mockResolvedValue({date:'2026-11-17',actualBalance:0,locked:true})
  const put = vi.fn().mockResolvedValue({date:'2026-11-17',actualBalance:null,locked:false})
  const api = createBalanceCheckApi({get,put} as unknown as HttpClient)
  expect((await api.getBalanceCheck('2026-11-17')).actualBalance).toBe(0)
  expect((await api.saveBalanceCheck('2026-11-17',{actualBalance:null,locked:false})).actualBalance).toBeNull()
  get.mockResolvedValue({date:'2026-11-16',actualBalance:0,locked:true})
  await expect(api.getBalanceCheck('2026-11-17')).rejects.toThrow()
 })
 it('rejects invalid amounts before a write', async () => {
  const put = vi.fn(), api = createBalanceCheckApi({put} as unknown as HttpClient)
  for (const actualBalance of [-1,0.5,10000000000]) await expect(api.saveBalanceCheck('2026-11-17',{actualBalance,locked:true})).rejects.toThrow()
  expect(put).not.toHaveBeenCalled()
 })
})
