import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'
import { currentMonth } from '../../utils/date'
import BudgetSetupScreen from './BudgetSetupScreen'

function start(copied=false) {
 const api=createMockDataAccess(),done=vi.fn(),cancel=vi.fn()
 api.prepareBudget=vi.fn().mockResolvedValue({month:currentMonth(),status:'draft',copiedFromMonth:copied?'2026-10':null,items:copied?[{id:'51',name:'월세',categoryId:null,amount:10000}]:[],food:{enabled:null,paymentMode:'threeInstallments',weekday:null,saturday:null,sunday:null}})
 api.setupBudget=vi.fn().mockResolvedValue({})
 render(<DataProvider implementation={api}><BudgetSetupScreen month={currentMonth()} onDone={done} onCancel={cancel}/></DataProvider>)
 return {api,done,cancel}
}
const next=()=>fireEvent.click(screen.getByRole('button',{name:'다음: 식비 설정'}))
it.each(['2000-01','2999-01'])('allows leaving read-only month %s without preparing or saving',async month=>{
 const api=createMockDataAccess(),cancel=vi.fn()
 api.prepareBudget=vi.fn();api.setupBudget=vi.fn()
 render(<DataProvider implementation={api}><BudgetSetupScreen month={month} onDone={vi.fn()} onCancel={cancel}/></DataProvider>)
 expect(await screen.findByRole('alert')).toHaveTextContent('현재 월만')
 fireEvent.click(screen.getByRole('button',{name:'뒤로가기'}))
 expect(cancel).toHaveBeenCalledOnce()
 expect(api.prepareBudget).not.toHaveBeenCalled();expect(api.setupBudget).not.toHaveBeenCalled()
})
it('shows only one full-width step and preserves both drafts without saving between steps',async()=>{
 const {api}=start(true)
 expect(await screen.findByRole('region',{name:'고정비 설정'})).toBeVisible()
 expect(screen.queryByRole('region',{name:'식비 설정'})).not.toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'예산 저장'})).not.toBeInTheDocument()
 fireEvent.change(screen.getByLabelText('예산 금액 1'),{target:{value:'12345'}})
 next();expect(screen.getByRole('region',{name:'식비 설정'})).toBeVisible()
 expect(screen.getByRole('heading',{name:'식비 설정'})).toHaveFocus()
 fireEvent.click(screen.getByRole('switch',{name:'식비 사용'}))
 fireEvent.change(screen.getByLabelText('주중 식비'),{target:{value:'11000'}})
 fireEvent.change(screen.getByLabelText('지급 방식'),{target:{value:'monthStart'}})
 fireEvent.click(screen.getByRole('button',{name:'이전: 고정비 설정'}))
 expect(screen.getByLabelText('예산 금액 1')).toHaveValue('12345')
 next();expect(screen.getByLabelText('주중 식비')).toHaveValue('11000')
 expect(screen.getByLabelText('지급 방식')).toHaveValue('monthStart')
 expect(api.prepareBudget).toHaveBeenCalledOnce();expect(api.setupBudget).not.toHaveBeenCalled()
})
it('validates fixed rows before moving on but allows a completely empty list',async()=>{
 const {api}=start();await screen.findByRole('button',{name:'다음: 식비 설정'})
 fireEvent.click(screen.getByRole('button',{name:'+ 고정비 추가'}));next()
 expect(screen.getByRole('alert')).toHaveTextContent('항목')
 expect(screen.getByRole('region',{name:'고정비 설정'})).toBeVisible()
 fireEvent.change(screen.getByLabelText('항목명 1'),{target:{value:'월세'}})
 fireEvent.change(screen.getByLabelText('예산 금액 1'),{target:{value:'0'}});next()
 expect(screen.getByRole('region',{name:'고정비 설정'})).toBeVisible()
 fireEvent.click(screen.getByRole('button',{name:'항목 삭제 1'}));next()
 expect(screen.getByRole('region',{name:'식비 설정'})).toBeVisible();expect(api.setupBudget).not.toHaveBeenCalled()
})
it('treats a first-step form submit as next and saves explicit OFF only at the final step',async()=>{
 const {api,done}=start();const nextButton=await screen.findByRole('button',{name:'다음: 식비 설정'})
 fireEvent.submit(nextButton.closest('form')!)
 expect(api.setupBudget).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'식비 사용하지 않기'}))
 fireEvent.click(screen.getByRole('button',{name:'예산 저장'}))
 await waitFor(()=>expect(done).toHaveBeenCalledWith(true))
 expect(api.setupBudget).toHaveBeenCalledExactlyOnceWith(currentMonth(),{items:[],food:{enabled:false,paymentMode:'threeInstallments',weekday:null,saturday:null,sunday:null}})
})
it('blocks step and header navigation during saving and preserves copied IDs and both drafts on failure',async()=>{
 const {api,cancel}=start(true);await screen.findByRole('button',{name:'다음: 식비 설정'});next()
 let reject!:(error:Error)=>void
 api.setupBudget=vi.fn(()=>new Promise<Awaited<ReturnType<typeof api.setupBudget>>>((_,fail)=>{reject=fail}))
 fireEvent.click(screen.getByRole('button',{name:'식비 사용하지 않기'}))
 fireEvent.click(screen.getByRole('button',{name:'예산 저장'}))
 expect(await screen.findByRole('button',{name:'저장 중…'})).toBeDisabled()
 expect(screen.getByRole('button',{name:'이전: 고정비 설정'})).toBeDisabled()
 fireEvent.click(screen.getByRole('button',{name:'뒤로가기'}));expect(cancel).not.toHaveBeenCalled()
 expect(screen.getByRole('region',{name:'식비 설정'})).toBeVisible()
 await act(async()=>reject(new Error('저장 실패')))
 expect(screen.getByRole('alert')).toHaveTextContent('저장 실패')
 fireEvent.click(screen.getByRole('button',{name:'이전: 고정비 설정'}))
 expect(screen.getByLabelText('항목명 1')).toHaveValue('월세')
 expect(api.setupBudget).toHaveBeenCalledWith(currentMonth(),expect.objectContaining({items:[{id:'51',name:'월세',categoryId:null,amount:10000}]}))
})
it('keeps an unfinished inline category name when moving between steps',async()=>{
 const {api}=start(true)
 const select=await screen.findByRole('combobox',{name:/^카테고리/})
 await waitFor(()=>expect(select).toBeEnabled())
 fireEvent.change(select,{target:{value:'__add__'}})
 fireEvent.change(screen.getByLabelText('새 카테고리 이름'),{target:{value:'직접 입력 중'}})
 next();fireEvent.click(screen.getByRole('button',{name:'이전: 고정비 설정'}))
 expect(screen.getByLabelText('새 카테고리 이름')).toHaveValue('직접 입력 중')
 expect(api.setupBudget).not.toHaveBeenCalled()
})
it('returns from food to fixed costs with the header back button before cancelling setup',async()=>{
 const {cancel}=start();await screen.findByRole('button',{name:'다음: 식비 설정'});next()
 fireEvent.click(screen.getByRole('button',{name:'뒤로가기'}))
 expect(screen.getByRole('region',{name:'고정비 설정'})).toBeVisible();expect(cancel).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'뒤로가기'}));expect(cancel).toHaveBeenCalledOnce()
})
