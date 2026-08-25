import type { LinkProps } from '../../types'

export default function LinkCard({ props }: { props: Record<string, unknown> }) {
  const p = props as unknown as LinkProps
  const icon = p.icon || '🔗'
  return (
    <a
      href={p.url || '#'}
      target="_blank"
      rel="noreferrer noopener"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: '100%',
        textAlign: 'center',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span
        style={{
          fontSize: 34,
          lineHeight: 1,
          color: p.color,
        }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{p.title || 'Link'}</span>
    </a>
  )
}
