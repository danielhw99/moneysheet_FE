import { ApiError, httpClient, type HttpClient } from '../../api/httpClient'
import type { UserProfile } from '../../data/models'
export type LoginInput = { email: string; password: string; rememberMe?: boolean }
export type SignupInput = Omit<LoginInput, 'rememberMe'> & { nickname: string; privacyPolicyVersion: string; privacyAgreed: boolean; verificationToken: string }
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
  if (data.avatarUrl !== undefined && data.avatarUrl !== null && (typeof data.avatarUrl !== 'string' || !/^\/api\/v1\/me\/avatar\?v=[a-f0-9]{32}$/.test(data.avatarUrl))) {
    throw new ApiError(0, 'PROTOCOL', '프로필 사진 주소를 확인하지 못했어요.')
  }
  return { id: data.id, email: data.email, nickname: data.nickname, ...(data.avatarUrl === undefined ? {} : {avatarUrl:data.avatarUrl}) }
}
export function createAuthApi(client: HttpClient = httpClient) {
  let restoring: Promise<UserProfile> | undefined
  let revision = 0
  const resetCsrf = () => { revision++; client.invalidateCsrf() }
  const settleRestore = async () => {
    // Complete the old cookie response before a newer login/logout changes authentication.
    if (restoring) await restoring.catch(() => {})
    resetCsrf()
  }
  function restoreSession(): Promise<UserProfile> {
    if (restoring) return restoring
    const ticket = revision
    const ensureCurrent = () => { if (ticket !== revision) throw new ApiError(0, 'SESSION_CHANGED', '인증 상태가 변경됐어요. 다시 시도해 주세요.') }
    const work = (async () => {
      client.invalidateCsrf()
      await client.csrf(); ensureCurrent()
      const value = profile(await client.post('/auth/session', undefined, { notifyUnauthorized: false }))
      ensureCurrent(); client.invalidateCsrf()
      await client.csrf(); ensureCurrent()
      return value
    })().catch(error => {
      // A parallel tab may have replaced the session cookie; its CSRF token is different.
      if (ticket === revision && error instanceof ApiError && error.status === 409) client.invalidateCsrf()
      throw error
    }).finally(() => { if (restoring === work) restoring = undefined })
    restoring = work
    return work
  }
  return {
    restoreSession,
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
      await settleRestore()
      const result = profile(await client.post('/auth/login', { ...input, rememberMe: input.rememberMe ?? false }))
      client.invalidateCsrf()
      return result
    },
    async updateProfile(input: { nickname: string }) { return profile(await client.patch('/me', input)) },
    async uploadAvatar(file: File) { const body = new FormData(); body.append('file',file); return profile(await client.put('/me/avatar',body)) },
    async deleteAvatar() { return profile(await client.delete('/me/avatar')) },
    async changePassword(input: { currentPassword: string; newPassword: string }) { await settleRestore(); await client.put<void>('/me/password', input); client.invalidateCsrf() },
    async deleteAccount(input: { currentPassword: string }) { await settleRestore(); await client.post<void>('/me/deletion', input); client.invalidateCsrf() },
    async logout() { await settleRestore(); await client.post<void>('/auth/logout', undefined, { notifyUnauthorized: false }); client.invalidateCsrf() },
    onUnauthorized: client.onUnauthorized,
    resetCsrf,
  }
}
