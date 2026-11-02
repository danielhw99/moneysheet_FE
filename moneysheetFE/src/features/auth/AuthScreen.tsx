import { useState } from 'react'
import type { Screen } from '../../types/navigation'
import Icon from '../../components/Icon'

export default function Login({ go, signup = false }: { go: (s: Screen) => void; signup?: boolean }) {
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [touched, setTouched] = useState({ email: false, nickname: false, password: false, agreed: false })
  const errors = {
    email: !email.trim() ? '이메일을 입력해 주세요.' : !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email.trim()) ? '올바른 이메일 형식을 입력해 주세요.' : '',
    nickname: signup && !nickname.trim() ? '닉네임을 입력해 주세요.' : '',
    password: !password.trim() ? '비밀번호를 입력해 주세요.' : '',
    agreed: signup && !agreed ? '개인정보처리방침 동의가 필요해요.' : '',
  }
  const canSubmit = Object.values(errors).every(error => !error)
  const markTouched = (field: keyof typeof touched) => setTouched(previous => ({ ...previous, [field]: true }))
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setTouched({ email: true, nickname: true, password: true, agreed: true })
    if (!canSubmit) return
    go(signup ? 'login' : 'home')
  }
  const fillTestAccount = () => {
    setEmail('test123@test.com')
    setPassword('test123')
    setTouched({ email: false, nickname: false, password: false, agreed: false })
  }
  return (
    <main className="auth-screen">
      <div className="brand-mark"><Icon name="wallet" size={26} /></div>
      <div className="brand">moneysheet</div>
      <p className="auth-copy">{signup ? '나만의 월간 생활비 관리를 시작하세요.' : '오늘의 여유를 한눈에 확인하세요.'}</p>
      <form className="form-stack" onSubmit={submit} noValidate>
        <label className="field">
          <span>이메일</span>
          <input type="email" name="email" autoComplete="email" placeholder="name@example.com" required value={email} onChange={event => setEmail(event.target.value)} onBlur={() => markTouched('email')} aria-invalid={touched.email && !!errors.email} aria-describedby={touched.email && errors.email ? 'auth-email-error' : undefined} />
          {touched.email && errors.email && <small className="field-error" id="auth-email-error" role="alert">{errors.email}</small>}
        </label>
        {signup && <label className="field">
          <span>닉네임</span>
          <input name="nickname" autoComplete="nickname" placeholder="닉네임 입력" required value={nickname} onChange={event => setNickname(event.target.value)} onBlur={() => markTouched('nickname')} aria-invalid={touched.nickname && !!errors.nickname} aria-describedby={touched.nickname && errors.nickname ? 'auth-nickname-error' : undefined} />
          {touched.nickname && errors.nickname && <small className="field-error" id="auth-nickname-error" role="alert">{errors.nickname}</small>}
        </label>}
        <label className="field">
          <span>비밀번호</span>
          <input type="password" name="password" autoComplete={signup ? 'new-password' : 'current-password'} placeholder="비밀번호 입력" required value={password} onChange={event => setPassword(event.target.value)} onBlur={() => markTouched('password')} aria-invalid={touched.password && !!errors.password} aria-describedby={touched.password && errors.password ? 'auth-password-error' : undefined} />
          {touched.password && errors.password && <small className="field-error" id="auth-password-error" role="alert">{errors.password}</small>}
        </label>
        {signup && <div>
          <label className="policy"><input type="checkbox" required checked={agreed} onChange={event => { setAgreed(event.target.checked); markTouched('agreed') }} onBlur={() => markTouched('agreed')} aria-invalid={touched.agreed && !!errors.agreed} aria-describedby={touched.agreed && errors.agreed ? 'auth-policy-error' : undefined} /> <span>개인정보처리방침을 확인했으며 동의합니다.</span></label>
          {touched.agreed && errors.agreed && <small className="field-error" id="auth-policy-error" role="alert">{errors.agreed}</small>}
        </div>}
        <button className="primary-button" type="submit" disabled={!canSubmit}>{signup ? '가입하기' : '로그인'}</button>
        <p className="form-help">화면 확인용입니다. 실제 계정 인증과 회원정보 저장은 아직 연결되지 않았어요.</p>
        {!signup && import.meta.env.DEV && <button className="text-button" type="button" onClick={fillTestAccount}>테스트 계정 입력 (개발용)</button>}
      </form>
      <button className="text-button" type="button" onClick={() => go(signup ? 'login' : 'signup')}>
        {signup ? '이미 계정이 있어요 · 로그인' : '처음이신가요? 회원가입'}
      </button>
    </main>
  )
}
