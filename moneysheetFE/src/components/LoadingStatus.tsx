import type { ReactNode } from 'react'

export default function LoadingStatus({ children = '불러오는 중…', className = '', quiet = false }: { children?: ReactNode; className?: string; quiet?: boolean }) {
  return <p role="status" aria-live="polite" className={`loading-status ${className}`}>
    {!quiet && <span className="loading-spinner" aria-hidden="true"/>}<span>{children}</span>
  </p>
}
