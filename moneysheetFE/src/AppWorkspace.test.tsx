import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import App from './App'
import { httpClient } from './api/httpClient'
import { financeResponse, profile, today } from './test/financeFixtures'
import type { AuthApi } from './features/auth/authApi'
const auth=():AuthApi=>({me:vi.fn().mockResolvedValue(profile),login:vi.fn(),signup:vi.fn(),logout:vi.fn(),resetCsrf:vi.fn(),onUnauthorized:vi.fn(()=>()=>{})})
beforeEach(()=>{httpClient.invalidateCsrf();vi.stubGlobal('fetch',vi.fn(async(url:RequestInfo|URL)=>financeResponse(url)))})
afterEach(()=>vi.unstubAllGlobals())
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
