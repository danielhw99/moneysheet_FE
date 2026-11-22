import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import TimePicker from './TimePicker'

it('renders outside the clipping form and keeps portal clicks active until a minute is selected',()=>{
 const onChange=vi.fn()
 const view=render(<div className="phone-frame"><form><TimePicker value="10:30" onChange={onChange}/></form></div>)
 fireEvent.click(screen.getByRole('button',{name:'시간 선택: 10:30'}))
 expect(view.container.querySelector('form')?.contains(screen.getByRole('group',{name:'시 선택'}))).toBe(false)
 const hour=screen.getByRole('button',{name:'12시'});fireEvent.pointerDown(hour);fireEvent.click(hour)
 const minute=screen.getByRole('button',{name:'00분'});fireEvent.pointerDown(minute);fireEvent.click(minute)
 expect(onChange).toHaveBeenCalledExactlyOnceWith('12:00')
 expect(screen.queryByRole('group',{name:'분 선택'})).not.toBeInTheDocument()
 expect(screen.getByRole('button',{name:'시간 선택: 10:30'})).toHaveFocus()
})
it('closes on Escape, outside pointer and disabled without committing a draft hour',()=>{
 const onChange=vi.fn(),view=render(<TimePicker value="10:30" onChange={onChange}/>)
 const trigger=screen.getByRole('button',{name:'시간 선택: 10:30'})
 fireEvent.click(trigger);fireEvent.keyDown(screen.getByRole('button',{name:'10시'}),{key:'Escape'})
 expect(screen.queryByRole('group')).not.toBeInTheDocument();expect(trigger).toHaveFocus()
 fireEvent.click(trigger);fireEvent.pointerDown(document.body);expect(screen.queryByRole('group')).not.toBeInTheDocument()
 fireEvent.click(trigger);view.rerender(<TimePicker value="10:30" onChange={onChange} disabled/>)
 expect(screen.queryByRole('group')).not.toBeInTheDocument();expect(onChange).not.toHaveBeenCalled()
})
