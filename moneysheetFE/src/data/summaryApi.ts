import { httpClient, type HttpClient } from '../api/httpClient'
import type { DailySummary, MonthlySummary, HomeSummary, HomeDayEntry } from './MoneySheetDataAccess'
import { readRecord } from './recordApi'
import { protocol, object, safe, positiveTotal, money, date, text, array, month, bool } from './apiValidation'
import { validDate, daysInMonth } from '../utils/date'

export function createSummaryApi(client: HttpClient = httpClient) {
 return {
  async getDaily(selected: string): Promise<DailySummary> {
   if(!validDate(selected)) return protocol()
   const d=object(await client.get('/summaries/daily?'+new URLSearchParams({date:selected}))),m=selected.slice(0,7)
   if(d.date!==selected) return protocol()
   const transactions=array(d.transactions).map(v=>readRecord('transactions',v,m))
   const activeMemos=array(d.activeMemos).map(v=>readRecord('memos',v,m))
   if(transactions.some(row=>row.date!==selected) || activeMemos.some(row=>row.date>selected || !!row.completedOn && row.completedOn<=selected)) return protocol()
   const payments=array(d.payments).map(v=>{
    const row=object(v),record=readRecord('fixed-pay',row.record,m),paid=positiveTotal(row.paid),remaining=positiveTotal(row.remaining),complete=bool(row.complete)
    if(record.date!==selected || paid<record.amount || complete!==(remaining===0)) return protocol()
    return {record,itemName:text(row.itemName,100),paid,remaining,complete}
   })
   return {date:selected,mainBalance:safe(d.mainBalance),freeBalance:safe(d.freeBalance),foodBudget:money(d.foodBudget),carryoverFreeBalance:safe(d.carryoverFreeBalance),availableBeforeSpending:safe(d.availableBeforeSpending),remainingFood:positiveTotal(d.remainingFood),expenseTotal:positiveTotal(d.expenseTotal),incomeTotal:positiveTotal(d.incomeTotal),transactions,activeMemos,payments}
  },
  async getMonthly(selected: string): Promise<MonthlySummary> {
   const d=object(await client.get('/summaries/monthly?'+new URLSearchParams({month:month(selected)})))
   if(d.month!==selected) return protocol()
   return {month:selected,income:positiveTotal(d.income),extra:positiveTotal(d.extra),fixedBudget:positiveTotal(d.fixedBudget),foodBudget:positiveTotal(d.foodBudget),basicTotal:positiveTotal(d.basicTotal),totalExpense:positiveTotal(d.totalExpense),net:safe(d.net)}
  },
  async getHome(selected: string): Promise<HomeSummary> {
   const d=object(await client.get('/summaries/home?'+new URLSearchParams({month:month(selected)}))),asOfDate=date(d.asOfDate)
   if(d.month!==selected || asOfDate.slice(0,7)!==selected) return protocol()
   const days: Record<number,{entries: HomeDayEntry[]}>={},rows=array(d.days)
   if(rows.length!==daysInMonth(selected)) return protocol()
   for(const value of rows) {
    const row=object(value),key=date(row.date),day=Number(key.slice(8))
    if(key.slice(0,7)!==selected || days[day]) return protocol()
    const entries=array(row.entries).map((entry):HomeDayEntry=>{
     const e=object(entry),label=text(e.label)
     if(e.kind==='memo') { if('amount' in e) return protocol();return {kind:'memo',label,count:positiveTotal(e.count)} }
     if(e.kind!=='fixed' && e.kind!=='transaction' && e.kind!=='free') return protocol()
     if('count' in e || (e.kind==='free' && key>asOfDate)) return protocol()
     return {kind:e.kind,label,amount:safe(e.amount)}
    })
    days[day]={entries}
   }
   return {month:selected,asOfDate,source:'records',days,expense:positiveTotal(d.expense),freeBalance:safe(d.freeBalance)}
  },
 }
}
