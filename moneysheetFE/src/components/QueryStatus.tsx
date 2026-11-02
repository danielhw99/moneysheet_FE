export default function QueryStatus({ loading, error, retry }: { loading: boolean; error: string; retry: () => void }) {
  if (error) return <div className="query-status" role="alert"><span>{error}</span><button type="button" className="text-button" onClick={retry}>다시 불러오기</button></div>
  if (loading) return <p className="query-status" role="status">불러오는 중…</p>
  return null
}
