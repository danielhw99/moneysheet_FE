import { expect, it, vi } from 'vitest'
import { createHttpClient } from '../api/httpClient'
import { createRecordApi } from './recordApi'
const month='2026-11'
const record={id:'9007199254740993',date:'2026-11-02',time:'12:30',title:'Meal',amount:9000,direction:'expense' as const,categoryId:null}
const draft={...record,completedOn:null}
it('forwards the creation key outside the transaction JSON body',async()=>{
 const {api,requests}=setup(record)
 await api.createRecord({kind:'transactions',managementMonth:month,input:draft},{idempotencyKey:'a0f71aa0-8f45-4972-a31f-9629c557e353'})
 expect(requests[0].headers.get('Idempotency-Key')).toBe('a0f71aa0-8f45-4972-a31f-9629c557e353')
 expect(requests[0].body).not.toHaveProperty('idempotencyKey')
})
function setup(value: unknown, status=200) {
 const requests: { path:string; method:string; body:unknown; headers:Headers }[]=[]
 const fetcher=vi.fn(async(url: RequestInfo|URL,options?:RequestInit)=>{
  if(String(url).endsWith('/auth/csrf')) return new Response(JSON.stringify({token:'csrf',headerName:'X-CSRF-TOKEN'}))
  requests.push({path:String(url),method:options?.method??'',body:options?.body?JSON.parse(String(options.body)):null,headers:new Headers(options?.headers)})
  return status===204?new Response(null,{status}):new Response(JSON.stringify(value),{status})
 })
 return {api:createRecordApi(createHttpClient({fetcher})),requests}
}
it('preserves int64 string IDs, sends domain-specific fields and uses the explicit month',async()=>{
 const {api,requests}=setup(record)
 expect(await api.createRecord({kind:'transactions',managementMonth:month,input:draft})).toMatchObject({...record,completedOn:null})
 expect(requests[0]).toMatchObject({path:'/api/v1/months/2026-11/transactions',method:'POST',body:{date:record.date,time:record.time,title:record.title,amount:9000,direction:'expense' as const,categoryId:null}})
 expect(requests[0].body).not.toHaveProperty('completedOn'); expect(requests[0].headers.get('X-CSRF-TOKEN')).toBe('csrf')
})
it('maps separate cash-flow and payment DTOs instead of sending the common UI record',async()=>{
 const income=setup({id:'8',date:record.date,time:record.time,title:'Salary',amount:100,kind:'income'})
 const result=await income.api.createRecord({kind:'income',managementMonth:month,input:{...draft,title:'Salary',amount:100,direction:'income'}})
 expect(result).toMatchObject({direction:'income',categoryId:null,completedOn:null});expect(income.requests[0].body).toEqual({date:record.date,time:record.time,title:'Salary',amount:100,kind:'income'})
 const paid=setup({id:'9',date:record.date,time:record.time,title:'Rent',amount:100,budgetItemId:'51'})
 expect(await paid.api.createRecord({kind:'fixed-pay',managementMonth:month,input:{...draft,title:'Rent',amount:100,budgetItemId:'51'}})).toMatchObject({direction:'expense',budgetItemId:'51'})
 expect(paid.requests[0].body).toEqual({date:record.date,time:record.time,title:'Rent',amount:100,budgetItemId:'51'})
})
it('binds list filters/cursor and returns server totals without deriving them from a page',async()=>{
 const {api,requests}=setup({rows:[{...record,kind:'extraExpense'}],nextCursor:'signed.cursor',expenseTotal:50000,incomeTotal:0,total:-50000})
 const list=await api.getRecords({kind:'extra',month,cursor:'a+b/',limit:1})
 expect(list).toMatchObject({nextCursor:'signed.cursor',expenseTotal:50000,total:-50000,pendingMemoTotal:0});expect(list.rows).toHaveLength(1)
 const path=new URL(requests[0].path,'http://localhost');expect(path.pathname).toBe('/api/v1/months/2026-11/cash-flows');expect(path.searchParams.get('kind')).toBe('extraExpense');expect(path.searchParams.get('cursor')).toBe('a+b/')
})
it('routes detail/delete/completion with a management month and consumes completion DTOs',async()=>{
 const {api,requests}=setup({...record,completedOn:'2026-11-04'})
 expect((await api.completeMemo(month,record.id,'2026-11-04')).completedOn).toBe('2026-11-04')
 expect(requests[0]).toMatchObject({method:'PUT',path:`/api/v1/months/2026-11/memos/${record.id}/completion`,body:{completedOn:'2026-11-04'}})
 const cancelled=setup({...record,completedOn:null});expect((await cancelled.api.cancelMemoCompletion(month,record.id)).completedOn).toBeNull();expect(cancelled.requests[0].method).toBe('DELETE')
 const removed=setup(null,204);await removed.api.deleteRecord('transactions',month,record.id);expect(removed.requests[0].path).toContain('/months/2026-11/transactions/')
})
it('rejects invalid local writes before any HTTP request',async()=>{
 const {api,requests}=setup(record)
 for(const input of [{...draft,amount:0},{...draft,amount:10000000000},{...draft,date:'2026-12-01'}]) await expect(api.createRecord({kind:'transactions',managementMonth:month,input})).rejects.toMatchObject({code:'VALIDATION'})
 await expect(api.getRecords({kind:'memos',month})).rejects.toMatchObject({code:'VALIDATION'});expect(requests).toHaveLength(0)
})
it('rejects wrong-month, unsafe, missing and invalid server record values',async()=>{
 for(const value of [{...record,id:7},{...record,amount:Number.MAX_SAFE_INTEGER+1},{...record,date:'2026-12-02'},{...record,time:'12:30:00'},{...record,categoryId:undefined}]) {
  const {api}=setup(value);await expect(api.getRecord('transactions',month,record.id)).rejects.toMatchObject({code:'PROTOCOL'})
 }
})
it('rejects malformed lists and preserves errors without retrying a write',async()=>{
 const bad=setup({rows:[],nextCursor:null,expenseTotal:0,incomeTotal:0,total:0.5});await expect(bad.api.getRecords({kind:'transactions',date:record.date})).rejects.toMatchObject({code:'PROTOCOL'})
 const failed=setup({code:'PAYMENT_EXCEEDS_BUDGET',message:'Too much'},409);await expect(failed.api.createRecord({kind:'fixed-pay',managementMonth:month,input:{...draft,budgetItemId:'51'}})).rejects.toMatchObject({code:'PAYMENT_EXCEEDS_BUDGET'});expect(failed.requests).toHaveLength(1)
})
