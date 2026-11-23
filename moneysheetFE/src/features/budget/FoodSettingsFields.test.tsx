import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import FoodSettingsFields from './FoodSettingsFields'

describe('식비 설정',()=>{
 it('always requires food and has no usage toggle',()=>{
  render(<FoodSettingsFields mode="threeInstallments" setMode={vi.fn()} amounts={{weekday:'',saturday:'',sunday:''}} setAmounts={vi.fn()}/>)
  expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  for(const name of ['주중 식비','토요일 식비','일요일 식비']) expect(screen.getByLabelText(name)).toBeRequired()
 })
 it('ON에서는 입력과 두 지급 방식 선택을 제공한다',()=>{
  render(<FoodSettingsFields mode="monthStart" setMode={vi.fn()} amounts={{weekday:'11000',saturday:'15000',sunday:'10000'}} setAmounts={vi.fn()} />)
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
