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

function Screens() {
  const [screen, setScreen] = useState<Screen>('login')
  const [recordDate, setRecordDate] = useState(() => localDateValue(new Date()))
  const [budgetLocks, setBudgetLocks] = useState<Record<string, boolean>>({})
  const { pending } = useDataAccess()
  const month = recordDate.slice(0, 7)
  const go = (next: Screen) => { if (!pending) setScreen(next) }
  const changeDate = (date: string) => { if (!pending) setRecordDate(date) }
  const changeMonth = (offset: number) => {
    const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + offset, 1)
    const next = localDateValue(date).slice(0, 7)
    changeDate(recordDate.slice(0, 7) === next ? recordDate : next + '-01')
  }
  let view: React.ReactNode
  if (screen === 'login' || screen === 'signup') view = <Login key={screen} go={go} signup={screen === 'signup'} />
  else if (screen === 'home') view = <Home go={go} month={month} changeMonth={changeMonth} selectedDate={recordDate} selectDate={changeDate} />
  else if (screen === 'daily') view = <Daily go={go} date={recordDate} />
  else if (screen === 'monthly') view = <Monthly go={go} month={month} changeMonth={changeMonth} />
  else if (screen === 'basic') view = <BasicBudget key={month} go={go} month={month} locked={budgetLocks[month] ?? true} setLocked={locked => setBudgetLocks(previous => ({ ...previous, [month]: locked }))} />
  else if (screen === 'my') view = <My go={go} />
  else if (screen === 'account' || screen === 'settings') view = <SimpleSettings type={screen} go={go} />
  else view = <RecordList key={screen} kind={screen as ListKind} go={go} date={recordDate} changeDate={changeDate} />
  return <div className="prototype"><div className="phone-frame">{view}</div></div>
}

export default function App() {
  return <DataProvider><Screens /></DataProvider>
}
