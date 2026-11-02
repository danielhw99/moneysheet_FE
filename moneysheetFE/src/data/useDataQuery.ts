import { useEffect, useRef, useState } from 'react'
import type { MoneySheetDataAccess } from './MoneySheetDataAccess'
import { errorMessage, useDataAccess } from './DataProvider'

export function useDataQuery<T>(key: string, load: (api: MoneySheetDataAccess) => Promise<T>) {
  const { api, revision } = useDataAccess()
  const [attempt, setAttempt] = useState(0)
  const identity = JSON.stringify([key, revision, attempt])
  const loader = useRef(load)
  const [state, setState] = useState<{ key: string; identity: string; data?: T; loading: boolean; error: string }>({ key: '', identity: '', loading: true, error: '' })
  useEffect(() => {
    loader.current = load
  })
  useEffect(() => {
    let active = true
    const request = loader.current
    setState(previous => ({ key, identity, data: previous.key === key ? previous.data : undefined, loading: true, error: '' }))
    Promise.resolve().then(() => request(api)).then(data => {
      if (active) setState({ key, identity, data, loading: false, error: '' })
    }).catch(error => {
      if (active) setState(previous => ({ ...previous, key, identity, loading: false, error: errorMessage(error) }))
    })
    // Old screen/date/month responses must never replace the current query.
    return () => { active = false }
  }, [api, key, identity])
  return {
    data: state.key === key ? state.data : undefined,
    loading: state.identity !== identity || state.loading,
    error: state.identity === identity ? state.error : '',
    retry: () => setAttempt(previous => previous + 1),
  }
}
