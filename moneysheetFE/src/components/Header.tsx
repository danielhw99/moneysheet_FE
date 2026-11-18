import Icon from './Icon'

export default function Header({ title, onBack, right, centerTitle = false }: { title: string; onBack?: () => void; right?: React.ReactNode; centerTitle?: boolean }) {
  return (
    <header className={`topbar${centerTitle ? ' centered-title' : ''}`}>
      <div className="topbar-side">{onBack && <button className="icon-button" onClick={onBack} aria-label="뒤로가기"><Icon name="back" /></button>}</div>
      <div className="topbar-title">{title}</div>
      <div className="topbar-side right">{right}</div>
    </header>
  )
}
