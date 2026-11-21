import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/httpClient'
import Header from '../../components/Header'
import FeedbackDialog from '../../components/FeedbackDialog'
import type { Screen } from '../../types/navigation'
import { authErrorMessage, useAuth } from '../auth/AuthProvider'
import ProfileAvatar from './ProfileAvatar'

export default function ProfileSettingsScreen({go}:{go:(screen:Screen)=>void}) {
 const auth=useAuth(), profile=auth.profile
 const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<string|null>(null)
 const [nickname,setNickname]=useState(profile?.nickname ?? '')
 const [photoError,setPhotoError]=useState(''),[nameError,setNameError]=useState('')
 const [photoNotice,setPhotoNotice]=useState(''),[nameNotice,setNameNotice]=useState('')
 const [deleting,setDeleting]=useState(false)
 const input=useRef<HTMLInputElement>(null),saving=useRef(false)
 useEffect(()=>{if(!file){setPreview(null);return}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url)},[file])
 const discard=()=>{setFile(null);if(input.current)input.current.value=''}
 const choose=(event:React.ChangeEvent<HTMLInputElement>)=>{
  const selected=event.target.files?.[0];if(!selected)return
  setPhotoError('');setPhotoNotice('')
  if(!['image/jpeg','image/png'].includes(selected.type) || selected.size===0){setPhotoError('JPEG 또는 PNG 사진을 선택해 주세요.');event.target.value='';return}
  if(selected.size>5*1024*1024){setPhotoError('사진은 5MiB 이하로 선택해 주세요.');event.target.value='';return}
  setFile(selected)
 }
 const savePhoto=async()=>{
  if(!file || auth.busy || saving.current)return
  saving.current=true;setPhotoError('');setPhotoNotice('')
  try{await auth.uploadAvatar(file);discard();setPhotoNotice('사진을 저장했어요.')}
  catch(error){setPhotoError(error instanceof ApiError && error.code==='VALIDATION' ? error.fieldErrors.find(item=>item.field==='file')?.message ?? '사진 형식과 크기를 확인해 주세요.' : authErrorMessage(error))}
  finally{saving.current=false}
 }
 const validName=Array.from(nickname.trim()).length>=1 && Array.from(nickname.trim()).length<=50
 const saveName=async(event:React.FormEvent)=>{
  event.preventDefault();if(!validName || auth.busy || saving.current)return
  saving.current=true;setNameError('');setNameNotice('')
  try{await auth.updateProfile({nickname:nickname.trim()});setNameNotice('닉네임을 변경했어요.')}
  catch(error){setNameError(authErrorMessage(error))}
  finally{saving.current=false}
 }
 return <main className="detail-shell profile-settings-screen">
  <Header title="프로필 설정" onBack={()=>{if(!auth.busy)go('my')}}/>
  <div className="profile-settings-body" aria-busy={auth.busy}>
   <section className="profile-centered profile-photo-editor" aria-label="사진 설정">
    <ProfileAvatar url={preview ?? profile?.avatarUrl} nickname={profile?.nickname ?? ''}/>
    <p className="form-help">JPEG·PNG, 최대 5MiB. 사진 중앙을 정사각형으로 잘라 저장합니다.</p>
    <label className="field"><span>사진 선택</span><input ref={input} type="file" accept="image/jpeg,image/png" disabled={auth.busy} onChange={choose}/></label>
    {file && <p className="selected-photo-name">{file.name}</p>}
    {photoError && <p className="field-error" role="alert">{photoError}</p>}
    {photoNotice && <p className="form-help" role="status">{photoNotice}</p>}
    <div className="profile-photo-actions">
     <button className="primary-button" disabled={!file || auth.busy} onClick={()=>void savePhoto()}>사진 저장</button>
     {file && <button className="secondary-button" disabled={auth.busy} onClick={()=>{discard();setPhotoError('')}}>선택 취소</button>}
     {profile?.avatarUrl && <button className="secondary-button" disabled={auth.busy} onClick={()=>setDeleting(true)}>사진 삭제</button>}
    </div>
   </section>
   <form className="settings-form nickname-form" onSubmit={saveName} noValidate>
    <label className="field"><span>닉네임</span><input value={nickname} disabled={auth.busy} autoComplete="nickname" aria-invalid={!validName} onChange={event=>{setNickname(event.target.value);setNameError('');setNameNotice('')}}/></label>
    {!validName && <p className="field-error">닉네임은 1~50자로 입력해 주세요.</p>}
    {nameError && <p className="field-error" role="alert">{nameError}</p>}
    {nameNotice && <p className="form-help" role="status">{nameNotice}</p>}
    <button className="primary-button" disabled={!validName || auth.busy || nickname.trim()===profile?.nickname}>닉네임 저장</button>
   </form>
  </div>
  <FeedbackDialog open={deleting} mode="confirm" title="프로필 사진 삭제" description="사진을 삭제하고 기본 프로필로 되돌릴까요?" confirmLabel="삭제" danger confirmDisabled={auth.busy} onClose={()=>setDeleting(false)} onConfirm={async()=>{await auth.deleteAvatar();discard();setPhotoError('');setPhotoNotice('사진을 삭제했어요.')}}/>
 </main>
}
