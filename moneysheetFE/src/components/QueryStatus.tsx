export default function QueryStatus({ loading, error, retry, quietLoading = false }: { loading: boolean; error: string; retry: () => void; quietLoading?: boolean }) {
  if (error) return <div className="query-status" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={retry}>다시 불러오기</button></div>
  if (loading) return <p className={quietLoading ? 'query-status query-status-loading' : 'query-status'} role="status">불러오는 중…</p>
  return null
}
