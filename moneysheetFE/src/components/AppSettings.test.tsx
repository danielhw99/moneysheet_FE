import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import AppSettings from './AppSettings'

it('opens a disclosure and runs the guide action without leaving the dropdown open', async () => {
 const openGuide=vi.fn()
 render(<AppSettings openGuide={openGuide} />)
 const button=screen.getByRole('button',{name:'앱 설정'})
 await userEvent.click(button)
 expect(button).toHaveAttribute('aria-expanded','true')
 expect(screen.getByRole('button',{name:/카테고리 관리/})).toBeDisabled()
 await userEvent.click(screen.getByRole('button',{name:'사용 가이드'}))
 expect(openGuide).toHaveBeenCalledTimes(1)
 expect(button).toHaveFocus()
 expect(screen.queryByRole('navigation',{name:'앱 설정 항목'})).not.toBeInTheDocument()
})
it('closes on outside click, Escape, and keyboard focus leaving the dropdown', async () => {
 render(<><AppSettings openGuide={()=>{}} /><button>외부 버튼</button></>)
 const trigger=screen.getByRole('button',{name:'앱 설정'})
 await userEvent.click(trigger)
 await userEvent.click(screen.getByRole('button',{name:'외부 버튼'}))
 expect(trigger).toHaveAttribute('aria-expanded','false')
 await userEvent.click(trigger)
 await userEvent.tab()
 expect(screen.getByRole('button',{name:'사용 가이드'})).toHaveFocus()
 await userEvent.keyboard('{Escape}')
 expect(trigger).toHaveAttribute('aria-expanded','false')
 expect(trigger).toHaveFocus()
 await userEvent.click(trigger)
 await userEvent.tab(); await userEvent.tab()
 expect(trigger).toHaveAttribute('aria-expanded','false')
})
it('cannot open during a pending save', () => {
 render(<AppSettings openGuide={()=>{}} disabled />)
 fireEvent.click(screen.getByRole('button',{name:'앱 설정'}))
 expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
})
