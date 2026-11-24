import { render, screen, fireEvent } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import BottomNav from './BottomNav'

it('marks the active destination and preserves menu navigation arguments',()=>{
 const go=vi.fn(),view=render(<BottomNav screen="daily" go={go}/>);
 expect(screen.getByRole('navigation',{name:'하단 메뉴'})).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Daily'})).toHaveAttribute('aria-current','page');
 for(const [name,destination] of [['홈','home'],['Daily','daily'],['Monthly','monthly'],['MY','my']]){const button=screen.getByRole('button',{name});expect(button).toHaveAttribute('type','button');fireEvent.click(button);expect(go).toHaveBeenLastCalledWith(destination,true);}
 view.rerender(<BottomNav screen="monthly" go={go}/>);
 expect(screen.getByRole('button',{name:'Monthly'})).toHaveAttribute('aria-current','page');
 expect(screen.getByRole('button',{name:'Daily'})).not.toHaveAttribute('aria-current');
})
