import { useEffect, useState } from 'react'
import type { Screen } from '../../types/navigation'
import type { ListKind, MoneyRecord } from '../../data/models'
import { useDataAccess, errorMessage } from '../../data/DataProvider'
import { useDataQuery } from '../../data/useDataQuery'
import { recordValue } from '../../data/values'
import Icon from '../../components/Icon'
import Header from '../../components/Header'
import QueryStatus from '../../components/QueryStatus'
import { localDateValue } from '../../utils/date'
import { won, signedWon } from '../../utils/money'
import RecordForm from './RecordForm'

const listConfig: Record<ListKind, { title: string; add: string }> = {
  transactions: { title: '내역', add: '거래 추가' }, memos: { title: '메모', add: '메모 추가' },
  'fixed-pay': { title: '고정지출 지급', add: '지급 기록 추가' }, income: { title: '수입', add: '수입 추가' }, extra: { title: '그 외 지출', add: '지출 추가' },
}

export default function RecordList({ kind, go, date, changeDate }: {
  kind: ListKind; go: (s: Screen) => void; date: string; changeDate: (date: string) => void;
}) {
  const { pending, mutate } = useDataAccess()
  const [editing, setEditing] = useState<Readonly<MoneyRecord> | 'new' | null>(null)
  const [memoTab, setMemoTab] = useState<'pending' | 'completed'>('pending')
  const [actionError, setActionError] = useState('')
  useEffect(() => { setActionError(''); setEditing(null) }, [kind, date])
  const cfg = listConfig[kind]
  const monthly = kind === 'income' || kind === 'extra'
  const month = date.slice(0, 7)
  const query = useDataQuery(`records:${kind}:${date}`, async api => {
    const [list, completed, budget, categories] = await Promise.all([
      api.getRecords(kind === 'memos' ? { kind, date, memoStatus: 'pending' } : monthly ? { kind, month } : { kind, date }),
      kind === 'memos' ? api.getRecords({ kind, date, memoStatus: 'completed' }) : Promise.resolve(null),
      kind === 'fixed-pay' ? api.getBudget(month) : Promise.resolve(null),
      kind === 'transactions' ? api.getCategories({ scope: 'mainTransaction' }) : Promise.resolve([]),
    ])
    return { list, completed, budget, categories }
  })
  const data = query.data
  const list = kind === 'memos' && memoTab === 'completed' ? data?.completed : data?.list
  const rows = list?.rows ?? []
  const moveDate = (offset: number) => {
    const [year, month, day] = date.split('-').map(Number)
    changeDate(localDateValue(new Date(year, month - 1 + (monthly ? offset : 0), monthly ? 1 : day + offset)))
  }
  const toggleMemo = async (item: Readonly<MoneyRecord>) => {
    setActionError('')
    try { await mutate(api => item.completedOn === date ? api.cancelMemoCompletion(item.id) : api.completeMemo(item.id, date)) }
    catch (error) { setActionError(errorMessage(error)) }
  }
  return <main className="detail-shell">
    <Header title={editing ? `${cfg.title} ${editing === 'new' ? '추가' : '편집'}` : cfg.title} onBack={() => { if (!pending) editing ? setEditing(null) : go(monthly ? 'monthly' : 'daily') }} />
    <QueryStatus {...query} />
    {actionError && <p className="query-status" role="alert">{actionError}</p>}
    {editing && data ? <RecordForm kind={kind} item={editing === 'new' ? undefined : editing} initialDate={date} budget={data.budget} refreshing={query.loading || !!query.error}
      onSave={async input => {
        await mutate(api => editing === 'new' ? api.createRecord({ kind, managementMonth: month, input }) : api.updateRecord(editing.id, { kind, managementMonth: month, input }))
        setEditing(null)
      }}
      onDelete={async () => { if (editing !== 'new') await mutate(api => api.deleteRecord(kind, editing.id)); setEditing(null) }} onCancel={() => setEditing(null)} /> : <>
      <div className="date-strip">
        <button type="button" disabled={pending} aria-label={monthly ? '이전 달' : '이전 날짜'} onClick={() => moveDate(-1)}><Icon name="back" size={17} /></button>
        <strong>{new Date(date + 'T12:00:00').toLocaleDateString('ko-KR', monthly ? { year: 'numeric', month: 'long' } : { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })}</strong>
        <button type="button" disabled={pending} className="flip" aria-label={monthly ? '다음 달' : '다음 날짜'} onClick={() => moveDate(1)}><Icon name="back" size={17} /></button>
      </div>
      {kind === 'memos' && <div className="segment" role="group" aria-label="메모 상태">
        <button type="button" className={memoTab === 'pending' ? 'active' : ''} aria-pressed={memoTab === 'pending'} onClick={() => setMemoTab('pending')}>미완료 {data?.list.rows.length ?? 0}</button>
        <button type="button" className={memoTab === 'completed' ? 'active' : ''} aria-pressed={memoTab === 'completed'} onClick={() => setMemoTab('completed')}>완료 이력 {data?.completed?.rows.length ?? 0}</button>
      </div>}
      <div className="record-list" aria-busy={query.loading}>
        {data && rows.length === 0 && <p className="record-empty">{kind === 'memos' ? memoTab === 'completed' ? '이 날짜에 완료한 메모가 없습니다.' : '미완료 메모가 없습니다.' : '해당 기간의 기록이 없습니다.'}</p>}
        {rows.map(item => {
          const category = data?.categories.find(category => category.id === item.categoryId)
          const budgetItem = data?.budget?.items.find(value => value.id === item.budgetItemId)
          const detail = kind === 'memos' ? item.completedOn === date ? '완료일 ' + item.completedOn : '작성일 ' + item.date
            : kind === 'fixed-pay' ? budgetItem ? budgetItem.complete ? '지급 완료' : `잔여 ${won(budgetItem.remaining)}원` : '예산 항목 없음'
            : kind === 'transactions' ? category?.name ?? '미분류' : item.date
          return <div className={`record-row ${kind === 'memos' ? 'memo-record-row' : ''}`} key={item.id}>
            {kind === 'memos' ? <label className="memo-record-check"><input type="checkbox" disabled={pending || query.loading || !!query.error} checked={item.completedOn === date} onChange={() => void toggleMemo(item)} aria-label={item.title + ' 완료'} /></label>
              : <span className="record-date">{monthly ? Number(item.date.slice(8)) + '일' : item.time}</span>}
            <button type="button" className="memo-record-open" disabled={pending || query.loading || !!query.error} onClick={() => setEditing(item)}>
              <span className="record-title"><b>{kind === 'fixed-pay' ? budgetItem?.name ?? item.title : item.title}</b><small>{detail}</small></span>
              <strong className={kind === 'memos' ? undefined : kind === 'income' || kind === 'transactions' && item.direction === 'income' ? 'amount-income' : 'amount-expense'}>{kind === 'transactions' || kind === 'memos' ? signedWon(recordValue(item)) : won(item.amount) + '원'}</strong><Icon name="chevron" size={16} />
            </button>
          </div>
        })}
      </div>
      {data && (kind === 'transactions' ? <dl className="transaction-totals" aria-label="지출 및 입금 합계">
        <div><dt>지출 합계</dt><dd className="amount-expense">{won(data.list.expenseTotal)}원</dd></div>
        <div><dt>입금 합계</dt><dd className="amount-income">{won(data.list.incomeTotal)}원</dd></div>
      </dl> : <div className="list-total"><span>{kind === 'memos' ? '미완료 보정' : kind === 'fixed-pay' ? '지급 합계' : '월 합계'}</span><strong className={kind === 'memos' ? undefined : kind === 'income' ? 'amount-income' : 'amount-expense'}>{kind === 'memos' ? signedWon(data.list.pendingMemoTotal) : won(data.list.total) + '원'}</strong></div>)}
      <button className="primary-button bottom-action" disabled={pending || query.loading || !!query.error || !data} onClick={() => setEditing('new')}><Icon name="plus" size={18} />{cfg.add}</button>
    </>}
  </main>
}
