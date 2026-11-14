import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import type { MoneySheetDataAccess } from './MoneySheetDataAccess'
import { createHttpDataAccess } from './http/createHttpDataAccess'

type AccessContext = {
  api: MoneySheetDataAccess; revision: number; pending: boolean;
  mutate: <T>(operation: (api: MoneySheetDataAccess) => Promise<T>) => Promise<T>;
}
const Context = createContext<AccessContext | null>(null)

export function DataProvider({ children, implementation }: { children: ReactNode; implementation?: MoneySheetDataAccess }) {
  const [api] = useState(() => {
    if (implementation) return implementation
    return createHttpDataAccess()
  })
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const mutate = useCallback(async <T,>(operation: (api: MoneySheetDataAccess) => Promise<T>): Promise<T> => {
    if (busy.current) throw new Error('다른 저장 작업이 진행 중이에요. 잠시 후 다시 시도해 주세요.')
    busy.current = true
    setPending(true)
    try {
      const result = await operation(api)
      setRevision(previous => previous + 1)
      return result
    } finally {
      busy.current = false
      setPending(false)
    }
  }, [api])
  return <Context.Provider value={{ api, revision, pending, mutate }}>{children}</Context.Provider>
}

export function useDataAccess() {
  const value = useContext(Context)
  if (!value) throw new Error('DataProvider가 필요합니다.')
  return value
}

export const errorMessage = (error: unknown) => error instanceof Error ? error.message : '처리하지 못했어요. 다시 시도해 주세요.'
