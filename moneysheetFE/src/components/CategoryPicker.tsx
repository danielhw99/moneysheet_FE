import LoadingSpinner from './LoadingSpinner'
import { useId, useState } from 'react'
import type { Category, Direction } from '../data/models'
import { errorMessage, useDataAccess } from '../data/DataProvider'
import { useDataQuery } from '../data/useDataQuery'
import QueryStatus from './QueryStatus'

export default function CategoryPicker({ value, onChange, scope, direction, optional = true }: {
  value: string | null; onChange: (id: string | null) => void;
  scope: Category['scope']; direction?: Direction; optional?: boolean;
}) {
  const { pending, mutate } = useDataAccess()
  const query = useDataQuery(`categories:${scope}:${direction ?? ''}`, api => api.getCategories({ scope, direction }))
  const statusId = useId()
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [created, setCreated] = useState<Readonly<Category> | null>(null)
  const choices = query.data ?? []
  const displayed = created && !choices.some(item => item.id === created.id) ? [...choices, created] : choices
  const cancel = () => { setAdding(false); setName(''); setError('') }
  const add = async () => {
    if (pending) return
    if (!name.trim()) { setError('카테고리 이름을 입력해 주세요.'); return }
    try {
      const category = await mutate(api => api.createCategory({ name, scope, direction }))
      setCreated(category)
      onChange(category.id)
      cancel()
    } catch (error) { setError(errorMessage(error)) }
  }
  return <div className="category-picker">
    <label className="field"><span>카테고리{optional ? ' (선택)' : ''}</span>
      <span className="category-select-field"><select value={value ?? ''} disabled={pending || query.loading || !query.data} aria-busy={query.loading} aria-describedby={query.error ? statusId : undefined} onChange={event => {
        if (event.target.value === '__add__') { setAdding(true); return }
        onChange(event.target.value || null)
        cancel()
      }}>
        <option value="">{query.loading && !query.data ? '카테고리 불러오는 중…' : optional ? '미분류' : '카테고리 선택'}</option>
        {displayed.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        <option value="__add__">＋ 카테고리 추가</option>
      </select>{query.loading && <LoadingSpinner/>}</span>
    </label>
    {query.error && <div id={statusId} className="category-picker-status"><QueryStatus loading={false} error={query.error} retry={query.retry} /></div>}
    {adding && <fieldset className="category-add" disabled={pending}><legend>카테고리 추가</legend>
      <label className="field"><span>새 카테고리 이름</span><input autoFocus value={name} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void add() } }} /></label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" className="secondary-button" onClick={cancel}>추가 취소</button><button type="button" className="primary-button" onClick={() => void add()}>추가</button></div>
    </fieldset>}
  </div>
}
