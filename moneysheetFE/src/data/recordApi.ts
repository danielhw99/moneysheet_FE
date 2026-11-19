import { httpClient, type HttpClient } from '../api/httpClient'
import type { CreateOptions } from './writeAttempt'
import type { ListKind, MoneyRecord, RecordDraft } from './models'
import type { RecordQuery, RecordWrite, RecordsSummary } from './MoneySheetDataAccess'
import { validateRecord } from './validation'
import { protocol, invalid, object, safe, positiveTotal, money, id, date, text, array, month, inputId, inputDate } from './apiValidation'

const paths: Record<ListKind,string> = { transactions:'transactions', memos:'memos', 'fixed-pay':'fixed-payments', income:'cash-flows', extra:'cash-flows' }
const base = (kind: ListKind, m: string) => paths[kind] ? `/months/${month(m)}/${paths[kind]}` : invalid()
export function readRecord(kind: ListKind, value: unknown, expectedMonth: string): MoneyRecord {
  const d=object(value), occurred=date(d.date)
  if(occurred.slice(0,7)!==expectedMonth || typeof d.time!=='string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)) return protocol()
  let direction: 'income'|'expense'=kind==='income'?'income':'expense'
  if(kind==='transactions' || kind==='memos') {
    if(d.direction!=='income' && d.direction!=='expense') return protocol()
    direction=d.direction
  }
  if((kind==='income' && d.kind!=='income') || (kind==='extra' && d.kind!=='extraExpense')) return protocol()
  const categoryId=kind==='transactions'?(d.categoryId===null?null:id(d.categoryId)):null
  const completedOn=kind==='memos'?(d.completedOn===null?null:date(d.completedOn)):null
  if(completedOn && (completedOn<occurred || completedOn.slice(0,7)!==expectedMonth)) return protocol()
  return { id:id(d.id),date:occurred,time:d.time,title:text(d.title),amount:money(d.amount),direction,categoryId,completedOn,
    ...(kind==='fixed-pay'?{budgetItemId:id(d.budgetItemId)}:{}) }
}
function body(kind: ListKind, input: RecordDraft, m: string) {
  const error=validateRecord(kind,input,m)
  if(error) return invalid(error)
  const common={date:input.date,time:input.time,title:input.title.trim(),amount:input.amount}
  if(kind==='transactions') return {...common,direction:input.direction,categoryId:input.categoryId===null?null:inputId(input.categoryId)}
  if(kind==='memos') return {...common,direction:input.direction}
  if(kind==='fixed-pay') return {...common,budgetItemId:input.budgetItemId?inputId(input.budgetItemId):invalid('고정비 항목을 선택해 주세요.')}
  return {...common,kind:kind==='income'?'income':'extraExpense'}
}
export function createRecordApi(client: HttpClient = httpClient) {
  const saved = (value: unknown, request: RecordWrite, key?:string) => {
    const row=readRecord(request.kind,value,request.managementMonth)
    if(row.date!==request.input.date || (key && row.id!==key)) return protocol()
    return row
  }
  return {
    async getRecords(query: RecordQuery): Promise<RecordsSummary> {
      const m=query.date?.slice(0,7)??query.month!,params=new URLSearchParams()
      const path=base(query.kind,m)
      if(query.date) params.set('date',inputDate(query.date,m))
      if(query.kind==='memos') { if(!query.date) return invalid('메모 조회 날짜를 선택해 주세요.');params.set('status',query.memoStatus??'pending') }
      if(query.kind==='income' || query.kind==='extra') params.set('kind',query.kind==='income'?'income':'extraExpense')
      if(query.cursor!==undefined) { if(!query.cursor || query.cursor.length>2048) return invalid();params.set('cursor',query.cursor) }
      if(query.limit!==undefined) { if(!Number.isInteger(query.limit) || query.limit<1 || query.limit>100) return invalid();params.set('limit',String(query.limit)) }
      const d=object(await client.get(`${path}${params.size?'?'+params:''}`))
      if(d.nextCursor!==null && (typeof d.nextCursor!=='string' || !d.nextCursor || d.nextCursor.length>2048)) return protocol()
      const rows=array(d.rows).map(v=>readRecord(query.kind,v,m))
      if(query.date && rows.some(row=>query.kind==='memos'?query.memoStatus==='completed'?row.completedOn!==query.date:row.date>query.date! || !!row.completedOn && row.completedOn<=query.date!:row.date!==query.date)) return protocol()
      const expenseTotal=positiveTotal(d.expenseTotal),incomeTotal=positiveTotal(d.incomeTotal),total=safe(d.total)
      if(total!==(query.kind==='fixed-pay'?expenseTotal:incomeTotal-expenseTotal)) return protocol()
      return {rows,nextCursor:d.nextCursor as string|null,expenseTotal,incomeTotal,total,pendingMemoTotal:query.kind==='memos'?safe(d.pendingMemoTotal):0}
    },
    async getRecord(kind: ListKind,m: string,key: string) {
      const row=readRecord(kind,await client.get(`${base(kind,m)}/${inputId(key)}`),m)
      if(row.id!==key) return protocol()
      return row
    },
    async createRecord(request: RecordWrite, options?: CreateOptions) { const path=base(request.kind,request.managementMonth);const value=body(request.kind,request.input,request.managementMonth);return saved(await client.post(path,value,options),request) },
    async updateRecord(key: string,request: RecordWrite) { const path=`${base(request.kind,request.managementMonth)}/${inputId(key)}`;const value=body(request.kind,request.input,request.managementMonth);return saved(await client.put(path,value),request,key) },
    async deleteRecord(kind: ListKind,m: string,key: string) { await client.delete(`${base(kind,m)}/${inputId(key)}`) },
    async completeMemo(m: string,key: string,completedOn: string) {
      const path=`${base('memos',m)}/${inputId(key)}/completion`;inputDate(completedOn,m)
      const row=readRecord('memos',await client.put(path,{completedOn}),m)
      if(row.id!==key || row.completedOn!==completedOn) return protocol()
      return row
    },
    async cancelMemoCompletion(m: string,key: string) {
      const row=readRecord('memos',await client.delete<unknown>(`${base('memos',m)}/${inputId(key)}/completion`),m)
      if(row.id!==key || row.completedOn!==null) return protocol()
      return row
    },
  }
}
