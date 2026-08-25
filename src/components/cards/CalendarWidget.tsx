import { useState } from 'react'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// Mini month calendar. Clicking a day opens Google Calendar's day view for
// that date in a new tab.
export default function CalendarWidget() {
  const today = new Date()
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(), // 0-based
  })

  const first = new Date(view.year, view.month, 1)
  const startDay = first.getDay() // 0=Sun
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isToday = (d: number) =>
    d === today.getDate() &&
    view.month === today.getMonth() &&
    view.year === today.getFullYear()

  const openDay = (d: number) => {
    const url = `https://calendar.google.com/calendar/u/0/r/day/${view.year}/${view.month + 1}/${d}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const shift = (delta: number) => {
    const m = view.month + delta
    setView({
      year: view.year + Math.floor(m / 12),
      month: ((m % 12) + 12) % 12,
    })
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <button
          onClick={() => shift(-1)}
          style={btn}
          aria-label="이전 달"
        >
          ‹
        </button>
        <span>
          {view.year}.{String(view.month + 1).padStart(2, '0')}
        </span>
        <button onClick={() => shift(1)} style={btn} aria-label="다음 달">
          ›
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 2,
          fontSize: 11,
          flex: 1,
          minHeight: 0,
        }}
      >
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            style={{
              textAlign: 'center',
              color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            {w}
          </div>
        ))}
        {cells.map((d, i) => (
          <button
            key={i}
            disabled={d === null}
            onClick={() => d && openDay(d)}
            style={{
              border: 'none',
              background: d && isToday(d) ? 'var(--accent)' : 'transparent',
              color: d && isToday(d) ? '#fff' : 'inherit',
              borderRadius: 6,
              aspectRatio: '1',
              fontSize: 11,
              display: 'grid',
              placeItems: 'center',
              cursor: d ? 'pointer' : 'default',
              visibility: d === null ? 'hidden' : 'visible',
            }}
          >
            {d ?? ''}
          </button>
        ))}
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 16,
  lineHeight: 1,
  padding: '0 6px',
}
