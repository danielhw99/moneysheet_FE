import { ApiError, httpClient, type HttpClient } from '../../api/httpClient'
import type { UserProfile } from '../../data/models'
export type LoginInput = { email: string; password: string }
export type SignupInput = LoginInput & { nickname: string; privacyPolicyVersion: string; privacyAgreed: boolean; verificationToken: string }
export type VerificationSent = { challengeId: string; expiresAt: string; resendAfterSeconds: number }
export type VerificationConfirmed = { verificationToken: string; expiresAt: string }
export type VerificationConfirmation = { email: string; challengeId: string; code: string }
function expiration(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
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
    async requestEmailVerification(email: string): Promise<VerificationSent> {
      const data = await client.post<Partial<VerificationSent>>('/auth/email-verifications', { email })
      if (!data || typeof data.challengeId !== 'string' || !/^[0-9a-f-]{36}$/.test(data.challengeId)
        || !expiration(data.expiresAt) || !Number.isSafeInteger(data.resendAfterSeconds) || data.resendAfterSeconds! < 1 || data.resendAfterSeconds! > 3600) {
        throw new ApiError(0, 'PROTOCOL', '인증번호 발송 응답을 확인하지 못했어요.')
      }
      return data as VerificationSent
    },
    async confirmEmailVerification(input: VerificationConfirmation): Promise<VerificationConfirmed> {
      const data = await client.post<Partial<VerificationConfirmed>>('/auth/email-verifications/confirmation', input)
      if (!data || typeof data.verificationToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(data.verificationToken) || !expiration(data.expiresAt)) {
        throw new ApiError(0, 'PROTOCOL', '이메일 인증 응답을 확인하지 못했어요.')
      }
      return data as VerificationConfirmed
    },
    async login(input: LoginInput) {
      const result = profile(await client.post('/auth/login', input))
      client.invalidateCsrf()
      return result
    },
    async updateProfile(input: { nickname: string }) { return profile(await client.patch('/me', input)) },
    async changePassword(input: { currentPassword: string; newPassword: string }) { await client.put<void>('/me/password', input); client.invalidateCsrf() },
    async deleteAccount(input: { currentPassword: string }) { await client.post<void>('/me/deletion', input); client.invalidateCsrf() },
    async logout() { await client.post<void>('/auth/logout'); client.invalidateCsrf() },
    onUnauthorized: client.onUnauthorized,
    resetCsrf: client.invalidateCsrf,
  }
}
