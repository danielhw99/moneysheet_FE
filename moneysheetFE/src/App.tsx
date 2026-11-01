import { useMemo, useState } from 'react'

type Screen =
  | 'login'
  | 'signup'
  | 'home'
  | 'daily'
  | 'monthly'
  | 'my'
  | 'transactions'
  | 'memos'
  | 'fixed-pay'
  | 'basic'
  | 'income'
  | 'extra'
  | 'account'
  | 'settings'

type IconName =
  | 'back'
  | 'chevron'
  | 'calendar'
  | 'daily'
  | 'monthly'
  | 'user'
  | 'lock'
  | 'unlock'
  | 'plus'
  | 'check'
  | 'wallet'
  | 'edit'
  | 'settings'
  | 'logout'

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    back: <path d="m15 18-6-6 6-6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    daily: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5z" /><path d="M8 8h8M8 12h5M8 16h3" /></>,
    monthly: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    unlock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 7.5-2" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    wallet: <><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H18v4H5.5A2.5 2.5 0 0 1 3 5.5V19a2 2 0 0 0 2 2h16V8H5.5" /><path d="M16 13h2" /></>,
    edit: <><path d="m4 16-1 5 5-1L19 9l-4-4z" /><path d="m13.5 6.5 4 4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
  }
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" width={size} height={size}>{paths[name]}</svg>
}

function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <header className="topbar">
      <div className="topbar-side">{onBack && <button className="icon-button" onClick={onBack} aria-label="뒤로가기"><Icon name="back" /></button>}</div>
      <div className="topbar-title">{title}</div>
      <div className="topbar-side right">{right}</div>
    </header>
  )
}

const navItems: { key: Screen; label: string; icon: IconName }[] = [
  { key: 'home', label: '홈', icon: 'calendar' },
  { key: 'daily', label: 'Daily', icon: 'daily' },
  { key: 'monthly', label: 'Monthly', icon: 'monthly' },
  { key: 'my', label: 'MY', icon: 'user' },
]

function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button key={item.key} className={screen === item.key ? 'nav-item active' : 'nav-item'} onClick={() => go(item.key)}>
          <Icon name={item.icon} size={21} /><span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

const entries = [
  { title: '점심 · 샐러드', amount: '-11,000원', tone: 'amount-expense' },
  { title: '편의점', amount: '-4,500원', tone: 'amount-expense' },
  { title: '중고거래 입금', amount: '+20,000원', tone: 'amount-income' },
]
const memos = [
  { title: '친구 정산', amount: '-45,000원' },
  { title: '유튜브 보전금', amount: '-14,900원' },
  { title: '아빠 용돈', amount: '+50,000원' },
]

function Login({ go, signup = false }: { go: (s: Screen) => void; signup?: boolean }) {
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

const calendarDays = Array.from({ length: 35 }, (_, index) => index - 3)
const dayData: Record<number, { a: string; b?: string; type?: string }> = {
  1: { a: '고정 850,000', type: 'red' }, 2: { a: '내역 22,000', b: '메모 3건', type: 'blue' },
  4: { a: '내역 8,500', type: 'blue' }, 7: { a: '여유 42,000', type: 'green' },
  9: { a: '고정 59,000', type: 'red' }, 12: { a: '내역 31,200', b: '+2건', type: 'blue' },
  16: { a: '여유 28,000', type: 'green' }, 20: { a: '메모 1건', type: 'gray' },
  23: { a: '내역 19,800', type: 'blue' }, 27: { a: '고정 12,900', type: 'red' },
}

function Home({ go }: { go: (s: Screen) => void }) {
  return (
    <main className="app-shell">
      <section className="screen-content home-content">
        <div className="month-head">
          <button className="icon-button" aria-label="이전 달"><Icon name="back" /></button>
          <button className="month-picker">2026년 10월 <span className="down-caret">⌄</span></button>
          <button className="icon-button flip" aria-label="다음 달"><Icon name="back" /></button>
        </div>
        <div className="legend">
          <span><i className="dot blue" />내역</span><span><i className="dot red" />고정지출</span>
          <span><i className="dot green" />여유비</span><span><i className="dot gray" />메모</span>
        </div>
        <div className="calendar">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => <div className={`weekday ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`} key={d}>{d}</div>)}
          {calendarDays.map((day, i) => {
            const valid = day > 0 && day <= 31
            const info = dayData[day]
            return (
              <button key={i} disabled={!valid} onClick={() => go('daily')} className={`day-cell ${day === 2 ? 'selected' : ''} ${day === 6 ? 'today' : ''}`}>
                <span className="day-number">{valid ? day : ''}</span>
                {info && <span className={`day-info ${info.type}`}>{info.a}</span>}
                {info?.b && <span className="day-sub">{info.b}</span>}
              </button>
            )
          })}
        </div>
        <button className="month-summary" onClick={() => go('monthly')}>
          <span><small>10월 지출</small><strong>1,250,000원</strong></span>
          <span className="summary-free"><small>남은 여유비</small><strong>68,100원</strong></span>
          <Icon name="chevron" />
        </button>
      </section>
      <BottomNav screen="home" go={go} />
    </main>
  )
}

function MiniList({ title, onOpen, children, addLabel, onAdd }: { title: string; onOpen: () => void; children: React.ReactNode; addLabel: string; onAdd: () => void }) {
  return (
    <section className="mini-panel">
      <button className="panel-heading" onClick={onOpen}><strong>{title}</strong><Icon name="chevron" size={17} /></button>
      <div className="panel-scroll">{children}</div>
      <button className="panel-add" onClick={onAdd}><Icon name="plus" size={16} />{addLabel}</button>
    </section>
  )
}

function Daily({ go }: { go: (s: Screen) => void }) {
  const [locked, setLocked] = useState(true)
  return (
    <main className="app-shell">
      <section className="screen-content daily-content">
        <Header title="2026.10.02 금요일" onBack={() => go('home')} />
        <section className="balance-card">
          <div className="main-balance"><span>Main 계산 잔액</span><strong>68,100원</strong></div>
          <div className="account-balance">
            <label><span>실제 계좌 잔액</span><input disabled={locked} defaultValue="67,800" inputMode="numeric" /><b>원</b></label>
            <button className={locked ? 'lock-button locked' : 'lock-button'} onClick={() => setLocked(!locked)} aria-label={locked ? '잔액 잠금 해제' : '잔액 잠금'}>
              <Icon name={locked ? 'lock' : 'unlock'} size={17} />
            </button>
          </div>
          <p className="helper">{locked ? '비교 잔액이 잠겨 있어요' : '비교용 값이며 계산 잔액에는 반영되지 않아요'}</p>
        </section>
        <section className="budget-pair">
          <div><span>남은 여유비</span><strong>39,000원</strong></div>
          <div><span>오늘 식비 예산</span><strong>11,000원</strong></div>
        </section>
        <div className="split-panels">
          <MiniList title="내역" onOpen={() => go('transactions')} addLabel="내역 추가" onAdd={() => go('transactions')}>
            {entries.map((item) => <button className="compact-row" key={item.title} onClick={() => go('transactions')}><span className="truncate">{item.title}</span><b className={item.tone}>{item.amount}</b></button>)}
          </MiniList>
          <MiniList title="메모" onOpen={() => go('memos')} addLabel="메모 추가" onAdd={() => go('memos')}>
            {memos.map((item, i) => <div className="memo-row" key={item.title}><button className="checkbox" aria-label={`${item.title} 완료`}>{i === 2 && <Icon name="check" size={13} />}</button><button className="memo-main" onClick={() => go('memos')}><span className="truncate">{item.title}</span><b>{item.amount}</b></button></div>)}
          </MiniList>
        </div>
        <section className="fixed-panel">
          <button className="panel-heading" onClick={() => go('fixed-pay')}><strong>고정지출</strong><Icon name="chevron" size={17} /></button>
          <div className="fixed-scroll">
            <button className="fixed-row" onClick={() => go('fixed-pay')}><span><b>월세</b><small>잔여 200,000원</small></span><strong className="amount-expense">600,000원</strong></button>
            <button className="fixed-row" onClick={() => go('fixed-pay')}><span><b>휴대폰 요금</b><small className="complete">지급 완료</small></span><strong className="amount-expense">59,000원</strong></button>
          </div>
          <button className="panel-add" onClick={() => go('fixed-pay')}><Icon name="plus" size={16} />지급 기록</button>
        </section>
      </section>
      <BottomNav screen="daily" go={go} />
    </main>
  )
}

type FixedBudgetItem = { id: string; name: string; category: string; amount: number; paid: number }
type MonthBudget = { locked: boolean; fixed: FixedBudgetItem[] }
const allowanceId = 'free-allowance'
const foodBudget = 328000 // Existing food-budget prototype; food editing is separate from fixed budgets.
const won = (amount: number) => amount.toLocaleString('ko-KR')
const currentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
const initialBudget = (includeDemoPayments = false): MonthBudget => ({
  locked: true,
  fixed: [
    { id: 'rent', name: '월세', category: '주거', amount: 800000, paid: includeDemoPayments ? 600000 : 0 },
    { id: 'phone', name: '휴대폰 요금', category: '통신', amount: 59000, paid: includeDemoPayments ? 59000 : 0 },
    { id: 'subscription', name: '구독 서비스', category: '구독', amount: 12900, paid: 0 },
    { id: 'insurance', name: '보험료', category: '보험', amount: 80000, paid: 0 },
    { id: allowanceId, name: '고정여유비', category: '여유비', amount: 120000, paid: 0 },
  ],
})
const fixedTotal = (budget: MonthBudget) => budget.fixed.reduce((total, item) => total + item.amount, 0)

const monthlySections = [
  { title: '기본지출', desc: '고정지출 + 식비 예산', amount: '1,180,000원', target: 'basic' as Screen },
  { title: '그 외 지출', desc: '저축계좌 출금', amount: '70,000원', target: 'extra' as Screen },
  { title: '수입', desc: '이번 달 수동 입력', amount: '4,000,000원', target: 'income' as Screen },
]

function Monthly({ go, month, changeMonth, budget }: { go: (s: Screen) => void; month: string; changeMonth: (offset: number) => void; budget: MonthBudget }) {
  const basicTotal = fixedTotal(budget) + foodBudget
  const totalExpense = basicTotal + 70000
  const net = 4000000 - totalExpense
  return (
    <main className="app-shell">
      <section className="screen-content">
        <div className="month-head monthly-head">
          <button className="icon-button" aria-label="이전 달" onClick={() => changeMonth(-1)}><Icon name="back" /></button>
          <strong className="month-picker">{month.slice(0, 4)}년 {Number(month.slice(5))}월</strong>
          <button className="icon-button flip" aria-label="다음 달" onClick={() => changeMonth(1)}><Icon name="back" /></button>
        </div>
        <div className="monthly-list">
          {monthlySections.map((item) => (
            <button className="monthly-card" key={item.title} onClick={() => go(item.target)}>
              <span className={`section-icon ${item.title === '수입' ? 'income' : item.title === '그 외 지출' ? 'extra' : ''}`}><Icon name={item.title === '기본지출' ? 'wallet' : item.title === '수입' ? 'plus' : 'monthly'} size={19} /></span>
              <span className="monthly-copy"><b>{item.title}</b><small>{item.desc}</small></span>
              <strong className={item.target === 'income' ? 'amount-income' : 'amount-expense'}>{item.target === 'basic' ? `${won(basicTotal)}원` : item.amount}</strong><Icon name="chevron" size={17} />
            </button>
          ))}
        </div>
        <section className="status-card">
          <div className="status-title"><span>이번 달 현황</span><small>예산 기준</small></div>
          <dl><div><dt>총수입</dt><dd className="amount-income">4,000,000원</dd></div><div><dt>총지출</dt><dd className="amount-expense">{won(totalExpense)}원</dd></div><div className="net"><dt>순증감</dt><dd>{net >= 0 ? '+' : '-'}{won(Math.abs(net))}원</dd></div></dl>
          <p>순증감은 월 수입에서 총지출을 뺀 금액이에요.</p>
        </section>
      </section>
      <BottomNav screen="monthly" go={go} />
    </main>
  )
}

function FixedBudgetForm({ item, onSave, onCancel }: { item?: FixedBudgetItem; onSave: (values: Pick<FixedBudgetItem, 'name' | 'category' | 'amount'>) => boolean; onCancel: () => void }) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState(item?.category ?? '')
  const [amount, setAmount] = useState(item ? won(item.amount) : '')
  const [error, setError] = useState('')
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim() || !category.trim() || !amount.trim()) {
      setError('항목명, 카테고리, 예산 금액을 모두 입력해 주세요.')
      return
    }
    const numericAmount = Number(amount.trim().replace(/,/g, ''))
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(amount.trim()) || !Number.isSafeInteger(numericAmount)) {
      setError('예산 금액은 정확하게 계산할 수 있는 0 이상의 원 단위 정수로 입력해 주세요.')
      return
    }
    if (!onSave({ name: name.trim(), category: category.trim(), amount: numericAmount })) {
      setError('예산이 잠겨 있거나 지난달이면 저장할 수 없어요. 금액 합계도 확인해 주세요.')
    }
  }
  return (
    <main className="detail-shell">
      <Header title={item ? '고정지출 예산 편집' : '고정지출 예산 추가'} onBack={onCancel} />
      <form className="record-form fixed-budget-form" onSubmit={submit} noValidate>
        <label className="field"><span>항목명</span><input required value={name} readOnly={item?.id === allowanceId} onChange={event => setName(event.target.value)} /></label>
        <label className="field"><span>카테고리</span><input required value={category} onChange={event => setCategory(event.target.value)} /></label>
        <label className="field"><span>예산 금액</span><div className="money-input"><input required aria-label="예산 금액" inputMode="numeric" value={amount} onChange={event => setAmount(event.target.value)} /><b>원</b></div></label>
        {item?.id === allowanceId && <p className="form-help">매월 필요한 고정여유비예요. 1일에 자동 반영됩니다.</p>}
        {error && <p className="form-help" role="alert">{error}</p>}
        <div className="form-actions"><button className="secondary-button" type="button" onClick={onCancel}>취소</button><button className="primary-button" type="submit">저장</button></div>
      </form>
    </main>
  )
}

function BasicBudget({ go, month, budget, setLocked, saveItem }: { go: (s: Screen) => void; month: string; budget: MonthBudget; setLocked: (locked: boolean) => void; saveItem: (item: FixedBudgetItem) => boolean }) {
  const [editing, setEditing] = useState<FixedBudgetItem | 'new' | null>(null)
  const [, refreshMonth] = useState(currentMonth)
  const pastMonth = month < currentMonth()
  const readOnly = budget.locked || pastMonth
  const openForm = (item: FixedBudgetItem | 'new') => {
    const nowMonth = currentMonth()
    if (month < nowMonth) {
      // Refresh the read-only controls when the month changed while this list was idle.
      refreshMonth(nowMonth)
      return
    }
    if (!readOnly) setEditing(item)
  }
  if (editing) return <FixedBudgetForm item={editing === 'new' ? undefined : editing} onCancel={() => setEditing(null)} onSave={values => {
    if (readOnly || month < currentMonth()) return false
    const item = editing === 'new' ? { id: crypto.randomUUID(), paid: 0, ...values } : { ...editing, ...values }
    if (!saveItem(item)) return false
    setEditing(null)
    return true
  }} />
  return (
    <main className="detail-shell budget-detail">
      <Header title="기본지출" onBack={() => go('monthly')} right={<button className={`lock-button ${budget.locked ? 'locked' : ''}`} disabled={pastMonth} aria-label={budget.locked ? '예산 잠금 해제' : '예산 잠금'} onClick={() => setLocked(!budget.locked)}><Icon name={budget.locked ? 'lock' : 'unlock'} size={17} /></button>} />
      <div className="sub-month">{month.replace('-', '.')} <span>{pastMonth ? '지난달 · 조회 전용' : budget.locked ? '예산 잠금' : '편집 중'}</span></div>
      <p className="notice">{pastMonth ? '지난달 예산은 수정할 수 없어요.' : budget.locked ? '잠금을 해제하면 이번 달 예산을 수정할 수 있어요.' : `수정한 값은 ${Number(month.slice(5))}월 전체에 적용됩니다.`}</p>
      <div className="budget-columns">
        <section className="budget-column">
          <div className="column-head"><b>고정지출</b><span>합계 <strong>{won(fixedTotal(budget))}원</strong></span></div>
          <div className="column-scroll">
            {budget.fixed.map(item => {
              const remaining = item.amount - item.paid
              const state = item.id === allowanceId ? '필수 · 1일 자동 반영' : remaining === 0 ? '완료' : `잔여 ${won(remaining)}원`
              return <button className="budget-row" key={item.id} disabled={readOnly} onClick={() => openForm(item)}><span><b className="truncate">{item.name}</b><small className={state === '완료' ? 'complete' : ''}>{state}</small></span><strong>{won(item.amount)}</strong></button>
            })}
          </div>
          <button className="panel-add" disabled={readOnly} onClick={() => openForm('new')}><Icon name="plus" size={16} />항목 추가</button>
        </section>
        <section className="budget-column food-column">
          <div className="column-head"><b>식비</b><span>월 합계 <strong>{won(foodBudget)}원</strong></span></div>
          <div className="column-scroll">
            {['주중|11,000', '토요일|18,000', '일요일|15,000'].map((row) => {
              const [label, value] = row.split('|')
              return <label className="budget-input" key={label}><span>{label}</span><div><input disabled={readOnly} defaultValue={value} /><b>원</b></div></label>
            })}
            <div className="periods">
              <span><small>1차</small><b>1~11일</b><strong>99,000원</strong></span>
              <span><small>2차</small><b>12~21일</b><strong>95,000원</strong></span>
              <span><small>3차</small><b>22일~말일</b><strong>134,000원</strong></span>
            </div>
          </div>
        </section>
      </div>
      <button className="primary-button bottom-action" disabled={readOnly} onClick={() => setLocked(true)}>저장</button>
    </main>
  )
}

type ListKind = 'transactions' | 'memos' | 'fixed-pay' | 'income' | 'extra'
const listConfig = {
  transactions: { title: '내역', total: [{ label: '지출 합계', amount: '15,500원', tone: 'amount-expense' }, { label: '입금 합계', amount: '20,000원', tone: 'amount-income' }], add: '거래 추가' },
  memos: { title: '메모', total: '미완료 보정 -9,900원', add: '메모 추가' },
  'fixed-pay': { title: '고정지출 지급', total: '10월 지급 659,000원', add: '지급 기록 추가' },
  income: { title: '수입', total: '월 합계 4,000,000원', add: '수입 추가' },
  extra: { title: '그 외 지출', total: '월 합계 70,000원', add: '지출 추가' },
}

function RecordList({ kind, go }: { kind: ListKind; go: (s: Screen) => void }) {
  const [editing, setEditing] = useState(false)
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense')
  const cfg = listConfig[kind]
  const back = kind === 'income' || kind === 'extra' ? 'monthly' : 'daily'
  const rows = kind === 'memos' ? memos : kind === 'fixed-pay'
    ? [{ title: '월세 · 1차 지급', amount: '-600,000원' }, { title: '휴대폰 요금', amount: '-59,000원' }]
    : kind === 'income' ? [{ title: '급여', amount: '+3,600,000원' }, { title: '부수입', amount: '+400,000원' }]
    : kind === 'extra' ? [{ title: '여행 적금', amount: '-50,000원' }, { title: '경조사', amount: '-20,000원' }] : entries
  return (
    <main className="detail-shell">
      <Header title={editing ? `${cfg.title} ${kind === 'fixed-pay' ? '입력' : '편집'}` : cfg.title} onBack={() => editing ? setEditing(false) : go(back)} />
      {!editing ? <>
        <div className="date-strip"><button><Icon name="back" size={17} /></button><strong>{kind === 'income' || kind === 'extra' ? '2026년 10월' : '2026.10.02 금요일'}</strong><button className="flip"><Icon name="back" size={17} /></button></div>
        {kind === 'memos' && <div className="segment"><button className="active">미완료 3</button><button>완료 이력</button></div>}
        <div className="record-list">
          {rows.map((item, i) => <button className="record-row" key={item.title} onClick={() => { setTransactionType(item.amount.startsWith('+') ? 'income' : 'expense'); setEditing(true) }}>
            <span className="record-date">{kind === 'income' || kind === 'extra' ? `${i + 2}일` : kind === 'memos' ? <i className="empty-check" /> : '10:30'}</span>
            <span className="record-title"><b>{item.title}</b><small>{kind === 'fixed-pay' ? (i ? '지급 완료' : '잔여 200,000원') : '생활 · 일반'}</small></span>
            <strong className={kind === 'memos' ? undefined : kind === 'income' || (kind === 'transactions' && item.amount.startsWith('+')) ? 'amount-income' : 'amount-expense'}>{item.amount}</strong><Icon name="chevron" size={16} />
          </button>)}
        </div>
        {typeof cfg.total === 'string' ? (
          <div className="list-total"><span>{cfg.total.split(' ')[0]}</span><strong className={kind === 'income' ? 'amount-income' : kind === 'extra' || kind === 'fixed-pay' ? 'amount-expense' : undefined}>{cfg.total.substring(cfg.total.indexOf(' ') + 1)}</strong></div>
        ) : (
          <dl className="transaction-totals" aria-label="지출 및 입금 합계">
            {cfg.total.map(total => <div key={total.label}><dt>{total.label}</dt><dd className={total.tone}>{total.amount}</dd></div>)}
          </dl>
        )}
        <button className="primary-button bottom-action" onClick={() => { setTransactionType('expense'); setEditing(true) }}><Icon name="plus" size={18} />{cfg.add}</button>
      </> : <RecordForm kind={kind} initialTransactionType={transactionType} onCancel={() => setEditing(false)} />}
    </main>
  )
}

function RecordForm({ kind, initialTransactionType, onCancel }: { kind: ListKind; initialTransactionType: 'expense' | 'income'; onCancel: () => void }) {
  const [transactionType, setTransactionType] = useState(initialTransactionType)
  const isMemo = kind === 'memos'
  const isFixed = kind === 'fixed-pay'
  return (
    <div className="record-form">
      {kind === 'transactions' ? <div className="segment wide" role="group" aria-label="거래 구분">
        <button type="button" className={transactionType === 'expense' ? 'active' : ''} aria-pressed={transactionType === 'expense'} onClick={() => setTransactionType('expense')}>지출</button>
        <button type="button" className={transactionType === 'income' ? 'active' : ''} aria-pressed={transactionType === 'income'} onClick={() => setTransactionType('income')}>입금</button>
      </div> : isMemo && <div className="segment wide"><button className="active">임시 출금</button><button>임시 입금</button></div>}
      <div className="record-date-time">
        <label className="field"><span>날짜</span><input type="date" name="date" defaultValue="2026-10-02" required /></label>
        <label className="field"><span>시간</span><input type="time" name="time" defaultValue="10:30" step={60} required /></label>
      </div>
      {isFixed && <>
        <label className="field"><span>고정지출 예산 항목</span><select defaultValue="월세"><option>월세</option><option>휴대폰 요금</option></select></label>
        <div className="read-only-pair"><span>항목 예산<b>800,000원</b></span><span>누적 지급<b>600,000원</b></span></div>
      </>}
      {kind === 'transactions' && <label className="field"><span>카테고리</span><select key={transactionType} defaultValue={transactionType === 'income' ? '용돈' : '식비'}>
        {(transactionType === 'income' ? ['용돈', '중고거래', '기타'] : ['식비', '생활', '교통']).map(category => <option key={category}>{category}</option>)}
      </select></label>}
      <label className="field"><span>{isFixed ? '이번 지급액' : kind === 'transactions' ? transactionType === 'income' ? '입금 금액' : '지출 금액' : '금액'}</span><div className="money-input"><input defaultValue={isFixed ? '200,000' : '45,000'} inputMode="numeric" /><b>원</b></div></label>
      {!isFixed && <label className="field"><span>내용</span><input defaultValue={isMemo ? '친구 정산' : kind === 'income' ? '급여' : '점심 식사'} /></label>}
      {isMemo && <label className="policy"><input type="checkbox" /> <span>완료 상태로 저장</span></label>}
      <p className="form-help">{isMemo ? '메모는 Main 잔액에만 반영되며 여유비에는 영향을 주지 않아요.' : isFixed ? '잔여 예산은 저장 후 자동으로 계산돼요.' : kind === 'transactions' && transactionType === 'expense' ? '본인 지출은 Main 잔액과 여유비에 반영돼요.' : '입금은 Main 잔액에만 반영돼요.'}</p>
      <div className="form-actions"><button className="secondary-button" onClick={onCancel}>취소</button><button className="primary-button" onClick={onCancel}>저장</button></div>
      <button className="delete-button" onClick={onCancel}>삭제</button>
    </div>
  )
}

function My({ go }: { go: (s: Screen) => void }) {
  return (
    <main className="app-shell">
      <section className="screen-content">
        <Header title="마이페이지" />
        <div className="profile"><div className="avatar">김</div><div><b>김모니</b><span>money@example.com</span></div></div>
        <div className="menu-list">
          <button onClick={() => go('account')}><Icon name="user" /><span>계정관리</span><Icon name="chevron" /></button>
          <button onClick={() => go('settings')}><Icon name="settings" /><span>설정</span><Icon name="chevron" /></button>
          <button className="logout" onClick={() => go('login')}><Icon name="logout" /><span>로그아웃</span></button>
        </div>
      </section>
      <BottomNav screen="my" go={go} />
    </main>
  )
}

function SimpleSettings({ type, go }: { type: 'account' | 'settings'; go: (s: Screen) => void }) {
  return (
    <main className="detail-shell">
      <Header title={type === 'account' ? '계정관리' : '설정'} onBack={() => go('my')} />
      {type === 'account' ? <div className="settings-form">
        <label className="field"><span>이메일</span><input defaultValue="money@example.com" /></label>
        <label className="field"><span>닉네임</span><input defaultValue="김모니" /></label>
        <button className="settings-row">비밀번호 변경<Icon name="chevron" /></button>
        <button className="primary-button">변경사항 저장</button>
      </div> : <div className="menu-list settings-menu">
        <button><span>이용약관</span><Icon name="chevron" /></button>
        <button><span>개인정보처리방침</span><Icon name="chevron" /></button>
        <button><span>오픈소스 라이선스</span><Icon name="chevron" /></button>
        <div className="version">moneysheet 버전 1.0.0</div>
      </div>}
    </main>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [month, setMonth] = useState(currentMonth)
  const [budgets, setBudgets] = useState<Record<string, MonthBudget>>(() => ({ [currentMonth()]: initialBudget(true) }))
  const budget = budgets[month]
  const changeMonth = (offset: number) => {
    const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + offset, 1)
    const next = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    setBudgets(previous => previous[next] ? previous : { ...previous, [next]: initialBudget() })
    setMonth(next)
  }
  const setLocked = (locked: boolean) => {
    if (month < currentMonth()) return
    setBudgets(previous => ({ ...previous, [month]: { ...previous[month], locked } }))
  }
  const saveItem = (item: FixedBudgetItem) => {
    if (budget.locked || month < currentMonth()) return false
    const existing = budget.fixed.find(value => value.id === item.id)
    const fixed = existing ? budget.fixed.map(value => value.id === item.id ? item : value) : [...budget.fixed, item]
    // Guard number precision, without imposing a product-specific amount limit.
    if (!Number.isSafeInteger(fixedTotal({ ...budget, fixed }) + foodBudget + 70000)) return false
    setBudgets(previous => ({ ...previous, [month]: { ...previous[month], fixed } }))
    return true
  }
  const view = useMemo(() => {
    if (screen === 'login' || screen === 'signup') return <Login key={screen} go={setScreen} signup={screen === 'signup'} />
    if (screen === 'home') return <Home go={setScreen} />
    if (screen === 'daily') return <Daily go={setScreen} />
    if (screen === 'monthly') return <Monthly go={setScreen} month={month} changeMonth={changeMonth} budget={budget} />
    if (screen === 'basic') return <BasicBudget go={setScreen} month={month} budget={budget} setLocked={setLocked} saveItem={saveItem} />
    if (screen === 'my') return <My go={setScreen} />
    if (screen === 'account' || screen === 'settings') return <SimpleSettings type={screen} go={setScreen} />
    return <RecordList kind={screen as ListKind} go={setScreen} />
  }, [screen, month, budget])
  return <div className="prototype"><div className="phone-frame">{view}</div></div>
}
