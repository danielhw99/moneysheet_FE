import Icon from './Icon'

export default function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <header className="topbar">
      <div className="topbar-side">{onBack && <button className="icon-button" onClick={onBack} aria-label="뒤로가기"><Icon name="back" /></button>}</div>
      <div className="topbar-title">{title}</div>
      <div className="topbar-side right">{right}</div>
    </header>
  )
}
