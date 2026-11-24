import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Stage = 'unseen' | 'setup' | 'overview' | 'done' | 'skipped'
type Guide = { welcomeSeen: boolean; startSetup: () => void; stage: Stage; guideOpen: boolean; beginSetup: (copied: boolean) => void; finishSetup: () => void; skip: () => void; openGuide: () => void; closeGuide: (completed: boolean) => void }
const Context = createContext<Guide | null>(null)
export const useOnboarding = () => useContext(Context)
const states: readonly string[] = ['unseen', 'setup', 'overview', 'done', 'skipped']
function read(key: string): Stage {
  try { const value = localStorage.getItem(key); return value && states.includes(value) ? value as Stage : 'unseen' }
  catch { return 'unseen' }
}

// Only non-sensitive guide progress is stored here. Budget readiness remains server-owned.
function Progress({ userId, children }: { userId: string; children: ReactNode }) {
  const key = `moneysheet:onboarding:v1:${userId}`
  const [stage, setStage] = useState<Stage>(() => read(key))
  const [welcomeSeen,setWelcomeSeen]=useState(()=>{try{return localStorage.getItem(key+':welcome')==='seen'}catch{return false}})
  const startSetup=useCallback(()=>{setWelcomeSeen(true);try{localStorage.setItem(key+':welcome','seen')}catch{/* Memory state still works. */}},[key])
  const [replay, setReplay] = useState(false)
  useEffect(() => { try { localStorage.setItem(key, stage) } catch { /* The guide still works in memory. */ } }, [key, stage])
  const beginSetup = useCallback((copied: boolean) => setStage(previous => previous === 'unseen' ? copied ? 'done' : 'setup' : previous), [])
  const finishSetup = useCallback(() => setStage(previous => previous === 'setup' ? 'overview' : previous), [])
  const skip = useCallback(() => setStage('skipped'), [])
  const openGuide = useCallback(() => setReplay(true), [])
  const closeGuide = useCallback((completed: boolean) => {
    setReplay(false)
    setStage(previous => previous === 'overview' ? completed ? 'done' : 'skipped' : previous)
  }, [])
  const value = useMemo(() => ({ welcomeSeen,startSetup,stage, guideOpen: replay || stage === 'overview', beginSetup, finishSetup, skip, openGuide, closeGuide }), [welcomeSeen,startSetup,stage, replay, beginSetup, finishSetup, skip, openGuide, closeGuide])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export function OnboardingProvider({ userId, children }: { userId: string; children: ReactNode }) {
  return <Progress key={userId} userId={userId}>{children}</Progress>
}
