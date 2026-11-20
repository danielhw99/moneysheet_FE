import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/httpClient'
import type { VerificationSent, VerificationConfirmed, VerificationConfirmation } from './authApi'

type Props = {
  email: string; emailValid: boolean; disabled: boolean;
  request: (email: string) => Promise<VerificationSent>;
  confirm: (input: VerificationConfirmation) => Promise<VerificationConfirmed>;
  onVerified: (token: string) => void;
}
export default function EmailVerificationFields({ email, emailValid, disabled, request, confirm, onVerified }: Props) {
  const normalized = email.trim().toLowerCase()
  const [sent, setSent] = useState<VerificationSent | null>(null)
  const [code, setCode] = useState('')
  const [proof, setProof] = useState<VerificationConfirmed | null>(null)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState('')
  const [resendAt, setResendAt] = useState(0)
  const [now, setNow] = useState(Date.now)
  const needsClock = resendAt > now || (proof !== null && now < Date.parse(proof.expiresAt))
  const active = useRef(true), working = useRef(false), sequence = useRef(0), currentEmail = useRef(normalized)
  currentEmail.current = normalized
  useEffect(() => {
    active.current = true
    return () => { active.current = false; sequence.current++ }
  }, [])
  useEffect(() => {
    sequence.current++; working.current = false; setPending(false)
    setSent(null); setCode(''); setProof(null); setFailure(''); setResendAt(0); onVerified('')
  }, [normalized, onVerified])
  useEffect(() => {
    if (!needsClock) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [resendAt, needsClock])
  useEffect(() => {
    if (proof && now >= Date.parse(proof.expiresAt)) {
      setProof(null); onVerified(''); setFailure('인증이 만료됐어요. 새 번호를 요청해 주세요.')
    }
  }, [now, proof, onVerified])
  const blocked = disabled || pending
  const remaining = Math.max(0, Math.ceil((resendAt - now) / 1000))
  const perform = async (confirmation: boolean) => {
    if (blocked || working.current || !emailValid || confirmation && (!sent || !/^[0-9]{6}$/.test(code)) || !confirmation && remaining > 0) return
    working.current = true; setPending(true); setFailure('')
    const ticket = ++sequence.current, address = normalized
    const current = () => active.current && ticket === sequence.current && address === currentEmail.current
    try {
      if (confirmation) {
        const value = await confirm({ email: address, challengeId: sent!.challengeId, code })
        if (current()) { setProof(value); onVerified(value.verificationToken); setNow(Date.now()) }
      } else {
        const value = await request(address)
        if (current()) {
          setSent(value); setProof(null); onVerified(''); setCode('')
          setResendAt(Date.now() + value.resendAfterSeconds * 1000); setNow(Date.now())
        }
      }
    } catch (error) {
      if (current()) {
        const field = error instanceof ApiError ? error.fieldErrors.find(item => item.field === 'code' || item.field === 'email') : undefined
        setFailure(field?.message || (error instanceof ApiError && error.code === 'EMAIL_ALREADY_EXISTS'
          ? '이미 가입한 이메일이에요. 로그인해 주세요.' : error instanceof ApiError && error.code === 'RATE_LIMITED'
            ? '요청이 많아요. 잠시 후 다시 시도해 주세요.' : '인증을 처리하지 못했어요. 입력을 확인하고 다시 시도해 주세요.'))
        if (error instanceof ApiError && error.retryAfterSeconds) { setResendAt(Date.now()+error.retryAfterSeconds*1000); setNow(Date.now()) }
      }
    } finally { if (current()) { working.current = false; setPending(false) } }
  }
  return <div className="email-verification" aria-busy={pending}>
    {proof ? <p className="form-help" role="status">이메일 인증이 완료됐어요.</p> : <>
      <button className="secondary-button" type="button" disabled={blocked || !emailValid || remaining > 0} onClick={() => { void perform(false) }}>
        {remaining > 0 ? `${remaining}초 후 재발송` : sent ? '인증번호 다시 받기' : '인증번호 받기'}
      </button>
      {sent && <>
        <p className="form-help">메일로 보낸 6자리 번호를 10분 안에 입력해 주세요. 메일이 없으면 스팸함도 확인해 주세요.</p>
        <label className="field"><span id="verification-code-label">인증번호</span>
          <input aria-labelledby="verification-code-label" autoComplete="one-time-code" inputMode="numeric" maxLength={6} value={code}
            disabled={blocked} onChange={event => { setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6)); setFailure('') }}
            aria-invalid={!!failure} aria-describedby={failure ? 'verification-error' : undefined} />
        </label>
        <button className="secondary-button" type="button" disabled={blocked || !/^[0-9]{6}$/.test(code)} onClick={() => { void perform(true) }}>인증번호 확인</button>
      </>}
    </>}
    {failure && <p id="verification-error" className="field-error" role="alert">{failure}</p>}
  </div>
}
