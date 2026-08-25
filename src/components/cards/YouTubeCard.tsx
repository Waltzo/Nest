import type { YouTubeProps } from '../../types'
import { useElementSize, clamp } from '../../hooks/useElementSize'

// Parse a YouTube video/playlist URL into an embed URL. Supports:
//   youtu.be/ID, youtube.com/watch?v=ID, youtube.com/embed/ID,
//   /shorts/ID, and playlist links (?list=...).
function toEmbedUrl(raw: string): string | null {
  const s = (raw || '').trim()
  if (!s) return null
  let url: URL
  try {
    url = new URL(s)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, '')
  let id = ''
  const list = url.searchParams.get('list') || ''

  if (host === 'youtu.be') {
    id = url.pathname.slice(1)
  } else if (host.endsWith('youtube.com')) {
    if (url.pathname.startsWith('/embed/')) id = url.pathname.split('/')[2] || ''
    else if (url.pathname.startsWith('/shorts/')) id = url.pathname.split('/')[2] || ''
    else id = url.searchParams.get('v') || ''
  } else {
    return null
  }

  const params = new URLSearchParams({ rel: '0', modestbranding: '1' })
  if (id) {
    if (list) params.set('list', list)
    return `https://www.youtube.com/embed/${id}?${params}`
  }
  if (list) {
    params.set('list', list)
    return `https://www.youtube.com/embed/videoseries?${params}`
  }
  return null
}

export default function YouTubeCard({ props }: { props: Record<string, unknown> }) {
  const p = props as unknown as YouTubeProps
  const embed = toEmbedUrl(p.url)
  const [ref, { w, h }] = useElementSize()
  const base = Math.min(w || 0, h || 0)
  const titleSize = clamp(11, base * 0.09, 15)
  const showTitle = Boolean(p.title) && h >= 120

  if (!embed) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 12.5,
        }}
      >
        <span style={{ fontSize: 30 }}>🎵</span>
        <span>유튜브 링크를 입력하세요</span>
        <span style={{ fontSize: 11 }}>⚙ 편집 → URL</span>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}
    >
      {showTitle && (
        <div
          style={{
            fontSize: titleSize,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flex: '0 0 auto',
          }}
        >
          <span>🎵</span>
          <span
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {p.title}
          </span>
        </div>
      )}
      <iframe
        src={embed}
        title={p.title || 'YouTube player'}
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          border: 'none',
          borderRadius: 12,
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
