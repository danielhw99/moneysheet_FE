import { expect, it, vi } from 'vitest'
import { createHttpClient } from '../../api/httpClient'
import { createAuthApi } from './authApi'
const profile = { id: '9223372036854775807', email: 'u@example.com', nickname: 'User' }
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })
it('preserves string IDs, returns only profile fields and rotates CSRF after login', async () => {
  const fetcher = vi.fn().mockResolvedValueOnce(json({ token: 'one', headerName: 'X-CSRF-TOKEN' }))
    .mockResolvedValueOnce(json({ ...profile, passwordHash: 'never expose' }))
    .mockResolvedValueOnce(json({ token: 'two', headerName: 'X-CSRF-TOKEN' }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  const auth = createAuthApi(createHttpClient({ fetcher }))
  expect(await auth.login({ email: profile.email, password: ' password with spaces ' })).toEqual(profile)
  await auth.logout()
  expect(fetcher.mock.calls.filter(([url]) => url.endsWith('/csrf'))).toHaveLength(2)
  expect(new Headers(fetcher.mock.calls.at(-1)![1].headers).get('X-CSRF-TOKEN')).toBe('two')
})
it('rejects incompatible profile responses instead of falling back to mock login', async () => {
  const auth = createAuthApi(createHttpClient({ fetcher: vi.fn().mockResolvedValue(json({ ...profile, id: 1 })) }))
  await expect(auth.me()).rejects.toMatchObject({ code: 'PROTOCOL' })
})
