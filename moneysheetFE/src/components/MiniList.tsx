import Icon from './Icon'

export default function MiniList({ title, onOpen, children, addLabel, onAdd }: { title: string; onOpen: () => void; children: React.ReactNode; addLabel: string; onAdd: () => void }) {
  return (
    <section className="mini-panel">
      <button className="panel-heading" onClick={onOpen}><strong>{title}</strong><Icon name="chevron" size={17} /></button>
      <div className="panel-scroll">{children}</div>
      <button className="panel-add" onClick={onAdd}><Icon name="plus" size={16} />{addLabel}</button>
    </section>
  )
}
