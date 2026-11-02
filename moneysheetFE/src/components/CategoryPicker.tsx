import { useState } from 'react'
import type { Category, Direction } from '../moneyRecords'

export type AddCategory = (name: string, scope: Category['scope'], direction?: Direction) => Category | null

export default function CategoryPicker({ categories, value, onChange, onAdd, scope, direction, optional = true }: {
  categories: Category[]; value: string | null; onChange: (id: string | null) => void;
  onAdd: AddCategory; scope: Category['scope']; direction?: Direction; optional?: boolean;
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const choices = categories.filter(item => item.scope === scope && (scope !== 'mainTransaction' || item.direction === direction))
  const cancel = () => { setAdding(false); setName(''); setError('') }
  const add = () => {
    const category = onAdd(name, scope, direction)
    if (!category) { setError('카테고리 이름을 입력해 주세요.'); return }
    onChange(category.id)
    cancel()
  }
  return <div className="category-picker">
    <label className="field"><span>카테고리{optional ? ' (선택)' : ''}</span>
      <select value={value ?? ''} onChange={event => {
        if (event.target.value === '__add__') { setAdding(true); return }
        onChange(event.target.value || null)
        cancel()
      }}>
        <option value="">{optional ? '미분류' : '카테고리 선택'}</option>
        {choices.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        <option value="__add__">＋ 카테고리 추가</option>
      </select>
    </label>
    {adding && <fieldset className="category-add"><legend>카테고리 추가</legend>
      <label className="field"><span>새 카테고리 이름</span><input autoFocus value={name} onChange={event => setName(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); add() } }} /></label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="form-actions"><button type="button" className="secondary-button" onClick={cancel}>추가 취소</button><button type="button" className="primary-button" onClick={add}>추가</button></div>
    </fieldset>}
  </div>
}
