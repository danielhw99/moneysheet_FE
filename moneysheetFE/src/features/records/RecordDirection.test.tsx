import { render, screen, fireEvent } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import RecordForm from './RecordForm'
import { DataProvider } from '../../data/DataProvider'
import { createMockDataAccess } from '../../data/mock/createMockDataAccess'

it.each(['transactions','memos'] as const)('keeps direction styling and selected state in sync for %s',kind=>{
 render(<DataProvider implementation={createMockDataAccess()}><RecordForm kind={kind} initialDate="2026-11-02" budget={null} refreshing={false} onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()}/></DataProvider>)
 const expense=screen.getByRole('button',{name:kind==='memos'?'임시 출금':'지출'}),income=screen.getByRole('button',{name:kind==='memos'?'임시 입금':'입금'})
 expect(expense).toHaveAttribute('data-direction','expense');expect(income).toHaveAttribute('data-direction','income');expect(expense).toHaveAttribute('aria-pressed','true')
 fireEvent.click(income);expect(income).toHaveAttribute('aria-pressed','true');expect(expense).toHaveAttribute('aria-pressed','false')
 fireEvent.click(expense);expect(expense).toHaveAttribute('aria-pressed','true');expect(income).toHaveAttribute('aria-pressed','false')
})
it('preserves income selection when editing an existing record',()=>{
 render(<DataProvider implementation={createMockDataAccess()}><RecordForm kind="memos" item={{id:'1',date:'2026-11-02',time:'12:00',title:'정산',amount:1000,direction:'income',categoryId:null,completedOn:null}} initialDate="2026-11-02" budget={null} refreshing={false} onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()}/></DataProvider>)
 expect(screen.getByRole('button',{name:'임시 입금'})).toHaveAttribute('aria-pressed','true')
})
