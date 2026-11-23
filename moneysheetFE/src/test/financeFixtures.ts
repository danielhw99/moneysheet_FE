import { currentMonth, daysInMonth, localDateValue } from '../utils/date'
export const month=currentMonth(), today=localDateValue(new Date())
export const profile={id:'1',email:'finance@example.com',nickname:'Finance'}
export const budget=(m=month)=>({month:m,status:'ready',items:[],food:{paymentMode: 'threeInstallments', weekday:11000,saturday:11000,sunday:11000},fixedTotal:0,foodSummary:{total:daysInMonth(m)*11000,installments:[110000,110000,(daysInMonth(m)-20)*11000]}})
export const monthly=(m=month)=>({month:m,income:1000000,extra:100000,fixedBudget:0,foodBudget:daysInMonth(m)*11000,basicTotal:daysInMonth(m)*11000,totalExpense:daysInMonth(m)*11000+100000,net:1000000-daysInMonth(m)*11000-100000})
export const daily=(date=today)=>({date,mainBalance:123456,freeBalance:2000,foodBudget:11000,carryoverFreeBalance:0,availableBeforeSpending:11000,remainingFood:0,expenseTotal:9000,incomeTotal:0,transactions:[],activeMemos:[],payments:[]})
export const home=(m=month)=>({month:m,asOfDate:m===month?today:`${m}-${daysInMonth(m)}`,expense:monthly(m).totalExpense,freeBalance:2000,days:Array.from({length:daysInMonth(m)},(_,i)=>({date:`${m}-${String(i+1).padStart(2,'0')}`,entries:[]}))})
export function financeResponse(url:RequestInfo|URL) {
 const u=new URL(String(url),'http://localhost'),path=u.pathname,m=path.match(/months\/(\d{4}-\d{2})/)?.[1]??u.searchParams.get('month')??month
 const body=path.endsWith('/auth/csrf')?{token:'csrf',headerName:'X-CSRF-TOKEN'}:path.endsWith('/me')?profile:path.endsWith('/budget')?budget(m):path.endsWith('/summaries/home')?home(m):path.endsWith('/summaries/daily')?daily(u.searchParams.get('date')??today):path.endsWith('/summaries/monthly')?monthly(m):path.endsWith('/categories')?{items:[]}:{rows:[],nextCursor:null,expenseTotal:0,incomeTotal:0,total:0,pendingMemoTotal:0}
 return new Response(JSON.stringify(body))
}
