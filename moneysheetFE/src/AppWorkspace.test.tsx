import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import App from './App'
import { httpClient } from './api/httpClient'
import { financeResponse, profile, today, budget, home as homeSummary } from './test/financeFixtures'
import type { AuthApi } from './features/auth/authApi'
import { localDateValue } from './utils/date'
const auth=():AuthApi=>({requestEmailVerification: vi.fn(), confirmEmailVerification: vi.fn(), me: vi.fn().mockResolvedValue(profile),login:vi.fn(),signup:vi.fn(),logout:vi.fn(),updateProfile:vi.fn(),changePassword:vi.fn(),deleteAccount:vi.fn(),resetCsrf:vi.fn(),onUnauthorized:vi.fn(()=>()=>{})})
beforeEach(()=>{httpClient.invalidateCsrf();vi.stubGlobal('fetch',vi.fn(async(url:RequestInfo|URL)=>financeResponse(url)))})
afterEach(()=>vi.unstubAllGlobals())
it('shows a centered profile with a working profile settings path and existing menus',async()=>{
 render(<App authApi={auth()}/>);await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 await userEvent.click(screen.getByRole('button',{name:'MY'}))
 const profileArea=await screen.findByRole('region',{name:'프로필 정보'})
 expect(profileArea).toHaveTextContent(profile.nickname);expect(profileArea).toHaveTextContent(profile.email)
 expect(screen.getByRole('button',{name:'계정관리'})).toBeInTheDocument()
 expect(screen.getByRole('button',{name:/^설정$/})).toBeInTheDocument()
 expect(screen.getByRole('button',{name:'로그아웃'})).toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:'프로필 설정'}))
 expect(await screen.findByLabelText('닉네임')).toHaveValue(profile.nickname)
 expect(screen.queryByRole('button',{name:/사진 업로드/})).not.toBeInTheDocument()
})
it('moves directly to a selected leap-year month and retains the same month date',async()=>{
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
 render(<App authApi={auth()}/>);await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 await userEvent.click(screen.getByRole('button',{name:'연월 선택'}))
 await userEvent.selectOptions(screen.getByLabelText('연도'),'2024')
 await userEvent.selectOptions(screen.getByLabelText('월'),'2')
 await userEvent.click(screen.getByRole('button',{name:'이동'}))
 const day=await screen.findByRole('button',{name:'2024-02-29'})
 await userEvent.click(day)
 expect(day).toHaveAttribute('aria-pressed','true')
 await userEvent.click(screen.getByRole('button',{name:'연월 선택'}))
 await userEvent.click(screen.getByRole('button',{name:'이동'}))
 expect(screen.getByRole('button',{name:'2024-02-29'})).toHaveAttribute('aria-pressed','true')
 expect(screen.queryByRole('button',{name:'2024-02-30'})).not.toBeInTheDocument()
})
it('closes quick entry when another calendar date is selected and uses the new date',async()=>{
 render(<App authApi={auth()}/>);await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 const trigger=await screen.findByRole('button',{name:'빠른 작성'})
 await waitFor(()=>expect(trigger).toBeEnabled())
 await userEvent.click(trigger)
 const chosen=today.slice(0,7)+'-04'
 await userEvent.click(screen.getByRole('button',{name:new RegExp('^'+chosen+'$')}))
 expect(screen.queryByRole('navigation',{name:'빠른 작성 항목'})).not.toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:'빠른 작성'}))
 expect(screen.getByRole('navigation',{name:'빠른 작성 항목'})).toHaveTextContent(chosen)
})
it.each([['내역 작성','내역 추가'],['메모 작성','메모 추가'],['고정지출 지급 작성','고정지출 지급 추가']])('opens %s directly with the selected home date',async(label,title)=>{
 render(<App authApi={auth()}/>);await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 const chosen=today.slice(0,7)+'-03'
 await userEvent.click(screen.getByRole('button',{name:new RegExp('^'+chosen+'$')}))
 expect(document.querySelector('.calendar')).toBeInTheDocument()
 const trigger=await screen.findByRole('button',{name:'빠른 작성'})
 await waitFor(()=>expect(trigger).toBeEnabled())
 await userEvent.click(trigger)
 await userEvent.click(screen.getByRole('button',{name:label}))
 expect(await screen.findByText(title)).toBeInTheDocument()
 expect(await screen.findByLabelText('날짜')).toHaveValue(chosen)
 expect(screen.queryByRole('region',{name:'기록 목록'})).not.toBeInTheDocument()
})
it('provides app settings outside MY and reopens the guide from its dropdown',async()=>{
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
 render(<App authApi={auth()}/>);await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 expect(screen.queryByRole('navigation',{name:'업무 메뉴'})).not.toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:'앱 설정'}))
 await userEvent.click(screen.getByRole('button',{name:'사용 가이드'}))
 expect(await screen.findByRole('dialog',{name:'moneysheet 사용 가이드'})).toBeVisible()
 await userEvent.click(screen.getByRole('button',{name:'사용 가이드 닫기'}))
 await userEvent.click(screen.getByRole('button',{name:'MY'}))
 expect(screen.queryByRole('button',{name:'앱 설정'})).not.toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:'계정관리'}))
 expect(screen.getByRole('button',{name:'앱 설정'})).toBeInTheDocument()
})
it('keeps the viewed month when entering Monthly and returns to today from the Daily menu',async()=>{
 const last=localDateValue(new Date(Number(today.slice(0,4)),Number(today.slice(5,7))-1,0))
 render(<App authApi={auth()}/>);await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 await userEvent.click(screen.getByRole('button',{name:'이전 달'}))
 await userEvent.click(await screen.findByRole('button',{name:new RegExp('^'+last+'$')}))
 await userEvent.click(screen.getByRole('button',{name:new RegExp('^'+last+'$')}))
 await screen.findByText('123,456원')
 await userEvent.click(screen.getByRole('button',{name:'Monthly'}))
 await waitFor(()=>expect(vi.mocked(fetch).mock.calls.filter(([url])=>String(url).includes('/summaries/monthly')).at(-1)?.[0]).toContain('month='+last.slice(0,7)))
 await userEvent.click(screen.getByRole('button',{name:'Daily'}))
 await waitFor(()=>expect(vi.mocked(fetch).mock.calls.filter(([url])=>String(url).includes('/summaries/daily')).at(-1)?.[0]).toContain('date='+today))
})
it('synchronizes Daily date navigation across a month boundary with the home calendar',async()=>{
 const last=localDateValue(new Date(Number(today.slice(0,4)),Number(today.slice(5,7))-1,0))
 render(<App authApi={auth()}/>);await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 await userEvent.click(screen.getByRole('button',{name:'이전 달'}))
 await userEvent.click(await screen.findByRole('button',{name:new RegExp('^'+last+'$')}))
 await userEvent.click(screen.getByRole('button',{name:new RegExp('^'+last+'$')}))
 await screen.findByText('123,456원')
 await userEvent.click(screen.getByRole('button',{name:'다음 날짜'}))
 const first=today.slice(0,7)+'-01'
 await waitFor(()=>expect(vi.mocked(fetch).mock.calls.some(([url])=>String(url).includes('/summaries/daily?date='+first))).toBe(true))
 await userEvent.click(screen.getByRole('button',{name:'이전 날짜'}))
 await userEvent.click(screen.getByRole('button',{name:'뒤로가기'}))
 const selected=await screen.findByRole('button',{name:new RegExp('^'+last+'$')})
 expect(selected).toHaveClass('selected')
})
it('restores the calendar, selected Daily and record input using server summary data',async()=>{
 render(<App authApi={auth()}/>);await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 expect(document.querySelector('.calendar')).toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:new RegExp('^'+today+'$')}))
 expect(document.querySelector('.calendar')).toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:new RegExp('^'+today+'$')}))
 expect(await screen.findByText('123,456원')).toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:'내역 추가'}))
 expect(await screen.findByRole('group',{name:'거래 구분'})).toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'거래 추가'})).not.toBeInTheDocument()
})
it('connects Monthly income/expense screens and retains actual authenticated profile',async()=>{
 render(<App authApi={auth()}/>);await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 await userEvent.click(screen.getByRole('button',{name:'Monthly'}))
 await screen.findByText('이번 달 현황')
 await userEvent.click(screen.getByRole('button',{name:/그 외 지출/}))
 expect(await screen.findByRole('button',{name:'지출 추가'})).toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:'뒤로가기'}))
 await userEvent.click(await screen.findByRole('button',{name:'MY'}))
 expect(await screen.findByText(profile.email)).toBeInTheDocument()
})

it('resets selected month and cached workspace when the authenticated user changes',async()=>{
 const service=auth();vi.mocked(service.me).mockResolvedValueOnce(profile).mockResolvedValueOnce({...profile,id:'2'})
 render(<App authApi={service}/>);await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 await userEvent.click(screen.getByRole('button',{name:'이전 달'}))
 await waitFor(()=>expect(String(vi.mocked(fetch).mock.calls.filter(([p])=>String(p).includes('/summaries/home')).at(-1)?.[0])).not.toContain('month='+today.slice(0,7)))
 fireEvent(window,new Event('focus'))
 await waitFor(()=>expect(service.me).toHaveBeenCalledTimes(2))
 await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 await waitFor(()=>expect(String(vi.mocked(fetch).mock.calls.filter(([p])=>String(p).includes('/summaries/home')).at(-1)?.[0])).toContain('month='+today.slice(0,7)))
})

it('keeps the home frame and month header while budget readiness is loading',async()=>{
 let resolveBudget!: (response:Response)=>void
 const pendingBudget=new Promise<Response>(resolve=>{resolveBudget=resolve})
 let resolveHome!: (response:Response)=>void
 const pendingHome=new Promise<Response>(resolve=>{resolveHome=resolve})
 vi.stubGlobal('fetch',vi.fn(async(url:RequestInfo|URL)=>{
  const path=new URL(String(url),'http://localhost').pathname
  if(path.endsWith('/budget')) return pendingBudget
  if(path.endsWith('/summaries/home')) return pendingHome
  return financeResponse(url)
 }))
 render(<App authApi={auth()}/>)
 const monthTitle=`${today.slice(0,4)}년 ${Number(today.slice(5,7))}월`
 expect(await screen.findByText(monthTitle)).toBeInTheDocument()
 expect(screen.getByRole('button',{name:'이전 달'})).toBeInTheDocument()
 expect(screen.getByRole('button',{name:'다음 달'})).toBeInTheDocument()
 expect(screen.getByRole('status')).toHaveTextContent('불러오는 중')
 expect(document.querySelector('main.app-shell')).toBeInTheDocument()
 expect(screen.queryByText('자금 현황')).not.toBeInTheDocument()
 expect(vi.mocked(fetch).mock.calls.some(([url])=>new URL(String(url),'http://localhost').pathname.endsWith('/summaries/home'))).toBe(false)
 await act(async()=>{resolveBudget(new Response(JSON.stringify(budget()),{status:200}))})
 expect(await screen.findByRole('button',{name:new RegExp('^'+today+'$')})).toBeInTheDocument()
 expect(screen.getByText(monthTitle)).toBeInTheDocument()
 expect(screen.getByRole('status')).toHaveTextContent('불러오는 중')
 expect(screen.queryByRole('button',{name:/총지출/})).not.toBeInTheDocument()
 const summary=homeSummary()
 await act(async()=>{resolveHome(new Response(JSON.stringify(summary),{status:200}))})
 await waitFor(()=>expect(screen.queryByRole('status')).not.toBeInTheDocument())
 expect(screen.queryByRole('button',{name:/총지출/})).not.toBeInTheDocument()
 expect(document.querySelector('.calendar')).toBeInTheDocument()
 expect(screen.queryByRole('status')).not.toBeInTheDocument()
})

it('uses the home frame for a past month without a completed budget and preserves setup navigation',async()=>{
 const previousMonth=localDateValue(new Date(Number(today.slice(0,4)),Number(today.slice(5,7))-2,1)).slice(0,7)
 vi.stubGlobal('fetch',vi.fn(async(url:RequestInfo|URL)=>{
  const request=new URL(String(url),'http://localhost')
  if(request.pathname.endsWith('/budget') && request.pathname.includes(`/months/${previousMonth}/`))
   return new Response(JSON.stringify({code:'BUDGET_NOT_READY',message:'예산 설정 필요'}),{status:409})
  return financeResponse(url)
 }))
 render(<App authApi={auth()}/>)
 await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 await userEvent.click(screen.getByRole('button',{name:'이전 달'}))
 const monthTitle=`${previousMonth.slice(0,4)}년 ${Number(previousMonth.slice(5))}월`
 expect(await screen.findByText('이 월에는 완료된 예산이 없어요. 이번 달 예산을 먼저 설정해 주세요.')).toBeInTheDocument()
 expect(screen.getByText(monthTitle)).toBeInTheDocument()
 expect(document.querySelector('main.app-shell')).toBeInTheDocument()
 expect(screen.queryByText('자금 현황')).not.toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:'이번 달 예산 설정'}))
 expect(await screen.findByRole('button',{name:'저장'})).toBeInTheDocument()
})

it('preserves unsaved food after a fixed-item save succeeds but budget reloads fail',async()=>{
 let failReload=false
 const item={id:'51',name:'Rent',categoryId:'9',amount:10000,paid:0,remaining:10000,complete:false}
 vi.stubGlobal('fetch',vi.fn(async(url:RequestInfo|URL,options?:RequestInit)=>{
  const path=new URL(String(url),'http://localhost').pathname
  if(path.endsWith('/budget')) return failReload
   ? new Response(JSON.stringify({code:'INTERNAL_ERROR',message:'Reload failed'}),{status:503})
   : new Response(JSON.stringify({...budget(),items:[item],fixedTotal:10000}))
  if(path.endsWith('/categories')) return new Response(JSON.stringify({items:[{id:'9',name:'Housing',scope:'fixedBudget',direction:null}]}))
  if(path.endsWith('/budget-items/51') && options?.method==='PUT') {
   failReload=true
   return new Response(JSON.stringify({id:'51',name:'Rent',categoryId:'9',amount:15000}))
  }
  return financeResponse(url)
 }))
 render(<App authApi={auth()}/>);await screen.findByRole('button',{name:new RegExp('^'+today+'$')})
 await userEvent.click(screen.getByRole('button',{name:'Monthly'}))
 await userEvent.click(await screen.findByRole('button',{name:/기본지출/}))
 await screen.findByLabelText(/주중/);await userEvent.click(screen.getByRole('button',{name:'예산 잠금 해제'}))
 fireEvent.change(screen.getByLabelText(/주중/),{target:{value:'12345'}})
 await userEvent.click(screen.getByRole('button',{name:/Rent/}))
 const amount=screen.getByLabelText(/예산 금액/);await userEvent.clear(amount);await userEvent.type(amount,'15000')
 await userEvent.click(screen.getByRole('button',{name:'저장'}))
 await screen.findByText('Reload failed')
 const food=screen.getByLabelText(/주중/) as HTMLInputElement
 expect(food.value.replace(/,/g,'')).toBe('12345');expect(food).toBeDisabled()
})
