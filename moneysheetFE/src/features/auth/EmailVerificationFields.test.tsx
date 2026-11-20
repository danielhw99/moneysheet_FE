import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EmailVerificationFields from './EmailVerificationFields'
import { ApiError } from '../../api/httpClient'

const sent = { challengeId: '12345678-1234-1234-1234-123456789abc', expiresAt: new Date(Date.now()+600000).toISOString(), resendAfterSeconds: 60 }
const verified = { verificationToken: 'A'.repeat(43), expiresAt: new Date(Date.now()+600000).toISOString() }
describe('signup email verification', () => {
  it('counts down Retry-After after the first send fails and stops its timer at zero', async () => {
    vi.useFakeTimers()
    try {
      const request=vi.fn().mockRejectedValueOnce(new ApiError(429,'RATE_LIMITED','wait',[],'',3)).mockResolvedValue(sent)
      render(<EmailVerificationFields email="u@example.com" emailValid disabled={false} request={request} confirm={vi.fn()} onVerified={vi.fn()} />)
      await act(async()=>fireEvent.click(screen.getByRole('button',{name:'인증번호 받기'})))
      expect(screen.getByRole('button',{name:'3초 후 재발송'})).toBeDisabled()
      expect(screen.queryByLabelText('인증번호')).not.toBeInTheDocument()
      await act(async()=>vi.advanceTimersByTimeAsync(1000))
      expect(screen.getByRole('button',{name:'2초 후 재발송'})).toBeDisabled()
      await act(async()=>vi.advanceTimersByTimeAsync(2000))
      expect(screen.getByRole('button',{name:'인증번호 받기'})).toBeEnabled()
      expect(vi.getTimerCount()).toBe(0)
      await act(async()=>fireEvent.click(screen.getByRole('button',{name:'인증번호 받기'})))
      expect(request).toHaveBeenCalledTimes(2)
      expect(screen.getByLabelText('인증번호')).toBeInTheDocument()
    } finally {cleanup();vi.useRealTimers()}
  })
  it('stops after a successful resend cooldown and restarts to expire a confirmed proof', async () => {
    vi.useFakeTimers()
    try {
      const onVerified=vi.fn(), confirm=vi.fn(async()=>({...verified,expiresAt:new Date(Date.now()+600000).toISOString()}))
      render(<EmailVerificationFields email="u@example.com" emailValid disabled={false} request={vi.fn().mockResolvedValue(sent)} confirm={confirm} onVerified={onVerified} />)
      await act(async()=>fireEvent.click(screen.getByRole('button',{name:'인증번호 받기'})))
      await act(async()=>vi.advanceTimersByTimeAsync(60000))
      expect(screen.getByRole('button',{name:'인증번호 다시 받기'})).toBeEnabled()
      expect(vi.getTimerCount()).toBe(0)
      fireEvent.change(screen.getByLabelText('인증번호'),{target:{value:'012345'}})
      await act(async()=>fireEvent.click(screen.getByRole('button',{name:'인증번호 확인'})))
      expect(onVerified).toHaveBeenLastCalledWith(verified.verificationToken)
      await act(async()=>vi.advanceTimersByTimeAsync(600000))
      expect(onVerified).toHaveBeenLastCalledWith('')
      expect(screen.queryByText('이메일 인증이 완료됐어요.')).not.toBeInTheDocument()
      expect(vi.getTimerCount()).toBe(0)
    } finally {cleanup();vi.useRealTimers()}
  })
  it('requests and confirms a numeric code without exposing a bypass', async () => {
    const request=vi.fn().mockResolvedValue(sent), confirm=vi.fn().mockResolvedValue(verified), onVerified=vi.fn()
    render(<EmailVerificationFields email="u@example.com" emailValid disabled={false} request={request} confirm={confirm} onVerified={onVerified} />)
    fireEvent.click(screen.getByRole('button',{name:'인증번호 받기'}))
    const input=await screen.findByLabelText('인증번호')
    fireEvent.change(input,{target:{value:'012345'}})
    fireEvent.click(screen.getByRole('button',{name:'인증번호 확인'}))
    await waitFor(()=>expect(onVerified).toHaveBeenCalledWith(verified.verificationToken))
    expect(confirm).toHaveBeenCalledWith({email:'u@example.com',challengeId:sent.challengeId,code:'012345'})
    expect(screen.getByText('이메일 인증이 완료됐어요.')).toBeInTheDocument()
  })
  it('ignores an old send response after the email changes', async () => {
    let done!:(v:typeof sent)=>void
    const request=vi.fn(()=>new Promise<typeof sent>(resolve=>{done=resolve})), confirm=vi.fn(),onVerified=vi.fn()
    const props={emailValid:true,disabled:false,request,confirm,onVerified}
    const view=render(<EmailVerificationFields {...props} email="old@example.com" />)
    fireEvent.click(screen.getByRole('button',{name:'인증번호 받기'}))
    view.rerender(<EmailVerificationFields {...props} email="new@example.com" />)
    await act(async()=>done(sent))
    expect(screen.queryByLabelText('인증번호')).not.toBeInTheDocument()
    expect(onVerified).not.toHaveBeenCalledWith(verified.verificationToken)
  })
  it('keeps code after a confirmation failure and prevents duplicate submissions', async () => {
    let reject!:(e:Error)=>void
    const request=vi.fn().mockResolvedValue(sent), confirm=vi.fn(()=>new Promise<typeof verified>((_,fail)=>{reject=fail})),onVerified=vi.fn()
    render(<EmailVerificationFields email="u@example.com" emailValid disabled={false} request={request} confirm={confirm} onVerified={onVerified} />)
    fireEvent.click(screen.getByRole('button',{name:'인증번호 받기'}))
    fireEvent.change(await screen.findByLabelText('인증번호'),{target:{value:'012345'}})
    const button=screen.getByRole('button',{name:'인증번호 확인'})
    fireEvent.click(button);fireEvent.click(button)
    expect(confirm).toHaveBeenCalledTimes(1)
    await act(async()=>reject(new Error('offline')))
    expect(screen.getByLabelText('인증번호')).toHaveValue('012345')
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
  it('never accepts confirmation for a previous email', async () => {
    let done!:(v:typeof verified)=>void
    const request=vi.fn().mockResolvedValue(sent), confirm=vi.fn(()=>new Promise<typeof verified>(resolve=>{done=resolve})),onVerified=vi.fn()
    const props={emailValid:true,disabled:false,request,confirm,onVerified}
    const view=render(<EmailVerificationFields {...props} email="old@example.com" />)
    fireEvent.click(screen.getByRole('button',{name:'인증번호 받기'}))
    fireEvent.change(await screen.findByLabelText('인증번호'),{target:{value:'012345'}})
    fireEvent.click(screen.getByRole('button',{name:'인증번호 확인'}))
    view.rerender(<EmailVerificationFields {...props} email="new@example.com" />)
    await act(async()=>done(verified))
    expect(onVerified).not.toHaveBeenCalledWith(verified.verificationToken)
    expect(screen.queryByText('이메일 인증이 완료됐어요.')).not.toBeInTheDocument()
  })
})
