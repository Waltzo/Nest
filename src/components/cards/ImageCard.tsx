import type { ImageProps } from '../../types'

export default function ImageCard({ props }: { props: Record<string, unknown> }) {
  const p = props as unknown as ImageProps
  const isProfile = Boolean(p.name || p.bio)

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        textAlign: 'center',
      }}
    >
      {p.src ? (
        <img
          src={p.src}
          alt={p.alt || p.name || 'image'}
          style={{
            maxWidth: '100%',
            maxHeight: isProfile ? 96 : '100%',
            width: isProfile ? 96 : 'auto',
            height: isProfile ? 96 : 'auto',
            objectFit: 'cover',
            borderRadius: isProfile ? '50%' : 12,
          }}
        />
      ) : (
        <div
          style={{
            width: isProfile ? 96 : 64,
            height: isProfile ? 96 : 64,
            borderRadius: isProfile ? '50%' : 12,
            background: 'var(--glass-border)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 30,
          }}
        >
          {isProfile ? '🙂' : '🖼️'}
        </div>
      )}
      {p.name && <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>}
      {p.bio && (
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{p.bio}</div>
      )}
      {!isProfile && p.caption && (
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{p.caption}</div>
      )}
    </div>
  )
}
