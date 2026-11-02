import { useDataQuery } from '../../data/useDataQuery'
import QueryStatus from '../../components/QueryStatus'
import type { Screen } from '../../types/navigation'
import Icon from '../../components/Icon'
import Header from '../../components/Header'

export default function SimpleSettings({ type, go }: { type: 'account' | 'settings'; go: (s: Screen) => void }) {
  return (
    <main className="detail-shell">
      <Header title={type === 'account' ? '계정관리' : '설정'} onBack={() => go('my')} />
      {type === 'account' ? <AccountFields /> : <div className="menu-list settings-menu">
        <button><span>이용약관</span><Icon name="chevron" /></button>
        <button><span>개인정보처리방침</span><Icon name="chevron" /></button>
        <button><span>오픈소스 라이선스</span><Icon name="chevron" /></button>
        <div className="version">moneysheet 버전 1.0.0</div>
      </div>}
    </main>
  )
}

function AccountFields() {
  const query = useDataQuery('profile', api => api.getProfile())
  const profile = query.data
  return <><QueryStatus {...query} />{profile && <div className="settings-form">
        <label className="field"><span>이메일</span><input defaultValue={profile.email} /></label>
        <label className="field"><span>닉네임</span><input defaultValue={profile.nickname} /></label>
        <button className="settings-row">비밀번호 변경<Icon name="chevron" /></button>
        <button className="primary-button">변경사항 저장</button>
      </div>}</>
}
