import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/httpClient'
import { authErrorMessage, useAuth } from '../auth/AuthProvider'

const length = (value: string) => Array.from(value).length
const accountError = (error: unknown) => error instanceof ApiError && error.code === 'INVALID_CREDENTIALS'
  ? '현재 비밀번호를 확인해 주세요.' : authErrorMessage(error)

export default function AccountManagement({openProfile}:{openProfile:()=>void}) {
  const auth = useAuth()
  const [dialog, setDialog] = useState<'password' | 'deletion' | null>(null)
  return <div className="settings-form">
    <label className="field"><span>이메일</span><input value={auth.profile?.email ?? ''} readOnly autoComplete="email" /></label>
    <button className="settings-row" disabled={auth.busy} onClick={openProfile}>프로필 설정</button>
    <button className="settings-row" disabled={auth.busy} onClick={() => setDialog('password')}>비밀번호 변경</button>
    <button className="settings-row account-delete" disabled={auth.busy} onClick={() => setDialog('deletion')}>회원 탈퇴</button>
    {dialog && <AccountDialog mode={dialog} close={() => setDialog(null)} />}
  </div>
}

function AccountDialog({ mode, close }: { mode: 'password' | 'deletion'; close: () => void }) {
  const auth = useAuth()
  const element = useRef<HTMLDialogElement>(null)
  const saving = useRef(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [failure, setFailure] = useState('')
  useEffect(() => {
    const dialog = element.current
    dialog?.showModal()
    return () => { if (dialog?.open) dialog.close() }
  }, [])
  const isPassword = mode === 'password'
  const valid = length(currentPassword) >= 1 && length(currentPassword) <= 128 && (isPassword
    ? length(newPassword) >= 15 && length(newPassword) <= 128 && newPassword === confirmation : agreed)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!valid || auth.busy || saving.current) return
    saving.current = true; setFailure('')
    try { if (isPassword) await auth.changePassword({ currentPassword, newPassword }); else await auth.deleteAccount({ currentPassword }) }
    catch (error) { setFailure(accountError(error)) }
    finally { saving.current = false }
  }
  return <dialog ref={element} className="guide-dialog account-dialog" aria-labelledby="account-dialog-title" aria-describedby="account-dialog-description" onCancel={event => { event.preventDefault(); if (!auth.busy) close() }}>
    <h2 id="account-dialog-title">{isPassword ? '비밀번호 변경' : '회원 탈퇴'}</h2>
    <p id="account-dialog-description">{isPassword ? '변경하면 모든 기기에서 로그아웃됩니다. 새 비밀번호로 다시 로그인해 주세요.' : '계정과 모든 예산·내역·메모가 즉시 삭제되며 복구할 수 없습니다.'}</p>
    <form onSubmit={submit} noValidate aria-busy={auth.busy}>
      <label className="field"><span>현재 비밀번호</span><input autoFocus type="password" autoComplete="current-password" value={currentPassword} disabled={auth.busy} onChange={event => { setCurrentPassword(event.target.value); setFailure('') }} /></label>
      {isPassword ? <>
        <label className="field"><span>새 비밀번호</span><input type="password" autoComplete="new-password" value={newPassword} disabled={auth.busy} onChange={event => { setNewPassword(event.target.value); setFailure('') }} /></label>
        <p className="form-help">15~128자로 입력해 주세요. 공백도 비밀번호에 포함됩니다.</p>
        <label className="field"><span>새 비밀번호 확인</span><input type="password" autoComplete="new-password" value={confirmation} disabled={auth.busy} onChange={event => { setConfirmation(event.target.value); setFailure('') }} /></label>
        {confirmation && newPassword !== confirmation && <p className="field-error">새 비밀번호가 일치하지 않아요.</p>}
      </> : <label className="account-confirm"><input type="checkbox" checked={agreed} disabled={auth.busy} onChange={event => setAgreed(event.target.checked)} />모든 데이터가 삭제됨을 확인했습니다.</label>}
      {failure && <p role="alert" className="field-error">{failure}</p>}
      <button type="submit" className="primary-button" disabled={!valid || auth.busy}>{isPassword ? '비밀번호 변경하기' : '탈퇴하기'}</button>
      <button type="button" className="settings-row" disabled={auth.busy} onClick={close}>취소</button>
    </form>
  </dialog>
}
