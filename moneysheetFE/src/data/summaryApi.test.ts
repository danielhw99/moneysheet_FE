import { expect, it, vi } from 'vitest'
import { createHttpClient } from '../api/httpClient'
import { createSummaryApi } from './summaryApi'
const m='2026-11', date=m+'-03'
const row={id:'8',date,time:'12:30',title:'Meal',amount:9000,direction:'expense',categoryId:null}
const daily={foodStartDate:m+'-01',date,mainBalance:123456,freeBalance:2000,foodBudget:11000,carryoverFreeBalance:0,availableBeforeSpending:11000,remainingFood:0,expenseTotal:9000,incomeTotal:0,transactions:[row],activeMemos:[{...row,date:m+'-01',completedOn:m+'-04'}],payments:[]}
const monthly={foodStartDate:m+'-01',month:m,income:100000,extra:10000,fixedBudget:20000,foodBudget:30000,basicTotal:50000,totalExpense:60000,net:40000}
const home={foodStartDate:m+'-01',month:m,asOfDate:m+'-02',expense:60000,freeBalance:-2000,days:Array.from({length:30},(_,i)=>({date:m+'-'+String(i+1).padStart(2,'0'),entries:i===0?[{kind:'free',label:'여유비',amount:-2000},{kind:'memo',label:'미완료 메모',count:2}]:[]}))}
function setup(value:unknown) { const fetcher=vi.fn(async(_url:RequestInfo|URL,_options?:RequestInit)=>new Response(JSON.stringify(value)));return {api:createSummaryApi(createHttpClient({fetcher})),fetcher} }
it('uses server Daily balances and historical active memo DTOs unchanged',async()=>{
 const {api,fetcher}=setup(daily);const result=await api.getDaily(date)
 expect(result.mainBalance).toBe(123456);expect(result.activeMemos[0]).toMatchObject({date:m+'-01',completedOn:m+'-04'});expect(result.transactions[0].id).toBe('8')
 expect(fetcher.mock.calls[0][0]).toBe('/api/v1/summaries/daily?date=2026-11-03')
})
it('preserves Monthly fields and Home asOfDate, mapping only the day container',async()=>{
 expect(await setup(monthly).api.getMonthly(m)).toEqual(monthly)
 const result=await setup(home).api.getHome(m);expect(result).toMatchObject({asOfDate:m+'-02',expense:60000,freeBalance:-2000,source:'records'})
 expect(result.days[1].entries).toEqual(home.days[0].entries);expect(Object.keys(result.days)).toHaveLength(30)
})
it('maps Daily payments with as-of-date totals and rejects invalid completion flags',async()=>{
 const payment={record:{id:'9',date,time:'12:00',title:'Rent',amount:5000,budgetItemId:'51'},itemName:'Rent',paid:5000,remaining:10000,complete:false}
 expect((await setup({...daily,payments:[payment]}).api.getDaily(date)).payments[0]).toMatchObject({paid:5000,remaining:10000,record:{budgetItemId:'51',direction:'expense'}})
 await expect(setup({...daily,payments:[{...payment,complete:true}]}).api.getDaily(date)).rejects.toMatchObject({code:'PROTOCOL'})
})
it('rejects wrong dates, unsafe money, missing arrays and inactive Daily memos',async()=>{
 for(const value of [{...daily,date:m+'-04'},{...daily,mainBalance:1.1},{...daily,transactions:null},{...daily,activeMemos:[{...row,completedOn:date}]}]) await expect(setup(value).api.getDaily(date)).rejects.toMatchObject({code:'PROTOCOL'})
 for(const value of [{...monthly,month:'2026-10'},{...monthly,net:Number.MAX_SAFE_INTEGER+1}]) await expect(setup(value).api.getMonthly(m)).rejects.toMatchObject({code:'PROTOCOL'})
})
it('rejects incomplete calendar days and amount/count unions without showing fake zeroes',async()=>{
 for(const value of [{...home,days:[]},{...home,days:[...home.days.slice(1),home.days[1]]},{...home,days:home.days.map((d,i)=>i?d:{...d,entries:[{kind:'memo',label:'Memo',count:1,amount:99}]})}]) await expect(setup(value).api.getHome(m)).rejects.toMatchObject({code:'PROTOCOL'})
})
