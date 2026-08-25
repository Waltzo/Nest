import { useRef, useState } from 'react'
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

  // enablejsapi lets us play/pause via postMessage (used in compact mode).
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    enablejsapi: '1',
    origin: window.location.origin,
  })
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
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [playing, setPlaying] = useState(false)

  const base = Math.min(w || 0, h || 0)
  const titleSize = clamp(11, base * 0.09, 15)
  const showTitle = Boolean(p.title) && h >= 120
  // 1-row-tall card → hide the video, show only controls + title.
  const compact = h > 0 && h < 95

  function command(func: 'playVideo' | 'pauseVideo') {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func, args: [] }),
      'https://www.youtube.com',
    )
  }

  function toggle() {
    if (playing) {
      command('pauseVideo')
      setPlaying(false)
    } else {
      command('playVideo')
      setPlaying(true)
    }
  }

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

  const iframe = (
    <iframe
      ref={iframeRef}
      src={embed}
      title={p.title || 'YouTube player'}
      style={{ width: '100%', height: '100%', border: 'none' }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )

  if (compact) {
    // iframe kept full-size (so audio plays) but hidden behind an opaque cover
    // that shows only the play/stop button and the title.
    const btn = clamp(24, h * 0.62, 44)
    return (
      <div ref={ref} style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' }}>
          {iframe}
        </div>
        <div
          className="glass"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 10px',
            borderRadius: 0,
            border: 'none',
            boxShadow: 'none',
          }}
        >
          <button
            onClick={toggle}
            title={playing ? '정지' : '재생'}
            style={{
              flex: '0 0 auto',
              width: btn,
              height: btn,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: btn * 0.4,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <span
            style={{
              fontSize: clamp(11, h * 0.28, 16),
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            🎵 {p.title || 'Music'}
          </span>
        </div>
      </div>
    )
  }

  // Normal: visible player.
  const styledIframe = (
    <iframe
      ref={iframeRef}
      src={embed}
      title={p.title || 'YouTube player'}
      style={{ flex: 1, minHeight: 0, width: '100%', border: 'none', borderRadius: 12 }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  )

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
      {styledIframe}
    </div>
  )
}
