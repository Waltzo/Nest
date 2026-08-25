import type { LinkProps } from '../../types'
import { useElementSize, clamp } from '../../hooks/useElementSize'

export default function LinkCard({ props }: { props: Record<string, unknown> }) {
  const p = props as unknown as LinkProps
  const icon = p.icon || '🔗'
  const [ref, { w, h }] = useElementSize<HTMLAnchorElement>()

  // Two layouts only: wide cell (≈2 cols) → horizontal (icon + name side by
  // side); otherwise (≈1x1) → vertical (icon over a small name).
  const horizontal = w >= 150

  const common: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    overflow: 'hidden',
  }

  const nameStyle: React.CSSProperties = {
    fontWeight: 600,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  if (horizontal) {
    const iconSize = clamp(20, h * 0.6, 56)
    const nameSize = clamp(11, h * 0.32, 22)
    return (
      <a
        ref={ref}
        href={p.url || '#'}
        target="_blank"
        rel="noreferrer noopener"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ ...common, flexDirection: 'row', gap: clamp(6, w * 0.04, 20) }}
      >
        <span style={{ fontSize: iconSize, lineHeight: 1, color: p.color }}>{icon}</span>
        {p.title && <span style={{ ...nameStyle, fontSize: nameSize }}>{p.title}</span>}
      </a>
    )
  }

  // Vertical (1x1)
  const base = Math.min(w || 0, h || 0)
  const iconSize = clamp(20, base * 0.42, 60)
  const nameSize = clamp(9, base * 0.16, 16)
  return (
    <a
      ref={ref}
      href={p.url || '#'}
      target="_blank"
      rel="noreferrer noopener"
      onMouseDown={(e) => e.stopPropagation()}
      style={{ ...common, flexDirection: 'column', gap: clamp(2, base * 0.05, 8) }}
    >
      <span style={{ fontSize: iconSize, lineHeight: 1, color: p.color }}>{icon}</span>
      {p.title && <span style={{ ...nameStyle, fontSize: nameSize }}>{p.title}</span>}
    </a>
  )
}
