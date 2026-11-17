import { OnboardingProvider, useOnboarding } from './features/onboarding/OnboardingProvider'
import GuideDialog from './features/onboarding/GuideDialog'
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
import Home from './features/home/HomeScreen'
import Daily from './features/daily/DailyScreen'
import Monthly from './features/monthly/MonthlyScreen'
import RecordList from './features/records/RecordList'
import BottomNav from './components/BottomNav'
import QueryStatus from './components/QueryStatus'
import { useDataQuery } from './data/useDataQuery'
import { currentMonth } from './utils/date'

function Screens() {
  const [screen, setScreen] = useState<Screen>('home')
  const [recordDate, setRecordDate] = useState(() => localDateValue(new Date()))
  const [budgetLocks, setBudgetLocks] = useState<Record<string, boolean>>({})
  const { pending } = useDataAccess()
  const auth = useAuth(), guide = useOnboarding(), month = recordDate.slice(0, 7)
  const readiness = useDataQuery(`workspace-budget:${month}`, api => api.getBudget(month))
  const go = (next: Screen, menu = false) => {
    if (pending || next === 'login' || next === 'signup') return
    if (menu && (next === 'daily' || next === 'monthly')) setRecordDate(localDateValue(new Date()))
    setScreen(next)
  }
  const changeDate = (date: string) => { if (!pending) setRecordDate(date) }
  const changeMonth = (offset: number) => {
    if (pending) return
    const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + offset, 1)
    const next = localDateValue(date).slice(0, 7)
    if (next <= currentMonth()) changeDate(next + '-01')
  }
  const basic = <BasicBudget key={month} go={go} month={month} locked={budgetLocks[month] ?? true} setLocked={locked => setBudgetLocks(previous => ({ ...previous, [month]: locked }))} />
  const business = !['my','account','settings'].includes(screen)
  let view: React.ReactNode, ownNavigation = false
  if (screen === 'my') { view = <My go={go} />; ownNavigation = true }
  else if (screen === 'account' || screen === 'settings') view = <SimpleSettings type={screen} go={go} />
  else if (business && readiness.lastErrorCode === 'BUDGET_NOT_READY' && month === currentMonth()) view = basic
  else if (business && (!readiness.data || (readiness.error && screen !== 'basic'))) view = <main className="detail-shell workspace-status">
    <h1>자금 현황</h1><div className="sub-month"><button disabled={pending} onClick={() => changeMonth(-1)} aria-label="이전 월">◀</button><span>{month}</span><button disabled={pending || month >= currentMonth()} onClick={() => changeMonth(1)} aria-label="다음 월">▶</button></div>
    {readiness.errorCode === 'BUDGET_NOT_READY' ? <><p className="notice">이 월에는 완료된 예산이 없어요. 이번 달 예산을 먼저 설정해 주세요.</p><button className="primary-button" onClick={() => { changeDate(localDateValue(new Date())); go('basic') }}>이번 달 예산 설정</button></> : <QueryStatus {...readiness} />}
  </main>
  else if (screen === 'basic') view = basic
  else if (screen === 'home') { view = <Home go={go} month={month} changeMonth={changeMonth} selectedDate={recordDate} selectDate={changeDate} />; ownNavigation = true }
  else if (screen === 'daily') { view = <Daily key={recordDate} go={go} date={recordDate} changeDate={changeDate} />; ownNavigation = true }
  else if (screen === 'monthly') { view = <Monthly go={go} month={month} changeMonth={changeMonth} />; ownNavigation = true }
  else if (screen === 'transactions' || screen === 'memos' || screen === 'fixed-pay' || screen === 'income' || screen === 'extra') view = <RecordList key={`${screen}:${recordDate}`} kind={screen} go={go} date={recordDate} changeDate={changeDate} />
  const navScreen = screen === 'basic' || screen === 'income' || screen === 'extra' ? 'monthly' : screen === 'transactions' || screen === 'memos' || screen === 'fixed-pay' ? 'daily' : screen
  return <div className="prototype"><div className="phone-frame signed-in-frame">
    <nav className="session-note" aria-label="업무 메뉴"><button disabled={pending} onClick={() => go('basic')}>예산</button> · <button disabled={pending} onClick={() => go('monthly')}>월 선택</button> · <button disabled={pending} aria-label="계정 메뉴" onClick={() => go('my')}>MY</button> · <button onClick={guide?.openGuide}>사용 가이드</button></nav>
    {auth.notice && <p className="session-note" role="status">{auth.notice}</p>}
    <div className={`workspace-content ${ownNavigation ? '' : 'with-workspace-nav'}`}>{view}{!ownNavigation && <BottomNav screen={navScreen} go={go} />}</div>
    <GuideDialog />
  </div></div>
}

function AuthGate() {
  const auth = useAuth()
  const [screen, setScreen] = useState<'login' | 'signup'>('login')
  if (auth.initializing) return <div className="prototype"><div className="phone-frame"><main className="auth-screen"><p role="status">로그인 상태를 확인하고 있어요…</p></main></div></div>
  if (auth.bootstrapError) return <div className="prototype"><div className="phone-frame"><main className="auth-screen"><p role="alert">{auth.bootstrapError}</p><button className="primary-button" onClick={auth.retry}>다시 확인</button></main></div></div>
  if (!auth.profile) return <div className="prototype"><div className="phone-frame"><Login key={screen} signup={screen === 'signup'} go={next => { if (next === 'login' || next === 'signup') setScreen(next) }} /></div></div>
  return <DataProvider key={auth.sessionKey} refreshToken={auth.validationRevision}><OnboardingProvider userId={auth.profile.id}><Screens /></OnboardingProvider></DataProvider>
}
export default function App({ authApi }: { authApi?: AuthApi } = {}) {
  return <AuthProvider api={authApi}><AuthGate /></AuthProvider>
}
