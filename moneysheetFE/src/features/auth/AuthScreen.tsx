import { useRef, useState } from 'react'
import type { Screen } from '../../types/navigation'
import Icon from '../../components/Icon'
import { ApiError } from '../../api/httpClient'
import { authErrorMessage, useAuth } from './AuthProvider'
import EmailVerificationFields from './EmailVerificationFields'

export default function AuthScreen({ go, signup = false }: { go: (s: Screen) => void; signup?: boolean }) {
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')
  const [verificationRevision, setVerificationRevision] = useState(0)
  const [touched, setTouched] = useState({ email: false, nickname: false, password: false, confirmation: false, agreed: false })
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState('')
  const submitting = useRef(false)
  const length = Array.from(password).length
  const errors = {
    email: !email.trim() ? '이메일을 입력해 주세요.' : email.trim().length > 254 || !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email.trim()) ? '올바른 이메일 형식을 입력해 주세요.' : '',
    nickname: signup && (!nickname.trim() || nickname.trim().length > 50) ? '닉네임을 1~50자로 입력해 주세요.' : '',
    password: !password.length ? '비밀번호를 입력해 주세요.' : (signup ? length < 10 || length > 20 : length > 128) ? (signup ? '비밀번호는 10~20자로 입력해 주세요.' : '비밀번호는 128자 이내로 입력해 주세요.') : '',
    confirmation: signup && (!confirmation || confirmation !== password) ? '비밀번호가 일치하지 않아요.' : '',
    agreed: signup && !agreed ? '개인정보처리방침 동의가 필요해요.' : '',
  }
  const canSubmit = Object.values(errors).every(error => !error) && !auth.busy && (!signup || !!verificationToken)
  const touch = (field: keyof typeof touched) => setTouched(previous => ({ ...previous, [field]: true }))
  const edit = (field: string) => { setFailure(''); setServerErrors(previous => ({ ...previous, [field]: '' })) }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setTouched({ email: true, nickname: true, password: true, confirmation: true, agreed: true })
    if (!canSubmit || submitting.current) return
    submitting.current = true; setFailure(''); setServerErrors({})
    try {
      const input = { email: email.trim().toLowerCase(), password }
      if (signup) {
        await auth.signup({ ...input, nickname: nickname.trim(), privacyPolicyVersion: 'v1', privacyAgreed: agreed, verificationToken })
        go('login')
      } else await auth.login(input)
    } catch (error) {
      setFailure(authErrorMessage(error))
      if (error instanceof ApiError) setServerErrors(Object.fromEntries(error.fieldErrors.map(item => [item.field, item.message])))
      if (error instanceof ApiError && error.fieldErrors.some(item => item.field === 'verificationToken')) {
        setVerificationToken(''); setVerificationRevision(previous => previous + 1)
        setFailure('이메일 인증이 만료되었거나 사용됐어요. 인증을 다시 진행해 주세요.')
      }
    } finally { submitting.current = false }
  }
  const fieldError = (field: keyof typeof errors) => serverErrors[field] || (touched[field] ? errors[field] : '')
  return <main className="auth-screen">
    <div className="brand-mark"><Icon name="wallet" size={26} /></div>
    <div className="brand">moneysheet</div>
    <p className="auth-copy">{signup ? '나만의 월간 생활비 관리를 시작하세요.' : '오늘의 여유를 한눈에 확인하세요.'}</p>
    {auth.notice && <p role="status" className="form-help">{auth.notice}</p>}
    <form className="form-stack" onSubmit={submit} noValidate aria-busy={auth.busy}>
      <label className="field"><span id="auth-email-label">이메일</span>
        <input aria-labelledby="auth-email-label" type="email" name="email" autoComplete="email" placeholder="name@example.com" maxLength={254} required disabled={auth.busy} value={email} onChange={event => {
          if (event.target.value.trim().toLowerCase() !== email.trim().toLowerCase()) setVerificationToken('')
          setEmail(event.target.value); edit('email')
        }} onBlur={() => touch('email')} aria-invalid={!!fieldError('email')} aria-describedby={fieldError('email') ? 'auth-email-error' : undefined} />
        {fieldError('email') && <small className="field-error" id="auth-email-error">{fieldError('email')}</small>}
      </label>
      {signup && <EmailVerificationFields key={verificationRevision} email={email} emailValid={!errors.email} disabled={auth.busy}
        request={auth.requestEmailVerification} confirm={auth.confirmEmailVerification} onVerified={setVerificationToken} />}
      {signup && <label className="field"><span id="auth-nickname-label">닉네임</span>
        <input aria-labelledby="auth-nickname-label" name="nickname" autoComplete="nickname" placeholder="닉네임 입력" maxLength={50} required disabled={auth.busy} value={nickname} onChange={event => { setNickname(event.target.value); edit('nickname') }} onBlur={() => touch('nickname')} aria-invalid={!!fieldError('nickname')} aria-describedby={fieldError('nickname') ? 'auth-nickname-error' : undefined} />
        {fieldError('nickname') && <small className="field-error" id="auth-nickname-error">{fieldError('nickname')}</small>}
      </label>}
      <label className="field"><span id="auth-password-label">비밀번호</span>
        <input aria-labelledby="auth-password-label" type="password" name="password" autoComplete={signup ? 'new-password' : 'current-password'} placeholder={signup ? '10~20자, 공백·한글 사용 가능' : '비밀번호 입력'} required disabled={auth.busy} value={password} onChange={event => { setPassword(event.target.value); edit('password') }} onBlur={() => touch('password')} aria-invalid={!!fieldError('password')} aria-describedby={fieldError('password') ? 'auth-password-error' : undefined} />
        {fieldError('password') && <small className="field-error" id="auth-password-error">{fieldError('password')}</small>}
      </label>
      {signup && <label className="field"><span id="auth-confirmation-label">비밀번호 확인</span>
        <input aria-labelledby="auth-confirmation-label" type="password" name="passwordConfirmation" autoComplete="new-password" placeholder="비밀번호를 다시 입력해 주세요" required disabled={auth.busy} value={confirmation} onChange={event => { setConfirmation(event.target.value); touch('confirmation') }} onBlur={() => touch('confirmation')} aria-invalid={!!fieldError('confirmation')} aria-describedby={fieldError('confirmation') ? 'auth-confirmation-error' : undefined} />
        {fieldError('confirmation') && <small className="field-error" id="auth-confirmation-error">{fieldError('confirmation')}</small>}
      </label>}
      {signup && <div><label className="policy"><input type="checkbox" required disabled={auth.busy} checked={agreed} onChange={event => { setAgreed(event.target.checked); touch('agreed'); edit('privacyAgreed') }} aria-invalid={!!fieldError('agreed')} /> <span>개인정보처리방침을 확인했으며 동의합니다.</span></label>
        {fieldError('agreed') && <small className="field-error">{fieldError('agreed')}</small>}
      </div>}
      {failure && <p className="field-error" role="alert">{failure}</p>}
      <button className="primary-button" type="submit" disabled={!canSubmit}>{auth.busy ? '처리 중…' : signup ? '가입하기' : '로그인'}</button>
      <p className="form-help">{signup ? '이메일 인증을 완료한 뒤 가입해 주세요. 비밀번호 찾기는 아직 지원하지 않아요.' : '이메일과 비밀번호로 로그인해 주세요.'}</p>
    </form>
    <button className="text-button" type="button" disabled={auth.busy} onClick={() => go(signup ? 'login' : 'signup')}>{signup ? '이미 계정이 있어요 · 로그인' : '처음이신가요? 회원가입'}</button>
  </main>
}
