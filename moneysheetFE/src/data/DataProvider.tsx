import { createContext, useCallback, useMemo, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { MoneySheetDataAccess } from './MoneySheetDataAccess'
import { createHttpDataAccess } from './http/createHttpDataAccess'

type AccessContext = {
  api: MoneySheetDataAccess; revision: number; pending: boolean;
  sharedQuery: <T>(key: string, load: () => Promise<T>) => Promise<T>;
  mutate: <T>(operation: (api: MoneySheetDataAccess) => Promise<T>) => Promise<T>;
}
const Context = createContext<AccessContext | null>(null)

export function DataProvider({ children, implementation, refreshToken = 0 }: { children: ReactNode; implementation?: MoneySheetDataAccess; refreshToken?: number }) {
  const [api] = useState(() => {
    if (implementation) return implementation
    return createHttpDataAccess()
  })
  const [revision, setRevision] = useState(0)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const lastRefresh = useRef(refreshToken)
  useEffect(() => {
    if (lastRefresh.current === refreshToken) return
    lastRefresh.current = refreshToken
    setRevision(previous => previous + 1)
  }, [refreshToken])
  // A cache belongs to one provider (session) and one refresh revision.
  const shared = useMemo(() => new Map<string, Promise<unknown>>(), [revision])
  const sharedQuery = useCallback(<T,>(key: string, load: () => Promise<T>): Promise<T> => {
    const existing = shared.get(key)
    if (existing) return existing as Promise<T>
    const request = Promise.resolve().then(load)
    shared.set(key, request)
    void request.catch(() => { if (shared.get(key) === request) shared.delete(key) })
    return request
  }, [shared])
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
  return <Context.Provider value={{ api, revision, pending, mutate, sharedQuery }}>{children}</Context.Provider>
}

export function useDataAccess() {
  const value = useContext(Context)
  if (!value) throw new Error('DataProvider가 필요합니다.')
  return value
}

export const errorMessage = (error: unknown) => error instanceof Error ? error.message : '처리하지 못했어요. 다시 시도해 주세요.'
