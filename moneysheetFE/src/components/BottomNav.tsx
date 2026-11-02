import type { Screen } from '../types/navigation'
import Icon, { type IconName } from './Icon'

const navItems: { key: Screen; label: string; icon: IconName }[] = [
  { key: 'home', label: '홈', icon: 'calendar' },
  { key: 'daily', label: 'Daily', icon: 'daily' },
  { key: 'monthly', label: 'Monthly', icon: 'monthly' },
  { key: 'my', label: 'MY', icon: 'user' },
]

export default function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button key={item.key} className={screen === item.key ? 'nav-item active' : 'nav-item'} onClick={() => go(item.key)}>
          <Icon name={item.icon} size={21} /><span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
