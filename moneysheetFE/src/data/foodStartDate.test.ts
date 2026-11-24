import { expect,it,vi } from 'vitest'
import { createHttpClient } from '../api/httpClient'
import { createSummaryApi } from './summaryApi'
import { createBudgetApi } from './budgetApi'
const client=(value:unknown)=>createHttpClient({fetcher:vi.fn(async(url)=>new Response(JSON.stringify(String(url).endsWith('/auth/csrf')?{token:'csrf',headerName:'X-CSRF-TOKEN'}:value)))})
it('accepts zero daily food before the start date without hiding earlier transactions',async()=>{
 const date='2026-11-16',value={date,foodStartDate:'2026-11-17',mainBalance:-3000,freeBalance:-3000,foodBudget:0,carryoverFreeBalance:0,availableBeforeSpending:0,remainingFood:0,expenseTotal:3000,incomeTotal:0,transactions:[],activeMemos:[],payments:[]}
 expect(await createSummaryApi(client(value)).getDaily(date)).toMatchObject({foodStartDate:'2026-11-17',foodBudget:0,freeBalance:-3000})
})
it('requires a valid same-month budget start and boolean editability',async()=>{
 const value={month:'2026-11',status:'draft',copiedFromMonth:null,items:[],foodStartDate:'2026-11-17',foodStartDateEditable:true,food:{paymentMode:'threeInstallments',weekday:null,saturday:null,sunday:null}}
 expect(await createBudgetApi(client(value)).prepareBudget('2026-11')).toMatchObject({foodStartDate:'2026-11-17',foodStartDateEditable:true})
 for(const foodStartDate of [undefined,null,'2026-11-31','2026-10-17','2026-11-1']) await expect(createBudgetApi(client({...value,foodStartDate})).prepareBudget('2026-11')).rejects.toMatchObject({code:'PROTOCOL'})
 await expect(createBudgetApi(client({...value,foodStartDateEditable:'true'})).prepareBudget('2026-11')).rejects.toMatchObject({code:'PROTOCOL'})
})
