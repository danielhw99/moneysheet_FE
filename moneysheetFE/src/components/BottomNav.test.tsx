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

it('positions the initial highlight at the selected destination',()=>{
 render(<BottomNav screen="monthly" go={vi.fn()}/>);
 expect(screen.getByRole('navigation')).toHaveStyle('--nav-index: 2');
})

it('updates selection on the same mounted navigation',()=>{
 const view=render(<BottomNav screen="home" go={vi.fn()}/>);const nav=screen.getByRole('navigation');
 view.rerender(<BottomNav screen="monthly" go={vi.fn()}/>);
 expect(screen.getByRole('navigation')).toBe(nav);expect(nav).toHaveStyle('--nav-index: 2');
 expect(screen.getByRole('button',{name:'Monthly'})).toHaveAttribute('aria-current','page');
})

it.each(['account','settings','categories'] as const)('does not highlight Home for unmatched %s screens',destination=>{
 const view=render(<BottomNav screen="home" go={vi.fn()}/>);
 view.rerender(<BottomNav screen={destination} go={vi.fn()}/>);
 expect(screen.getByRole('navigation')).toHaveAttribute('data-has-selection','false');
 expect(screen.getByRole('navigation')).toHaveStyle('--nav-index: -1');
 for(const button of screen.getAllByRole('button'))expect(button).not.toHaveAttribute('aria-current');
 view.rerender(<BottomNav screen="daily" go={vi.fn()}/>);
 expect(screen.getByRole('navigation')).toHaveAttribute('data-has-selection','true');
 expect(screen.getByRole('button',{name:'Daily'})).toHaveAttribute('aria-current','page');
})
