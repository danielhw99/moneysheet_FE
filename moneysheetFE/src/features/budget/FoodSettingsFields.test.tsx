import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FoodSettingsFields from './FoodSettingsFields'

describe('식비 설정',()=>{
 it('OFF에서도 토글은 사용 가능하고 하위 설정만 비활성화된다',()=>{
  const change=vi.fn()
  render(<FoodSettingsFields enabled={false} setEnabled={change} mode="threeInstallments" setMode={vi.fn()} amounts={{weekday:'',saturday:'',sunday:''}} setAmounts={vi.fn()} />)
  expect(screen.getByRole('switch',{name:'식비 사용'})).not.toBeDisabled()
  expect(screen.getByLabelText('지급 방식')).toBeDisabled()
  expect(screen.getByLabelText('주중 식비')).toBeDisabled()
  for(const name of ['주중 식비','토요일 식비','일요일 식비']){
   expect(screen.getByLabelText(name)).not.toBeRequired()
   expect(screen.getByLabelText(name)).toHaveAttribute('aria-required','false')
  }
  fireEvent.click(screen.getByRole('switch'))
  expect(change).toHaveBeenCalledWith(true)
 })
 it('ON에서는 입력과 두 지급 방식 선택을 제공한다',()=>{
  render(<FoodSettingsFields enabled={true} setEnabled={vi.fn()} mode="monthStart" setMode={vi.fn()} amounts={{weekday:'11000',saturday:'15000',sunday:'10000'}} setAmounts={vi.fn()} />)
  expect(screen.getByLabelText('지급 방식')).toHaveValue('monthStart')
  expect(screen.getByLabelText('주중 식비')).not.toBeDisabled()
  for(const name of ['주중 식비','토요일 식비','일요일 식비']){
   expect(screen.getByLabelText(name)).toBeRequired()
   expect(screen.getByLabelText(name)).toHaveAttribute('aria-required','true')
  }
  expect(screen.getAllByText('(필수)')).toHaveLength(3)
  expect(screen.getByText(/당일 식비만/)).toBeInTheDocument()
 })
})
