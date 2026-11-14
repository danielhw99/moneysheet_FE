import { useState } from 'react'
import type { Screen } from './types/navigation'
import Login from './features/auth/AuthScreen'
import My from './features/account/MyScreen'
import SimpleSettings from './features/account/SettingsScreen'
import BasicBudget from './features/budget/BasicBudgetScreen'
import { localDateValue } from './utils/date'
import { DataProvider, useDataAccess } from './data/DataProvider'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import type { AuthApi } from './features/auth/authApi'

function Screens() {
  const [screen, setScreen] = useState<Screen>('basic')
  const [recordDate, setRecordDate] = useState(() => localDateValue(new Date()))
  const [budgetLocks, setBudgetLocks] = useState<Record<string, boolean>>({})
  const { pending } = useDataAccess()
  const auth = useAuth()
  const month = recordDate.slice(0, 7)
  const go = (next: Screen) => { if (!pending && next !== 'login' && next !== 'signup') setScreen(next) }
  const changeDate = (date: string) => { if (!pending) setRecordDate(date) }
  const changeMonth = (offset: number) => {
    const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + offset, 1)
    const next = localDateValue(date).slice(0, 7)
    changeDate(recordDate.slice(0, 7) === next ? recordDate : next + '-01')
  }
  let view: React.ReactNode
  if (screen === 'basic') view = <BasicBudget key={month} go={go} month={month} locked={budgetLocks[month] ?? true} setLocked={locked => setBudgetLocks(previous => ({ ...previous, [month]: locked }))} />
  else if (screen === 'my') view = <My go={go} showNavigation={false} />
  else if (screen === 'account' || screen === 'settings') view = <SimpleSettings type={screen} go={go} />
  else view = <main className="detail-shell"><h1>자금 현황</h1><p className="notice">내역·메모·자금 현황의 서버 연결은 준비 중이에요. 현재는 예산 관리만 사용할 수 있어요.</p><div className="sub-month"><button disabled={pending} onClick={() => changeMonth(-1)} aria-label="이전 월">◀</button><span>{month}</span><button disabled={pending} onClick={() => changeMonth(1)} aria-label="다음 월">▶</button></div><button className="primary-button" onClick={() => go('basic')}>선택한 월 예산 보기</button></main>
  return <div className="prototype"><div className="phone-frame signed-in-frame">
    <nav className="session-note" aria-label="업무 메뉴"><button disabled={pending} onClick={() => go('basic')}>예산</button> · <button disabled={pending} onClick={() => go('monthly')}>월 선택</button> · <button disabled={pending} onClick={() => go('my')}>MY</button></nav>
    {auth.notice && <p className="session-note" role="status">{auth.notice}</p>}
    <div className="workspace-content">{view}</div>
  </div></div>
}

function AuthGate() {
  const auth = useAuth()
  const [screen, setScreen] = useState<'login' | 'signup'>('login')
  if (auth.initializing) return <div className="prototype"><div className="phone-frame"><main className="auth-screen"><p role="status">로그인 상태를 확인하고 있어요…</p></main></div></div>
  if (auth.bootstrapError) return <div className="prototype"><div className="phone-frame"><main className="auth-screen"><p role="alert">{auth.bootstrapError}</p><button className="primary-button" onClick={auth.retry}>다시 확인</button></main></div></div>
  if (!auth.profile) return <div className="prototype"><div className="phone-frame"><Login key={screen} signup={screen === 'signup'} go={next => { if (next === 'login' || next === 'signup') setScreen(next) }} /></div></div>
  return <DataProvider key={auth.sessionKey} refreshToken={auth.validationRevision}><Screens /></DataProvider>
}
export default function App({ authApi }: { authApi?: AuthApi } = {}) {
  return <AuthProvider api={authApi}><AuthGate /></AuthProvider>
}
