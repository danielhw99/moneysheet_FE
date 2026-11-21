import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from '../auth/AuthProvider'
import { createAuthApi } from '../auth/authApi'
import { ApiError } from '../../api/httpClient'
import ProfileSettingsScreen from './ProfileSettingsScreen'

const original={id:'7',email:'user@example.com',nickname:'Nick',avatarUrl:'/api/v1/me/avatar?v='+'a'.repeat(32)}
const createUrl=vi.fn(()=> 'blob:preview'),revokeUrl=vi.fn()
beforeEach(()=>{vi.stubGlobal('URL',class extends URL {static createObjectURL=createUrl; static revokeObjectURL=revokeUrl})})
afterEach(()=>vi.unstubAllGlobals())
function setup(){
 const api={...createAuthApi(),me:vi.fn().mockResolvedValue(original),uploadAvatar:vi.fn().mockResolvedValue({...original,avatarUrl:'/api/v1/me/avatar?v='+'b'.repeat(32)}),deleteAvatar:vi.fn().mockResolvedValue({...original,avatarUrl:null})}
 function View(){const auth=useAuth();return auth.profile?<><span>session:{auth.sessionKey}</span><ProfileSettingsScreen go={()=>{}}/></>:null}
 const view=render(<AuthProvider api={api}><View/></AuthProvider>);return {api,...view}
}
it('preserves the selected photo on failure, blocks duplicate saves and updates without ending the session',async()=>{
 const {api}=setup();let reject!:(e:unknown)=>void
 api.uploadAvatar.mockReturnValueOnce(new Promise((_,r)=>{reject=r}))
 const input=await screen.findByLabelText('사진 선택'),file=new File(['image'],'photo.png',{type:'image/png'})
 const session=screen.getByText(/session:/).textContent
 fireEvent.change(input,{target:{files:[file]}})
 expect(screen.getByRole('img',{name:'프로필 사진'})).toHaveAttribute('src','blob:preview')
 fireEvent.click(screen.getByRole('button',{name:'사진 저장'}));fireEvent.click(screen.getByRole('button',{name:'사진 저장'}))
 expect(api.uploadAvatar).toHaveBeenCalledTimes(1);expect(input).toBeDisabled()
 await act(async()=>reject(new ApiError(0,'NETWORK','offline')))
 expect(await screen.findByRole('alert')).toHaveTextContent('연결')
 expect(screen.getByText('photo.png')).toBeInTheDocument()
 fireEvent.click(screen.getByRole('button',{name:'사진 저장'}))
 await waitFor(()=>expect(screen.getByRole('img',{name:'프로필 사진'})).toHaveAttribute('src','/api/v1/me/avatar?v='+'b'.repeat(32)))
 expect(screen.getByText(/session:/).textContent).toBe(session)
 expect(revokeUrl).toHaveBeenCalledWith('blob:preview')
})
it('rejects unsupported and oversized files without uploading and cleans a preview on exit',async()=>{
 const {api,unmount}=setup();const input=await screen.findByLabelText('사진 선택')
 fireEvent.change(input,{target:{files:[new File(['x'],'photo.svg',{type:'image/svg+xml'})]}})
 expect(screen.getByRole('alert')).toHaveTextContent('JPEG')
 fireEvent.change(input,{target:{files:[new File([new Uint8Array(5*1024*1024+1)],'photo.png',{type:'image/png'})]}})
 expect(screen.getByRole('alert')).toHaveTextContent('5MiB')
 expect(api.uploadAvatar).not.toHaveBeenCalled()
 fireEvent.change(input,{target:{files:[new File(['image'],'photo.png',{type:'image/png'})]}})
 unmount();expect(revokeUrl).toHaveBeenCalledWith('blob:preview')
})
it('asks before deleting and restores initials after successful deletion',async()=>{
 HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
 HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
 const {api}=setup();fireEvent.click(await screen.findByRole('button',{name:'사진 삭제'}))
 expect(api.deleteAvatar).not.toHaveBeenCalled()
 fireEvent.click(screen.getByRole('button',{name:'삭제'}))
 await waitFor(()=>expect(api.deleteAvatar).toHaveBeenCalledTimes(1))
 await waitFor(()=>expect(screen.queryByRole('img',{name:'프로필 사진'})).not.toBeInTheDocument())
 expect(screen.getByLabelText('기본 프로필')).toHaveTextContent('N')
})
