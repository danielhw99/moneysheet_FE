import { useState } from 'react'
import type { Screen } from './types/navigation'
import Login from './features/auth/AuthScreen'
import Home from './features/home/HomeScreen'
import My from './features/account/MyScreen'
import SimpleSettings from './features/account/SettingsScreen'
import Daily from './features/daily/DailyScreen'
import Monthly from './features/monthly/MonthlyScreen'
import BasicBudget from './features/budget/BasicBudgetScreen'
import RecordList from './features/records/RecordList'
import { localDateValue } from './utils/date'
import { DataProvider, useDataAccess } from './data/DataProvider'
import type { ListKind } from './data/models'
import { AuthProvider, useAuth } from './features/auth/AuthProvider'
import type { AuthApi } from './features/auth/authApi'

function Screens() {
  const [screen, setScreen] = useState<Screen>('home')
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
  if (screen === 'home') view = <Home go={go} month={month} changeMonth={changeMonth} selectedDate={recordDate} selectDate={changeDate} />
  else if (screen === 'daily') view = <Daily go={go} date={recordDate} />
  else if (screen === 'monthly') view = <Monthly go={go} month={month} changeMonth={changeMonth} />
  else if (screen === 'basic') view = <BasicBudget key={month} go={go} month={month} locked={budgetLocks[month] ?? true} setLocked={locked => setBudgetLocks(previous => ({ ...previous, [month]: locked }))} />
  else if (screen === 'my') view = <My go={go} />
  else if (screen === 'account' || screen === 'settings') view = <SimpleSettings type={screen} go={go} />
  else view = <RecordList key={screen} kind={screen as ListKind} go={go} date={recordDate} changeDate={changeDate} />
  return <div className="prototype"><div className="phone-frame signed-in-frame">
    <p className="session-note" role="status">생활비 데이터는 개발용 예시예요. 저장되지 않으며 다시 로그인하면 초기화돼요.</p>
    {auth.notice && <p className="session-note" role="status">{auth.notice}</p>}
    <div className="workspace-content">{view}</div>
  </div></div>
}

function ProductionAccount() {
  const auth = useAuth()
  const [screen, setScreen] = useState<'my' | 'account' | 'settings'>('my')
  const go = (next: Screen) => { if (next === 'my' || next === 'account' || next === 'settings') setScreen(next) }
  return <div className="prototype"><div className="phone-frame signed-in-frame">
    <p className="session-note" role="status">생활비 기능은 준비 중이에요.</p>
    {auth.notice && <p className="session-note" role="status">{auth.notice}</p>}
    <div className="workspace-content">{screen === 'my' ? <My go={go} showNavigation={false} /> : <SimpleSettings type={screen} go={go} />}</div>
  </div></div>
}

function AuthGate() {
  const auth = useAuth()
  const [screen, setScreen] = useState<'login' | 'signup'>('login')
  if (auth.initializing) return <div className="prototype"><div className="phone-frame"><main className="auth-screen"><p role="status">로그인 상태를 확인하고 있어요…</p></main></div></div>
  if (auth.bootstrapError) return <div className="prototype"><div className="phone-frame"><main className="auth-screen"><p role="alert">{auth.bootstrapError}</p><button className="primary-button" onClick={auth.retry}>다시 확인</button></main></div></div>
  if (!auth.profile) return <div className="prototype"><div className="phone-frame"><Login key={screen} signup={screen === 'signup'} go={next => { if (next === 'login' || next === 'signup') setScreen(next) }} /></div></div>
  if (!import.meta.env.DEV) return <ProductionAccount key={auth.sessionKey} />
  return <DataProvider key={auth.sessionKey}><Screens /></DataProvider>
}
export default function App({ authApi }: { authApi?: AuthApi } = {}) {
  return <AuthProvider api={authApi}><AuthGate /></AuthProvider>
}
