import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import GuideDialog from './GuideDialog'
import { OnboardingProvider, useOnboarding } from './OnboardingProvider'
function OpenGuide() { const guide=useOnboarding()!;return <button onClick={guide.openGuide}>open</button> }
function start(){localStorage.clear();HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')};const finish=vi.fn();render(<OnboardingProvider userId="guide-user"><OpenGuide/><GuideDialog onFinish={finish}/></OnboardingProvider>);fireEvent.click(screen.getByText('open'));return finish}
it('walks eight pages, preserves previous navigation and resets replay',()=>{
 const finish=start();expect(screen.getByRole('heading',{name:'머니시트 100% 활용 가이드!'})).toBeInTheDocument();expect(screen.queryByRole('button',{name:'이전'})).not.toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:/다음:/}));expect(screen.getByText(/오늘 식비와 오늘 일반 입금을 더하고/)).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'이전'}));expect(screen.getByText('1 / 8')).toBeInTheDocument()
 for(let i=0;i<7;i++)fireEvent.click(screen.getByRole('button',{name:/다음:/}))
 fireEvent.click(screen.getByRole('button',{name:'시작하기'}));expect(finish).toHaveBeenCalledOnce()
 fireEvent.click(screen.getByText('open'));expect(screen.getByText('1 / 8')).toBeInTheDocument()
})
it('omits record button instructions and warns about manual fixed payments',()=>{
 start();for(let i=0;i<2;i++)fireEvent.click(screen.getByRole('button',{name:/다음:/}))
 expect(screen.queryByText(/추가 버튼|기록 선택|내역 제목/)).not.toBeInTheDocument()
 for(let i=0;i<2;i++)fireEvent.click(screen.getByRole('button',{name:/다음:/}))
 expect(screen.getByText('수동으로 모든 고정비 출금 내역을 기록해 주어야 합니다.')).toBeInTheDocument()
})
it('skips and handles Escape without completing a replay',()=>{const finish=start();fireEvent.click(screen.getByRole('button',{name:'건너뛰기'}));expect(finish).toHaveBeenCalledOnce();fireEvent.click(screen.getByText('open'));fireEvent(screen.getByRole('dialog'),new Event('cancel',{bubbles:true,cancelable:true}));expect(finish).toHaveBeenCalledTimes(2)})
