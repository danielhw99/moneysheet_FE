import { useEffect, useRef, useState } from 'react'
import type { Category, Direction } from '../../data/models'
import type { Screen } from '../../types/navigation'
import { ApiError } from '../../api/httpClient'
import { useDataAccess, errorMessage } from '../../data/DataProvider'
import { useDataQuery } from '../../data/useDataQuery'
import Header from '../../components/Header'
import QueryStatus from '../../components/QueryStatus'
import FeedbackDialog from '../../components/FeedbackDialog'

type Props = { scope: Category['scope']; go: (screen: Screen) => void }

export function CategorySettingsScreen({ go }: { go: (screen: Screen) => void }) {
 return <main className="detail-shell category-management-screen">
  <Header title="카테고리 관리" onBack={() => go('monthly')} />
  <section className="category-management-content">
   <button className="settings-row" onClick={() => go('fixed-categories')}>고정비 카테고리<span aria-hidden="true">›</span></button>
   <button className="settings-row" onClick={() => go('transaction-categories')}>내역 카테고리<span aria-hidden="true">›</span></button>
  </section>
 </main>
}

export default function CategoryManagementScreen({ scope, go }: Props) {
 const { pending, mutate } = useDataAccess()
 const [direction, setDirection] = useState<Direction>('expense')
 const [editing, setEditing] = useState<string | null>(null)
 const [name, setName] = useState('')
 const [adding, setAdding] = useState(false)
 const [newName, setNewName] = useState('')
 const [error, setError] = useState('')
 const [deleteTarget,setDeleteTarget]=useState<Readonly<Category>|null>(null)
 const content=useRef<HTMLElement>(null)
 const filter = { scope, ...(scope === 'mainTransaction' ? { direction } : {}) }
 const query = useDataQuery(`category-management:${scope}:${scope === 'mainTransaction' ? direction : ''}`, api => api.getCategories(filter))
 useEffect(() => {
  if (editing && !query.loading && !query.error && query.data && !query.data.some(item => item.id === editing)) {
   setEditing(null)
   setName('')
   setError('')
  }
 }, [editing, query.data, query.loading, query.error])
 const blocked = pending || query.loading || !!query.error
 const rows = [...(query.data ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'ko') || a.id.localeCompare(b.id))
 const reset = () => { setEditing(null); setName(''); setAdding(false); setNewName(''); setError('') }
 const validName = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed || [...trimmed].length > 100 || [...trimmed.toLowerCase()].length > 100) throw new Error('카테고리 이름은 1~100자로 입력해 주세요.')
  return trimmed
 }
 const fail = (failure: unknown) => setError(failure instanceof ApiError
  ? failure.fieldErrors.find(item => item.field === 'name')?.message ?? errorMessage(failure)
  : errorMessage(failure))
 const save = async (event: React.FormEvent) => {
  event.preventDefault()
  if (blocked) return
  setError('')
  try {
   if (editing) await mutate(api => api.updateCategory(editing, { name: validName(name) }))
   else await mutate(api => api.createCategory({ ...filter, name: validName(newName) }))
   reset()
  } catch (failure) { fail(failure) }
 }
 const remove = async (item: Readonly<Category>) => {
  if (blocked) throw new Error('목록 확인이 끝난 뒤 다시 시도해 주세요.')
  setError('')
  try { await mutate(api => api.deleteCategory(item.id)); reset() }
  catch (failure) { fail(failure); throw failure }
 }
 return <main className="detail-shell category-management-screen">
  <Header title={scope === 'fixedBudget' ? '고정비 카테고리' : '내역 카테고리'} onBack={() => { if (!pending) go('categories') }} />
  <section className="category-management-content" ref={content} tabIndex={-1} aria-label="카테고리 관리 영역">
   {scope === 'mainTransaction' && <div className="category-direction-tabs" role="tablist" aria-label="내역 카테고리 구분">
    {(['expense', 'income'] as const).map(value => <button key={value} type="button" role="tab" aria-selected={direction === value} disabled={pending}
     onClick={() => { setDirection(value); reset() }}>{value === 'expense' ? '지출' : '입금'}</button>)}
   </div>}
   <QueryStatus {...query} quietLoading={!!query.data} />
   {!adding && !editing && <button type="button" className="primary-button" disabled={blocked} onClick={() => { reset(); setAdding(true) }}>카테고리 추가</button>}
   {adding && <form onSubmit={save} noValidate>
    <fieldset className="form-fields" disabled={blocked}>
     <label className="field"><span>새 카테고리 이름</span><input autoFocus value={newName} aria-describedby={error ? 'category-management-error' : undefined} onChange={event => { setNewName(event.target.value); setError('') }} /></label>
     <div className="form-actions"><button type="button" className="secondary-button" onClick={reset}>취소</button><button className="primary-button" type="submit">추가</button></div>
    </fieldset>
   </form>}
   {error && <div className="category-action-error"><p id="category-management-error" role="alert" className="field-error">{error}</p><button type="button" className="text-button" disabled={pending} onClick={query.retry}>목록 새로고침</button></div>}
   {!query.loading && !query.error && rows.length === 0 && <p className="record-empty">등록한 카테고리가 없습니다.</p>}
   <ul className="category-management-list">
    {rows.map(item => <li key={item.id}>
     {editing === item.id ? <form onSubmit={save} noValidate><fieldset className="form-fields" disabled={blocked}>
      <label className="field"><span>카테고리 이름 수정</span><input autoFocus value={name} aria-describedby={error ? 'category-management-error' : undefined} onChange={event => { setName(event.target.value); setError('') }} /></label>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={reset}>취소</button><button type="submit" className="primary-button">저장</button></div>
     </fieldset></form> : <div className="category-management-row"><span>{item.name}</span><div>
      <button type="button" className="text-button" disabled={blocked} aria-label={`${item.name} 수정`} onClick={() => { reset(); setEditing(item.id); setName(item.name) }}>수정</button>
      <button type="button" className="text-button delete-button" disabled={blocked} aria-label={`${item.name} 삭제`} onClick={() => setDeleteTarget(item)}>삭제</button>
     </div></div>}
    </li>)}
   </ul>
  </section>
  <FeedbackDialog open={deleteTarget!==null} mode="confirm" title="카테고리 삭제" description={deleteTarget?`‘${deleteTarget.name}’\n해당 카테고리가 삭제됩니다.`:''}
   confirmLabel="삭제" danger confirmDisabled={blocked} onConfirm={()=>deleteTarget?remove(deleteTarget):undefined} onClose={()=>setDeleteTarget(null)} fallbackFocusRef={content} focusAfterConfirm="fallback"/>
 </main>
}
