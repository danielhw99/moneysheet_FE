import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import QueryStatus from './QueryStatus'

it('keeps a quiet loading announcement and retains visible error recovery', () => {
 const retry=vi.fn()
 const view=render(<QueryStatus loading error="" retry={retry} quietLoading />)
 expect(screen.getByRole('status')).toHaveTextContent('불러오는 중')
 expect(screen.getByRole('status')).toHaveClass('query-status-loading')
 view.rerender(<QueryStatus loading={false} error="조회 실패" retry={retry} quietLoading />)
 expect(screen.getByRole('alert')).toHaveTextContent('조회 실패')
 expect(screen.getByRole('alert')).not.toHaveClass('query-status-loading')
 fireEvent.click(screen.getByRole('button',{name:'다시 불러오기'}))
 expect(retry).toHaveBeenCalledTimes(1)
 view.rerender(<QueryStatus loading={false} error="" retry={retry} quietLoading />)
 expect(screen.queryByRole('status')).not.toBeInTheDocument()
 expect(screen.queryByRole('alert')).not.toBeInTheDocument()
 expect(screen.queryByRole('button',{name:'다시 불러오기'})).not.toBeInTheDocument()
})
it('keeps the initial full-page loading presentation available', () => {
 render(<QueryStatus loading error="" retry={()=>{}} />)
 expect(screen.getByRole('status')).not.toHaveClass('query-status-loading')
 expect(screen.getByRole('status').querySelector('.loading-spinner')).toHaveAttribute('aria-hidden','true')
})
it('avoids a visual spinner for quiet loading and never replaces error recovery with a spinner',()=>{
 const view=render(<QueryStatus loading error="" retry={()=>{}} quietLoading/>)
 expect(screen.getByRole('status').querySelector('.loading-spinner')).toBeNull()
 view.rerender(<QueryStatus loading error="조회 실패" retry={()=>{}}/>)
 expect(screen.getByRole('alert')).toHaveTextContent('조회 실패')
 expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
