import { demoProfile } from '../../data/mock/fixtures'
import type { Screen } from '../../types/navigation'
import Icon from '../../components/Icon'
import Header from '../../components/Header'
import BottomNav from '../../components/BottomNav'

export default function My({ go }: { go: (s: Screen) => void }) {
  return (
    <main className="app-shell">
      <section className="screen-content">
        <Header title="마이페이지" />
        <div className="profile"><div className="avatar">{demoProfile.nickname.slice(0, 1)}</div><div><b>{demoProfile.nickname}</b><span>{demoProfile.email}</span></div></div>
        <div className="menu-list">
          <button onClick={() => go('account')}><Icon name="user" /><span>계정관리</span><Icon name="chevron" /></button>
          <button onClick={() => go('settings')}><Icon name="settings" /><span>설정</span><Icon name="chevron" /></button>
          <button className="logout" onClick={() => go('login')}><Icon name="logout" /><span>로그아웃</span></button>
        </div>
      </section>
      <BottomNav screen="my" go={go} />
    </main>
  )
}
