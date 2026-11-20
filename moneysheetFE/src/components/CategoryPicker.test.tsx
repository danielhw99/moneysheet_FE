import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import CategoryPicker from './CategoryPicker'
import { DataProvider } from '../data/DataProvider'
import { createMockDataAccess } from '../data/mock/createMockDataAccess'
const category={id:'31',name:'식비',scope:'mainTransaction' as const,direction:'expense' as const}
it('shows initial loading inside the disabled select and leaves no empty status area after success',async()=>{
 const api=createMockDataAccess();let done!:(rows:typeof category[])=>void
 vi.spyOn(api,'getCategories').mockImplementation(()=>new Promise(resolve=>{done=resolve}))
 render(<DataProvider implementation={api}><CategoryPicker value={null} onChange={vi.fn()} scope="mainTransaction" direction="expense"/></DataProvider>)
 const select=screen.getByRole('combobox')
 expect(select).toBeDisabled();expect(select).toHaveAttribute('aria-busy','true')
 expect(screen.getByRole('option',{name:'카테고리 불러오는 중…'})).toBeInTheDocument()
 await waitFor(()=>expect(api.getCategories).toHaveBeenCalled())
 await act(async()=>done([category]))
 expect(select).toBeEnabled();expect(select).toHaveAttribute('aria-busy','false')
 expect(screen.queryByRole('status')).not.toBeInTheDocument()
 expect(document.querySelector('.category-picker-status')).not.toBeInTheDocument()
})
it('keeps query errors and retry accessible without reserving normal-state space',async()=>{
 const api=createMockDataAccess()
 vi.spyOn(api,'getCategories').mockRejectedValueOnce(new Error('category failed')).mockResolvedValue([category])
 render(<DataProvider implementation={api}><CategoryPicker value={null} onChange={vi.fn()} scope="mainTransaction" direction="expense"/></DataProvider>)
 await screen.findByText('category failed')
 expect(screen.getByRole('combobox')).toBeDisabled()
 expect(screen.getByRole('combobox')).toHaveAttribute('aria-describedby',document.querySelector('.category-picker-status')!.id)
 fireEvent.click(screen.getByRole('button',{name:'다시 불러오기'}))
 await waitFor(()=>expect(screen.getByRole('combobox')).toBeEnabled())
 expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})
it('preserves inline category creation and cancel',async()=>{
 const api=createMockDataAccess(),change=vi.fn()
 vi.spyOn(api,'getCategories').mockResolvedValue([category])
 vi.spyOn(api,'createCategory').mockResolvedValue({...category,id:'32',name:'교통'})
 render(<DataProvider implementation={api}><CategoryPicker value={null} onChange={change} scope="mainTransaction" direction="expense"/></DataProvider>)
 const select=screen.getByRole('combobox');await waitFor(()=>expect(select).toBeEnabled())
 fireEvent.change(select,{target:{value:'__add__'}})
 fireEvent.change(screen.getByLabelText('새 카테고리 이름'),{target:{value:'취소할 내용'}})
 fireEvent.click(screen.getByRole('button',{name:'추가 취소'}))
 expect(screen.queryByLabelText('새 카테고리 이름')).not.toBeInTheDocument()
 fireEvent.change(select,{target:{value:'__add__'}})
 fireEvent.change(screen.getByLabelText('새 카테고리 이름'),{target:{value:'교통'}})
 fireEvent.click(screen.getByRole('button',{name:'추가'}))
 await waitFor(()=>expect(change).toHaveBeenCalledWith('32'))
 expect(api.createCategory).toHaveBeenCalledWith({name:'교통',scope:'mainTransaction',direction:'expense'})
})
