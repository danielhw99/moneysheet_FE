import type { CSSProperties } from 'react'
import type { Screen } from '../types/navigation'
import Icon, { type IconName } from './Icon'

const navItems: { key: Screen; label: string; icon: IconName }[] = [
  { key: 'home', label: '홈', icon: 'calendar' },
  { key: 'daily', label: 'Daily', icon: 'daily' },
  { key: 'monthly', label: 'Monthly', icon: 'monthly' },
  { key: 'my', label: 'MY', icon: 'user' },
]

export default function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen, menu?: boolean) => void }) {
  const selected = navItems.findIndex(item => item.key === screen)
  return (
    <nav className="bottom-nav" aria-label="하단 메뉴" data-has-selection={selected >= 0} style={{'--nav-index': selected} as CSSProperties}>
      {navItems.map((item) => (
        <button type="button" aria-current={screen === item.key ? 'page' : undefined} key={item.key} className={screen === item.key ? 'nav-item active' : 'nav-item'} onClick={() => go(item.key, true)}>
          <Icon name={item.icon} size={21} /><span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
