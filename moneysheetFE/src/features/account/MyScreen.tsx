import { useState } from 'react'
import { authErrorMessage, useAuth } from '../auth/AuthProvider'
import type { Screen } from '../../types/navigation'
import Icon from '../../components/Icon'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'

export default function My({ go, showNavigation = true }: { go: (s: Screen) => void; showNavigation?: boolean }) {
  const auth = useAuth()
  const profile = auth.profile
  const [failure, setFailure] = useState('')
  const logout = async () => { setFailure(''); try { await auth.logout() } catch (error) { setFailure(authErrorMessage(error)) } }
  return (
    <main className="app-shell">
      <section className={`screen-content ${showNavigation ? '' : 'no-bottom-nav'}`}>
        <Header title="마이페이지" />
        {failure && <p role="alert" className="field-error">{failure}</p>}
        {profile && <div className="profile"><div className="avatar">{profile.nickname.slice(0, 1)}</div><div><b>{profile.nickname}</b><span>{profile.email}</span></div></div>}
        <div className="menu-list">
          <button onClick={() => go('account')}><Icon name="user" /><span>계정관리</span><Icon name="chevron" /></button>
          <button onClick={() => go('settings')}><Icon name="settings" /><span>설정</span><Icon name="chevron" /></button>
          <button className="logout" disabled={auth.busy} onClick={() => { void logout() }}><Icon name="logout" /><span>로그아웃</span></button>
        </div>
      </section>
      {showNavigation && <BottomNav screen="my" go={go} />}
    </main>
  )
}
