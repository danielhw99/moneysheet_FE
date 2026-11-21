import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import App from './App'
import { httpClient } from './api/httpClient'
import type { AuthApi } from './features/auth/authApi'
import { financeResponse, profile, month, daily } from './test/financeFixtures'
afterEach(()=>vi.unstubAllGlobals())
it('returns a direct editor to the selected Daily but a list editor to its list',async()=>{
 const selected=month+'-02'
 const row={id:'501',date:selected,time:'12:30',title:'Direct record',amount:100,direction:'expense',categoryId:null}
 const auth:AuthApi={me:vi.fn().mockResolvedValue(profile),login:vi.fn(),signup:vi.fn(),logout:vi.fn(),updateProfile:vi.fn(),changePassword:vi.fn(),deleteAccount:vi.fn(),requestEmailVerification:vi.fn(),confirmEmailVerification:vi.fn(),resetCsrf:vi.fn(),onUnauthorized:vi.fn(()=>()=>{})}
 httpClient.invalidateCsrf()
 const fetcher=vi.fn(async(url:RequestInfo|URL)=>{
  const u=new URL(String(url),'http://localhost')
  if(u.pathname.endsWith('/summaries/daily'))return new Response(JSON.stringify({...daily(u.searchParams.get('date')!),transactions:[{...row,date:u.searchParams.get('date')}]}))
  if(u.pathname.endsWith('/transactions/501'))return new Response(JSON.stringify(row))
  return financeResponse(url)
 })
 vi.stubGlobal('fetch',fetcher)
 render(<App authApi={auth}/>)
 const quickEntry=await screen.findByRole('button',{name:'빠른 작성'})
 await waitFor(()=>expect(quickEntry).toBeEnabled())
 fireEvent.click(await screen.findByRole('button',{name:new RegExp('^'+selected+'$')}))
 fireEvent.click(screen.getByRole('button',{name:new RegExp('^'+selected+'$')}))
 fireEvent.click(await screen.findByRole('button',{name:/Direct record/}))
 expect(await screen.findByLabelText('내용')).toHaveValue('Direct record')
 fireEvent.click(screen.getByRole('button',{name:'취소'}))
 await screen.findByRole('button',{name:'내역 추가'})
 const dailyCalls=fetcher.mock.calls.filter(([url])=>String(url).includes('/summaries/daily'))
 expect(new URL(String(dailyCalls.at(-1)![0]),'http://localhost').searchParams.get('date')).toBe(selected)
 fireEvent.click(screen.getByRole('button',{name:'내역'}))
 const add=await screen.findByRole('button',{name:'거래 추가'})
 await waitFor(()=>expect(add).toBeEnabled());fireEvent.click(add)
 await screen.findByRole('button',{name:'취소'})
 fireEvent.click(screen.getByRole('button',{name:'취소'}))
 expect(await screen.findByRole('button',{name:'거래 추가'})).toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'내역 추가'})).not.toBeInTheDocument()
})
