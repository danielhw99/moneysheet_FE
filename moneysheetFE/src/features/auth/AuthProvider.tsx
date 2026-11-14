import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '../../api/httpClient'
import type { UserProfile } from '../../data/models'
import { createAuthApi, type AuthApi, type LoginInput, type SignupInput } from './authApi'

export function authErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return '처리하지 못했어요. 잠시 후 다시 시도해 주세요.'
  if (error.code === 'INVALID_CREDENTIALS') return '이메일 또는 비밀번호를 확인해 주세요.'
  if (error.code === 'EMAIL_ALREADY_EXISTS') return '이미 가입한 이메일이에요. 로그인해 주세요.'
  if (error.code === 'CSRF_INVALID') return '요청 인증 정보를 확인하지 못했어요. 입력 내용을 유지한 채 다시 눌러 주세요.'
  if (error.code === 'RATE_LIMITED') return error.retryAfterSeconds ? `요청이 많아요. ${error.retryAfterSeconds}초 후 다시 시도해 주세요.` : '요청이 많아요. 잠시 후 다시 시도해 주세요.'
  if (error.code === 'VALIDATION') return '입력값과 비밀번호 조건을 확인해 주세요.'
  if (error.code === 'UNAUTHENTICATED') return '로그인이 만료됐어요. 다시 로그인해 주세요.'
  if (error.code === 'NETWORK') return '서버와 연결하지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.'
  if (error.code === 'SESSION_CHANGED') return '인증 상태가 변경됐어요. 다시 시도해 주세요.'
  return '서버 응답을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.'
}
type AuthState = {
  profile: UserProfile | null; sessionKey: string; validationRevision: number; initializing: boolean; bootstrapError: string;
  notice: string; busy: boolean; retry: () => void;
  login: (input: LoginInput) => Promise<void>; signup: (input: SignupInput) => Promise<void>; logout: () => Promise<void>;
}
const Context = createContext<AuthState | null>(null)
const unauthorized = (error: unknown) => error instanceof ApiError && error.status === 401

export function AuthProvider({ children, api: implementation }: { children: ReactNode; api?: AuthApi }) {
  const [api] = useState(() => implementation ?? createAuthApi())
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [validationRevision, setValidationRevision] = useState(0)
  const [sessionNumber, setSessionNumber] = useState(0)
  const [initializing, setInitializing] = useState(true)
  const [bootstrapError, setBootstrapError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const current = useRef<UserProfile | null>(null)
  const epoch = useRef(0)
  const checkSequence = useRef(0)
  const working = useRef(false)

  const clear = useCallback((message = '') => {
    current.current = null; setProfile(null); setNotice(message); setSessionNumber(value => value + 1)
  }, [])
  const accept = useCallback((value: UserProfile, newSession = false) => {
    if (newSession || current.current?.id !== value.id) {
      api.resetCsrf(); setSessionNumber(previous => previous + 1)
    }
    current.current = value; setProfile(value)
  }, [api])

  const check = useCallback(async (bootstrap = false) => {
    if (working.current) return
    const ticket = epoch.current
    const sequence = ++checkSequence.current
    if (bootstrap) { setInitializing(true); setBootstrapError('') }
    try {
      const value = await api.me()
      if (ticket === epoch.current && sequence === checkSequence.current) { accept(value); setNotice(''); setValidationRevision(previous => previous + 1) }
    } catch (error) {
      if (ticket !== epoch.current || sequence !== checkSequence.current) return
      if (unauthorized(error)) {
        epoch.current++
        api.resetCsrf()
        clear(current.current ? '로그인이 만료됐어요. 다시 로그인해 주세요.' : '')
        if (bootstrap) setInitializing(false)
      }
      else if (bootstrap) setBootstrapError(authErrorMessage(error))
      else setNotice(authErrorMessage(error))
    } finally { if (bootstrap && ticket === epoch.current && sequence === checkSequence.current) setInitializing(false) }
  }, [api, accept, clear])

  useEffect(() => {
    const stop = api.onUnauthorized(() => {
      if (!current.current) return
      epoch.current++; clear('로그인이 만료됐어요. 다시 로그인해 주세요.')
    })
    void check(true)
    const focus = () => { if (current.current) void check() }
    const visible = () => { if (document.visibilityState === 'visible') focus() }
    window.addEventListener('focus', focus)
    window.addEventListener('online', focus)
    document.addEventListener('visibilitychange', visible)
    return () => {
      epoch.current++; stop()
      window.removeEventListener('focus', focus)
      window.removeEventListener('online', focus)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [api, check, clear])

  const run = async <T,>(operation: () => Promise<T>, success: (value: T) => void) => {
    if (working.current) throw new ApiError(0, 'BUSY', '다른 인증 요청을 처리하고 있어요.')
    working.current = true; setBusy(true); setNotice('')
    const ticket = ++epoch.current
    try {
      const value = await operation()
      if (ticket === epoch.current) success(value)
    } finally { working.current = false; setBusy(false) }
  }

  return <Context.Provider value={{ profile, sessionKey: `${profile?.id ?? 'anonymous'}:${sessionNumber}`,
    validationRevision, initializing, bootstrapError, notice, busy, retry: () => { void check(true) },
    login: input => run(() => api.login(input), value => accept(value, true)),
    signup: input => run(() => api.signup(input), () => setNotice('회원가입이 완료됐어요. 로그인해 주세요.')),
    logout: async () => {
      try { await run(() => api.logout(), () => clear()) } catch (error) {
        if (unauthorized(error)) clear('로그인이 만료됐어요. 다시 로그인해 주세요.')
        else throw error
      }
    },
  }}>{children}</Context.Provider>
}
export function useAuth() {
  const value = useContext(Context)
  if (!value) throw new Error('AuthProvider가 필요합니다.')
  return value
}
