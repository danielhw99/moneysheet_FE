import { ApiError, httpClient, type HttpClient } from '../../api/httpClient'
import type { UserProfile } from '../../data/models'
export type LoginInput = { email: string; password: string }
export type SignupInput = LoginInput & { nickname: string; privacyPolicyVersion: string; privacyAgreed: boolean }
export type AuthApi = ReturnType<typeof createAuthApi>
function profile(value: unknown): UserProfile {
  const data = value as Partial<UserProfile> | null
  if (!data || typeof data.id !== 'string' || !/^[1-9][0-9]*$/.test(data.id) || typeof data.email !== 'string' || typeof data.nickname !== 'string') {
    throw new ApiError(0, 'PROTOCOL', '사용자 정보를 확인하지 못했어요.')
  }
  return { id: data.id, email: data.email, nickname: data.nickname }
}
export function createAuthApi(client: HttpClient = httpClient) {
  return {
    // AuthProvider owns /me failures so only the latest check can end a session.
    async me() { return profile(await client.get('/me', { notifyUnauthorized: false })) },
    async signup(input: SignupInput) { return profile(await client.post('/auth/signup', input)) },
    async login(input: LoginInput) {
      const result = profile(await client.post('/auth/login', input))
      client.invalidateCsrf()
      return result
    },
    async logout() { await client.post<void>('/auth/logout'); client.invalidateCsrf() },
    onUnauthorized: client.onUnauthorized,
    resetCsrf: client.invalidateCsrf,
  }
}
