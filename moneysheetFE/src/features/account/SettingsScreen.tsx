import AccountManagement from './AccountManagement'
import type { Screen } from '../../types/navigation'
import Icon from '../../components/Icon'
import Header from '../../components/Header'

export default function SimpleSettings({ type, go }: { type: 'account' | 'settings'; go: (s: Screen) => void }) {
  return (
    <main className="detail-shell settings-screen">
      <Header title={type === 'account' ? '계정관리' : '설정'} onBack={() => go('my')} />
      {type === 'account' ? <AccountManagement /> : <div className="menu-list settings-menu">
        <button><span>이용약관</span><Icon name="chevron" /></button>
        <button><span>개인정보처리방침</span><Icon name="chevron" /></button>
        <button><span>오픈소스 라이선스</span><Icon name="chevron" /></button>
        <div className="version">moneysheet 버전 1.0.0</div>
      </div>}
    </main>
  )
}
