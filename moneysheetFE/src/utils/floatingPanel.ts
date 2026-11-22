export type ViewBounds = { left: number; top: number; right: number; bottom: number }
type Anchor = { top: number; bottom: number; right: number }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

export function placeFloatingPanel(anchor: Anchor, bounds: ViewBounds) {
  const width = Math.min(280, Math.max(0, bounds.right - bounds.left))
  const below = clamp(anchor.bottom + 6, bounds.top, bounds.bottom)
  const above = clamp(anchor.top - 6, bounds.top, bounds.bottom)
  const belowSpace = bounds.bottom - below, aboveSpace = above - bounds.top
  const side = belowSpace < 160 && aboveSpace > belowSpace ? 'above' : 'below'
  return { left: clamp(anchor.right - width, bounds.left, bounds.right - width), width,
    top: side === 'above' ? above : below, maxHeight: side === 'above' ? aboveSpace : belowSpace, side }
}

// Frame padding already includes safe area insets; intersect rather than adding them twice.
export function visibleViewportBounds(frame: Element | null): ViewBounds {
  const viewport = window.visualViewport
  let left = viewport?.offsetLeft ?? 0, top = viewport?.offsetTop ?? 0
  let right = left + (viewport?.width ?? window.innerWidth), bottom = top + (viewport?.height ?? window.innerHeight)
  const rect = frame?.getBoundingClientRect()
  if (frame && rect && rect.width > 0 && rect.height > 0) {
    const style = getComputedStyle(frame)
    const padding = (value: string) => Number.parseFloat(value) || 0
    left = Math.max(left, rect.left + padding(style.paddingLeft))
    top = Math.max(top, rect.top + padding(style.paddingTop))
    right = Math.min(right, rect.right - padding(style.paddingRight))
    bottom = Math.min(bottom, rect.bottom - padding(style.paddingBottom))
  }
  return { left: left + 8, top: top + 8, right: Math.max(left + 8, right - 8), bottom: Math.max(top + 8, bottom - 8) }
}
