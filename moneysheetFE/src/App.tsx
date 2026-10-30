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
  { title: '점심 · 샐러드', amount: '-11,000원', tone: 'blue' },
  { title: '편의점', amount: '-4,500원', tone: 'blue' },
  { title: '중고거래 입금', amount: '+20,000원', tone: 'green' },
]
const memos = [
  { title: '친구 정산', amount: '-45,000원' },
  { title: '유튜브 보전금', amount: '-14,900원' },
  { title: '아빠 용돈', amount: '+50,000원' },
]

function Login({ go, signup = false }: { go: (s: Screen) => void; signup?: boolean }) {
  return (
    <main className="auth-screen">
      <div className="brand-mark"><Icon name="wallet" size={26} /></div>
      <div className="brand">moneysheet</div>
      <p className="auth-copy">{signup ? '나만의 월간 생활비 관리를 시작하세요.' : '오늘의 여유를 한눈에 확인하세요.'}</p>
      <div className="form-stack">
        <label className="field"><span>이메일</span><input type="email" placeholder="name@example.com" /></label>
        {signup && <label className="field"><span>닉네임</span><input placeholder="닉네임 입력" /></label>}
        <label className="field"><span>비밀번호</span><input type="password" placeholder="8자 이상 입력" /></label>
        {signup && <label className="policy"><input type="checkbox" /> <span>개인정보처리방침을 확인했으며 동의합니다.</span></label>}
        <button className="primary-button" onClick={() => go(signup ? 'login' : 'home')}>{signup ? '가입하기' : '로그인'}</button>
      </div>
      <button className="text-button" onClick={() => go(signup ? 'login' : 'signup')}>
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
          <span><i className="dot blue" />사용내역</span><span><i className="dot red" />고정지출</span>
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
          <MiniList title="사용내역" onOpen={() => go('transactions')} addLabel="내역 추가" onAdd={() => go('transactions')}>
            {entries.map((item) => <button className="compact-row" key={item.title} onClick={() => go('transactions')}><span className="truncate">{item.title}</span><b className={item.tone}>{item.amount}</b></button>)}
          </MiniList>
          <MiniList title="메모" onOpen={() => go('memos')} addLabel="메모 추가" onAdd={() => go('memos')}>
            {memos.map((item, i) => <div className="memo-row" key={item.title}><button className="checkbox" aria-label={`${item.title} 완료`}>{i === 2 && <Icon name="check" size={13} />}</button><button className="memo-main" onClick={() => go('memos')}><span className="truncate">{item.title}</span><b>{item.amount}</b></button></div>)}
          </MiniList>
        </div>
        <section className="fixed-panel">
          <button className="panel-heading" onClick={() => go('fixed-pay')}><strong>고정지출</strong><Icon name="chevron" size={17} /></button>
          <div className="fixed-scroll">
            <button className="fixed-row" onClick={() => go('fixed-pay')}><span><b>월세</b><small>잔여 200,000원</small></span><strong>600,000원</strong></button>
            <button className="fixed-row" onClick={() => go('fixed-pay')}><span><b>휴대폰 요금</b><small className="complete">지급 완료</small></span><strong>59,000원</strong></button>
          </div>
          <button className="panel-add" onClick={() => go('fixed-pay')}><Icon name="plus" size={16} />지급 기록</button>
        </section>
      </section>
      <BottomNav screen="daily" go={go} />
    </main>
  )
}

const monthlySections = [
  { title: '기본지출', desc: '고정지출 + 식비 예산', amount: '1,180,000원', target: 'basic' as Screen },
  { title: '그 외 지출', desc: '저축계좌 출금', amount: '70,000원', target: 'extra' as Screen },
  { title: '수입', desc: '이번 달 수동 입력', amount: '4,000,000원', target: 'income' as Screen },
]

function Monthly({ go }: { go: (s: Screen) => void }) {
  return (
    <main className="app-shell">
      <section className="screen-content">
        <div className="month-head monthly-head">
          <button className="icon-button" aria-label="이전 달"><Icon name="back" /></button>
          <button className="month-picker">2026년 10월 <span className="down-caret">⌄</span></button>
          <button className="icon-button flip" aria-label="다음 달"><Icon name="back" /></button>
        </div>
        <div className="monthly-list">
          {monthlySections.map((item) => (
            <button className="monthly-card" key={item.title} onClick={() => go(item.target)}>
              <span className={`section-icon ${item.title === '수입' ? 'income' : item.title === '그 외 지출' ? 'extra' : ''}`}><Icon name={item.title === '기본지출' ? 'wallet' : item.title === '수입' ? 'plus' : 'monthly'} size={19} /></span>
              <span className="monthly-copy"><b>{item.title}</b><small>{item.desc}</small></span>
              <strong>{item.amount}</strong><Icon name="chevron" size={17} />
            </button>
          ))}
        </div>
        <section className="status-card">
          <div className="status-title"><span>이번 달 현황</span><small>예산 기준</small></div>
          <dl><div><dt>총수입</dt><dd>4,000,000원</dd></div><div><dt>총지출</dt><dd>1,250,000원</dd></div><div className="net"><dt>순증감</dt><dd>+2,750,000원</dd></div></dl>
          <p>순증감은 월 수입에서 총지출을 뺀 금액이에요.</p>
        </section>
      </section>
      <BottomNav screen="monthly" go={go} />
    </main>
  )
}

function BasicBudget({ go }: { go: (s: Screen) => void }) {
  const [locked, setLocked] = useState(true)
  const fixed = [
    ['월세', '잔여 200,000원', '800,000'],
    ['휴대폰 요금', '완료', '59,000'],
    ['구독 서비스', '잔여 12,900원', '12,900'],
    ['보험료', '잔여 80,000원', '80,000'],
    ['고정여유비', '필수 · 1일 자동 반영', '120,000'],
  ]
  return (
    <main className="detail-shell">
      <Header title="기본지출" onBack={() => go('monthly')} right={<button className={`lock-button ${locked ? 'locked' : ''}`} onClick={() => setLocked(!locked)}><Icon name={locked ? 'lock' : 'unlock'} size={17} /></button>} />
      <div className="sub-month">2026.10 <span>{locked ? '예산 잠금' : '편집 중'}</span></div>
      <p className="notice">{locked ? '잠금을 해제하면 이번 달 예산을 수정할 수 있어요.' : '수정한 값은 10월 전체에 적용됩니다.'}</p>
      <div className="budget-columns">
        <section className="budget-column">
          <div className="column-head"><b>고정지출</b><span>합계 <strong>1,071,900원</strong></span></div>
          <div className="column-scroll">
            {fixed.map(([title, state, amount]) => <button className="budget-row" key={title}><span><b className="truncate">{title}</b><small className={state === '완료' ? 'complete' : ''}>{state}</small></span><strong>{amount}</strong></button>)}
          </div>
          <button className="panel-add" disabled={locked}><Icon name="plus" size={16} />항목 추가</button>
        </section>
        <section className="budget-column food-column">
          <div className="column-head"><b>식비</b><span>월 합계 <strong>328,000원</strong></span></div>
          <div className="column-scroll">
            {['주중|11,000', '토요일|18,000', '일요일|15,000'].map((row) => {
              const [label, value] = row.split('|')
              return <label className="budget-input" key={label}><span>{label}</span><div><input disabled={locked} defaultValue={value} /><b>원</b></div></label>
            })}
            <div className="periods">
              <span><small>1차</small><b>1~11일</b><strong>99,000원</strong></span>
              <span><small>2차</small><b>12~21일</b><strong>95,000원</strong></span>
              <span><small>3차</small><b>22일~말일</b><strong>134,000원</strong></span>
            </div>
          </div>
        </section>
      </div>
      <button className="primary-button bottom-action" disabled={locked} onClick={() => setLocked(true)}>저장</button>
    </main>
  )
}

type ListKind = 'transactions' | 'memos' | 'fixed-pay' | 'income' | 'extra'
const listConfig = {
  transactions: { title: '사용내역', total: '지출 15,500원 · 입금 20,000원', add: '거래 추가' },
  memos: { title: '메모', total: '미완료 보정 -9,900원', add: '메모 추가' },
  'fixed-pay': { title: '고정지출 지급', total: '10월 지급 659,000원', add: '지급 기록 추가' },
  income: { title: '수입', total: '월 합계 4,000,000원', add: '수입 추가' },
  extra: { title: '그 외 지출', total: '월 합계 70,000원', add: '지출 추가' },
}

function RecordList({ kind, go }: { kind: ListKind; go: (s: Screen) => void }) {
  const [editing, setEditing] = useState(false)
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
          {rows.map((item, i) => <button className="record-row" key={item.title} onClick={() => setEditing(true)}>
            <span className="record-date">{kind === 'income' || kind === 'extra' ? `${i + 2}일` : kind === 'memos' ? <i className="empty-check" /> : '10:30'}</span>
            <span className="record-title"><b>{item.title}</b><small>{kind === 'fixed-pay' ? (i ? '지급 완료' : '잔여 200,000원') : '생활 · 일반'}</small></span>
            <strong>{item.amount}</strong><Icon name="chevron" size={16} />
          </button>)}
        </div>
        <div className="list-total"><span>{cfg.total.split(' ')[0]}</span><strong>{cfg.total.substring(cfg.total.indexOf(' ') + 1)}</strong></div>
        <button className="primary-button bottom-action" onClick={() => setEditing(true)}><Icon name="plus" size={18} />{cfg.add}</button>
      </> : <RecordForm kind={kind} onCancel={() => setEditing(false)} />}
    </main>
  )
}

function RecordForm({ kind, onCancel }: { kind: ListKind; onCancel: () => void }) {
  const isMemo = kind === 'memos'
  const isFixed = kind === 'fixed-pay'
  return (
    <div className="record-form">
      {(kind === 'transactions' || isMemo) && <div className="segment wide"><button className="active">{isMemo ? '임시 출금' : '지출'}</button><button>{isMemo ? '임시 입금' : '입금'}</button></div>}
      <label className="field"><span>날짜 · 시간</span><input defaultValue="2026.10.02  10:30" /></label>
      {isFixed && <>
        <label className="field"><span>고정지출 예산 항목</span><select defaultValue="월세"><option>월세</option><option>휴대폰 요금</option></select></label>
        <div className="read-only-pair"><span>항목 예산<b>800,000원</b></span><span>누적 지급<b>600,000원</b></span></div>
      </>}
      {kind === 'transactions' && <label className="field"><span>카테고리</span><select defaultValue="식비"><option>식비</option><option>생활</option><option>교통</option></select></label>}
      <label className="field"><span>{isFixed ? '이번 지급액' : '금액'}</span><div className="money-input"><input defaultValue={isFixed ? '200,000' : '45,000'} inputMode="numeric" /><b>원</b></div></label>
      {!isFixed && <label className="field"><span>내용</span><input defaultValue={isMemo ? '친구 정산' : kind === 'income' ? '급여' : '점심 식사'} /></label>}
      {isMemo && <label className="policy"><input type="checkbox" /> <span>완료 상태로 저장</span></label>}
      <p className="form-help">{isMemo ? '메모는 Main 잔액에만 반영되며 여유비에는 영향을 주지 않아요.' : isFixed ? '잔여 예산은 저장 후 자동으로 계산돼요.' : '입금은 Main 잔액에만 반영돼요.'}</p>
      <div className="form-actions"><button className="secondary-button" onClick={onCancel}>취소</button><button className="primary-button" onClick={onCancel}>저장</button></div>
      <button className="delete-button" onClick={onCancel}>기존 기록 삭제</button>
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
  const view = useMemo(() => {
    if (screen === 'login' || screen === 'signup') return <Login go={setScreen} signup={screen === 'signup'} />
    if (screen === 'home') return <Home go={setScreen} />
    if (screen === 'daily') return <Daily go={setScreen} />
    if (screen === 'monthly') return <Monthly go={setScreen} />
    if (screen === 'basic') return <BasicBudget go={setScreen} />
    if (screen === 'my') return <My go={setScreen} />
    if (screen === 'account' || screen === 'settings') return <SimpleSettings type={screen} go={setScreen} />
    return <RecordList kind={screen as ListKind} go={setScreen} />
  }, [screen])
  return <div className="prototype"><div className="phone-frame">{view}</div></div>
}
