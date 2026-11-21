import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import Settings from './SettingsScreen'
import ProfileSettingsScreen from './ProfileSettingsScreen'
import { AuthProvider, useAuth } from '../auth/AuthProvider'
import type { AuthApi } from '../auth/authApi'
import { ApiError } from '../../api/httpClient'
HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
const profile={id:'7',email:'a@example.com',nickname:'Nick'}
function api():AuthApi{return {requestEmailVerification: vi.fn(), confirmEmailVerification: vi.fn(), me: vi.fn().mockResolvedValue(profile),login:vi.fn(),signup:vi.fn(),logout:vi.fn(),resetCsrf:vi.fn(),onUnauthorized:vi.fn(()=>()=>{}),uploadAvatar: vi.fn(), deleteAvatar: vi.fn(), updateProfile:vi.fn().mockResolvedValue({...profile,nickname:'New'}),changePassword:vi.fn().mockResolvedValue(undefined),deleteAccount:vi.fn().mockResolvedValue(undefined)}}
function Probe({profileScreen=false}:{profileScreen?:boolean}){const a=useAuth();if(a.initializing)return null;if(!a.profile)return <p>로그인 필요 {a.notice}</p>;return <><p>현재 사용자: {a.profile.nickname}</p><>{profileScreen?<ProfileSettingsScreen go={()=>{}}/>:<Settings type="account" go={()=>{}}/>}</></>}
const start=(a:AuthApi,profileScreen=false)=>render(<AuthProvider api={a}><Probe profileScreen={profileScreen}/></AuthProvider>)
it('updates nickname without logging out or letting an old profile overwrite it',async()=>{
 const a=api();start(a,true);const field=await screen.findByLabelText('닉네임');await waitFor(()=>expect(field).toHaveValue('Nick'));let resolve!:(v:typeof profile)=>void;vi.mocked(a.me).mockReturnValueOnce(new Promise(r=>{resolve=r}));act(()=>window.dispatchEvent(new Event('focus')))
 fireEvent.change(field,{target:{value:' New '}});fireEvent.click(screen.getByRole('button',{name:'닉네임 저장'}));expect(await screen.findByText('현재 사용자: New')).toBeInTheDocument();await act(async()=>resolve(profile));expect(screen.getByText('현재 사용자: New')).toBeInTheDocument();expect(a.updateProfile).toHaveBeenCalledWith({nickname:'New'})
})
it('keeps password inputs and session on incorrect current password',async()=>{
 const a=api();vi.mocked(a.changePassword).mockRejectedValue(new ApiError(401,'INVALID_CREDENTIALS','bad'));start(a);await userEvent.click(await screen.findByRole('button',{name:'비밀번호 변경'}));fireEvent.change(screen.getByLabelText('현재 비밀번호'),{target:{value:' current '}});fireEvent.change(screen.getByLabelText('새 비밀번호'),{target:{value:'a unique new password!'}});fireEvent.change(screen.getByLabelText('새 비밀번호 확인'),{target:{value:'a unique new password!'}});await userEvent.click(screen.getByRole('button',{name:'비밀번호 변경하기'}));expect(await screen.findByRole('alert')).toHaveTextContent('현재 비밀번호');expect(screen.getByLabelText('현재 비밀번호')).toHaveValue(' current ');expect(screen.getByText('현재 사용자: Nick')).toBeInTheDocument()
})
it('requires matching new passwords and clears the session after successful change',async()=>{
 const a=api();start(a);await userEvent.click(await screen.findByRole('button',{name:'비밀번호 변경'}));fireEvent.change(screen.getByLabelText('현재 비밀번호'),{target:{value:'current'}});fireEvent.change(screen.getByLabelText('새 비밀번호'),{target:{value:'a unique new password!'}});expect(screen.getByRole('button',{name:'비밀번호 변경하기'})).toBeDisabled();fireEvent.change(screen.getByLabelText('새 비밀번호 확인'),{target:{value:'a unique new password!'}});await userEvent.click(screen.getByRole('button',{name:'비밀번호 변경하기'}));expect(await screen.findByText(/로그인 필요/)).toHaveTextContent('비밀번호가 변경');expect(a.resetCsrf).toHaveBeenCalled()
})
it('requires explicit deletion confirmation and removes only own guide state',async()=>{
 const a=api();localStorage.setItem('moneysheet:onboarding:v1:7','done');localStorage.setItem('moneysheet:onboarding:v1:8','done');start(a);await userEvent.click(await screen.findByRole('button',{name:'회원 탈퇴'}));fireEvent.change(screen.getByLabelText('현재 비밀번호'),{target:{value:'current'}});expect(screen.getByRole('button',{name:'탈퇴하기'})).toBeDisabled();await userEvent.click(screen.getByRole('checkbox'));await userEvent.click(screen.getByRole('button',{name:'탈퇴하기'}));await screen.findByText(/로그인 필요/);expect(a.deleteAccount).toHaveBeenCalledWith({currentPassword:'current'});expect(localStorage.getItem('moneysheet:onboarding:v1:7')).toBeNull();expect(localStorage.getItem('moneysheet:onboarding:v1:8')).toBe('done')
})
it('prevents duplicate submissions while pending and keeps inputs on network failure',async()=>{
 const a=api();let reject!:(e:unknown)=>void;vi.mocked(a.updateProfile).mockReturnValue(new Promise((_,r)=>{reject=r}));start(a,true);const field=await screen.findByLabelText('닉네임');await waitFor(()=>expect(field).toHaveValue('Nick'));fireEvent.change(field,{target:{value:'New'}});const button=screen.getByRole('button',{name:'닉네임 저장'});await userEvent.click(button);await userEvent.click(button);expect(a.updateProfile).toHaveBeenCalledTimes(1);await act(async()=>reject(new ApiError(0,'NETWORK','offline')));expect(await screen.findByRole('alert')).toBeInTheDocument();expect(screen.getByLabelText('닉네임')).toHaveValue('New')
})
