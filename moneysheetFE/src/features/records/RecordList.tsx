import { useState } from 'react'
import type { Screen } from '../../types/navigation'
import { memoActive, recordValue, type ListKind, type MoneyRecord, type Category, type RecordDraft } from '../../moneyRecords'
import type { MonthBudget } from '../budget/budget'
import type { AddCategory } from '../../components/CategoryPicker'
import Icon from '../../components/Icon'
import Header from '../../components/Header'
import { localDateValue } from '../../utils/date'
import { won, signedWon } from '../../utils/money'
import RecordForm from './RecordForm'

const listConfig: Record<ListKind, { title: string; add: string }> = {
  transactions: { title: '내역', add: '거래 추가' }, memos: { title: '메모', add: '메모 추가' },
  'fixed-pay': { title: '고정지출 지급', add: '지급 기록 추가' }, income: { title: '수입', add: '수입 추가' }, extra: { title: '그 외 지출', add: '지출 추가' },
}

export default function RecordList({ kind, go, date, changeDate, records, categories, addCategory, budget, saveRecord, deleteRecord, toggleMemo }: {
  kind: ListKind; go: (s: Screen) => void; date: string; changeDate: (date: string) => void;
  records: MoneyRecord[]; categories: Category[]; addCategory: AddCategory; budget: MonthBudget;
  saveRecord: (kind: ListKind, id: string | null, draft: RecordDraft, managementMonth: string) => string;
  deleteRecord: (kind: ListKind, id: string) => void; toggleMemo: (id: string) => void;
}) {
  const [editing, setEditing] = useState<MoneyRecord | 'new' | null>(null)
  const [memoTab, setMemoTab] = useState<'pending' | 'completed'>('pending')
  const cfg = listConfig[kind]
  const monthly = kind === 'income' || kind === 'extra'
  const month = date.slice(0, 7)
  const pending = records.filter(item => memoActive(item, date))
  const completed = records.filter(item => item.completedOn === date)
  const rows = kind === 'memos' ? memoTab === 'pending' ? pending : completed
    : records.filter(item => monthly ? item.date.slice(0, 7) === month : item.date === date)
  const moveDate = (offset: number) => {
    const [year, month, day] = date.split('-').map(Number)
    changeDate(localDateValue(new Date(year, month - 1 + (monthly ? offset : 0), monthly ? 1 : day + offset)))
  }
  const amountTotal = (income: boolean) => rows.reduce((total, item) => total + (item.direction === (income ? 'income' : 'expense') ? item.amount : 0), 0)
  const total = kind === 'memos' ? pending.reduce((sum, item) => sum + recordValue(item), 0)
    : rows.reduce((sum, item) => sum + Math.abs(item.amount), 0)
  return <main className="detail-shell">
    <Header title={editing ? `${cfg.title} ${editing === 'new' ? '추가' : '편집'}` : cfg.title} onBack={() => editing ? setEditing(null) : go(monthly ? 'monthly' : 'daily')} />
    {editing ? <RecordForm kind={kind} item={editing === 'new' ? undefined : editing} initialDate={date} budget={budget} categories={categories} addCategory={addCategory}
      onSave={draft => { const error = saveRecord(kind, editing === 'new' ? null : editing.id, draft, month); if (!error) setEditing(null); return error }}
      onDelete={() => { if (editing !== 'new') deleteRecord(kind, editing.id); setEditing(null) }} onCancel={() => setEditing(null)} /> : <>
      <div className="date-strip">
        <button type="button" aria-label={monthly ? '이전 달' : '이전 날짜'} onClick={() => moveDate(-1)}><Icon name="back" size={17} /></button>
        <strong>{new Date(date + 'T12:00:00').toLocaleDateString('ko-KR', monthly ? { year: 'numeric', month: 'long' } : { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })}</strong>
        <button type="button" className="flip" aria-label={monthly ? '다음 달' : '다음 날짜'} onClick={() => moveDate(1)}><Icon name="back" size={17} /></button>
      </div>
      {kind === 'memos' && <div className="segment" role="group" aria-label="메모 상태">
        <button type="button" className={memoTab === 'pending' ? 'active' : ''} aria-pressed={memoTab === 'pending'} onClick={() => setMemoTab('pending')}>미완료 {pending.length}</button>
        <button type="button" className={memoTab === 'completed' ? 'active' : ''} aria-pressed={memoTab === 'completed'} onClick={() => setMemoTab('completed')}>완료 이력 {completed.length}</button>
      </div>}
      <div className="record-list">
        {rows.length === 0 && <p className="record-empty">{kind === 'memos' ? memoTab === 'completed' ? '이 날짜에 완료한 메모가 없습니다.' : '미완료 메모가 없습니다.' : '해당 기간의 기록이 없습니다.'}</p>}
        {rows.map(item => {
          const category = categories.find(category => category.id === item.categoryId)
          const budgetItem = budget.fixed.find(value => value.id === item.budgetItemId)
          const detail = kind === 'memos' ? item.completedOn === date ? '완료일 ' + item.completedOn : '작성일 ' + item.date
            : kind === 'fixed-pay' ? budgetItem ? budgetItem.amount === budgetItem.paid ? '지급 완료' : `잔여 ${won(budgetItem.amount - budgetItem.paid)}원` : '예산 항목 없음'
            : kind === 'transactions' ? category?.name ?? '미분류' : item.date
          return <div className={`record-row ${kind === 'memos' ? 'memo-record-row' : ''}`} key={item.id}>
            {kind === 'memos' ? <label className="memo-record-check"><input type="checkbox" checked={item.completedOn === date} onChange={() => toggleMemo(item.id)} aria-label={item.title + ' 완료'} /></label>
              : <span className="record-date">{monthly ? Number(item.date.slice(8)) + '일' : item.time}</span>}
            <button type="button" className="memo-record-open" onClick={() => setEditing(item)}>
              <span className="record-title"><b>{kind === 'fixed-pay' ? budgetItem?.name ?? item.title : item.title}</b><small>{detail}</small></span>
              <strong className={kind === 'memos' ? undefined : kind === 'income' || kind === 'transactions' && item.direction === 'income' ? 'amount-income' : 'amount-expense'}>{kind === 'transactions' || kind === 'memos' ? signedWon(recordValue(item)) : won(item.amount) + '원'}</strong><Icon name="chevron" size={16} />
            </button>
          </div>
        })}
      </div>
      {kind === 'transactions' ? <dl className="transaction-totals" aria-label="지출 및 입금 합계">
        <div><dt>지출 합계</dt><dd className="amount-expense">{won(amountTotal(false))}원</dd></div>
        <div><dt>입금 합계</dt><dd className="amount-income">{won(amountTotal(true))}원</dd></div>
      </dl> : <div className="list-total"><span>{kind === 'memos' ? '미완료 보정' : kind === 'fixed-pay' ? '지급 합계' : '월 합계'}</span><strong className={kind === 'memos' ? undefined : kind === 'income' ? 'amount-income' : 'amount-expense'}>{kind === 'memos' ? signedWon(total) : won(total) + '원'}</strong></div>}
      <button className="primary-button bottom-action" onClick={() => setEditing('new')}><Icon name="plus" size={18} />{cfg.add}</button>
    </>}
  </main>
}
