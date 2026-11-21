import LoadingStatus from './LoadingStatus'

export default function QueryStatus({ loading, error, retry, quietLoading = false }: { loading: boolean; error: string; retry: () => void; quietLoading?: boolean }) {
  if (error) return <div className="query-status" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={retry}>다시 불러오기</button></div>
  if (loading) return <LoadingStatus quiet={quietLoading} className={quietLoading ? 'query-status query-status-loading' : 'query-status'}/>
  return null
}
