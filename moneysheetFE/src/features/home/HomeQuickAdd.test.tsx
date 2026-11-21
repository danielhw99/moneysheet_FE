import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import HomeQuickAdd from './HomeQuickAdd'

describe('홈 빠른 작성',()=>{
 it.each([['내역 작성','transactions'],['메모 작성','memos'],['고정지출 지급 작성','fixed-pay']] as const)('opens %s for the selected date and closes the disclosure', (label,kind)=>{
  const onSelect=vi.fn()
  render(<HomeQuickAdd date="2026-11-03" disabled={false} onSelect={onSelect}/>)
  const trigger=screen.getByRole('button',{name:'빠른 작성'})
  expect(trigger).toHaveAttribute('aria-expanded','false')
  fireEvent.click(trigger)
  expect(screen.getByRole('navigation',{name:'빠른 작성 항목'})).toHaveTextContent('2026-11-03')
  fireEvent.click(screen.getByRole('button',{name:label}))
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(kind)
  expect(screen.queryByRole('navigation',{name:'빠른 작성 항목'})).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
 })
 it('closes with Escape or outside pointer interaction',()=>{
  render(<HomeQuickAdd date="2026-11-03" disabled={false} onSelect={vi.fn()}/>)
  const trigger=screen.getByRole('button',{name:'빠른 작성'})
  fireEvent.click(trigger);fireEvent.keyDown(document,{key:'Escape'})
  expect(trigger).toHaveAttribute('aria-expanded','false');expect(trigger).toHaveFocus()
  fireEvent.click(trigger);fireEvent.pointerDown(document.body)
  expect(trigger).toHaveAttribute('aria-expanded','false')
 })
 it('closes and blocks actions when disabled while open, without reopening when enabled',()=>{
  const onSelect=vi.fn(),ui=(disabled:boolean)=><HomeQuickAdd date="2026-11-03" disabled={disabled} onSelect={onSelect}/>
  const view=render(ui(false))
  fireEvent.click(screen.getByRole('button',{name:'빠른 작성'}))
  const staleAction=screen.getByRole('button',{name:'내역 작성'})
  view.rerender(ui(true));fireEvent.click(staleAction)
  expect(onSelect).not.toHaveBeenCalled();expect(screen.getByRole('button',{name:'빠른 작성'})).toBeDisabled()
  expect(screen.queryByRole('navigation',{name:'빠른 작성 항목'})).not.toBeInTheDocument()
  view.rerender(ui(false));expect(screen.getByRole('button',{name:'빠른 작성'})).toHaveAttribute('aria-expanded','false')
 })
})
