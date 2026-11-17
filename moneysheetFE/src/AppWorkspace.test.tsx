import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import App from './App'
import { httpClient } from './api/httpClient'
import { financeResponse, profile, today, budget } from './test/financeFixtures'
import type { AuthApi } from './features/auth/authApi'
import { localDateValue } from './utils/date'
const auth=():AuthApi=>({me:vi.fn().mockResolvedValue(profile),login:vi.fn(),signup:vi.fn(),logout:vi.fn(),updateProfile:vi.fn(),changePassword:vi.fn(),deleteAccount:vi.fn(),resetCsrf:vi.fn(),onUnauthorized:vi.fn(()=>()=>{})})
beforeEach(()=>{httpClient.invalidateCsrf();vi.stubGlobal('fetch',vi.fn(async(url:RequestInfo|URL)=>financeResponse(url)))})
afterEach(()=>vi.unstubAllGlobals())
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
 expect(await screen.findByText('123,456원')).toBeInTheDocument()
 await userEvent.click(screen.getByRole('button',{name:'내역 추가'}))
 await userEvent.click(await screen.findByRole('button',{name:'거래 추가'}))
 expect(screen.getByRole('group',{name:'거래 구분'})).toBeInTheDocument()
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
