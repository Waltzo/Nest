import { useEffect, useState } from 'react'
import type { ClockProps } from '../../types'

export default function ClockWidget({ props }: { props: Record<string, unknown> }) {
  const p = props as unknown as ClockProps
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: !p.format24,
    ...(p.timezone ? { timeZone: p.timezone } : {}),
  }
  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(p.timezone ? { timeZone: p.timezone } : {}),
  }

  let time = '--:--:--'
  let date = ''
  try {
    time = new Intl.DateTimeFormat('ko-KR', timeOpts).format(now)
    date = new Intl.DateTimeFormat('ko-KR', dateOpts).format(now)
  } catch {
    // invalid timezone → fall back to local
    time = now.toLocaleTimeString()
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {time}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
        {date}
        {p.timezone ? ` · ${p.timezone.split('/').pop()}` : ''}
      </div>
    </div>
  )
}
