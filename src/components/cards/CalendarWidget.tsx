import { useState } from 'react'
import { useElementSize, clamp } from '../../hooks/useElementSize'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// Rotation label under each date, mirroring the spreadsheet formula:
//   diff = date - 2026-01-01 (days)
//   MOD(diff,4)=0 → 워코치테, =1 → 봉바, MOD(diff,8)=6 → 제압,
//   MOD(diff,4)=3 → 온살, MOD(diff,8)=2 → 쇄빙
const ROTATION_BASE = Date.UTC(2026, 0, 1)
function rotationLabel(year: number, month: number, day: number): string {
  const diff = Math.round((Date.UTC(year, month, day) - ROTATION_BASE) / 86400000)
  const r4 = ((diff % 4) + 4) % 4
  const r8 = ((diff % 8) + 8) % 8
  if (r4 === 0) return '워코'
  if (r4 === 1) return '봉바'
  if (r8 === 6) return '제압'
  if (r4 === 3) return '온살'
  if (r8 === 2) return '쇄빙'
  return ''
}

// Mini month calendar that fits its cell without scrolling: rows use 1fr so the
// grid always fills the available height, and fonts scale with the card size.
// Clicking a day opens Google Calendar's day view in a new tab.
export default function CalendarWidget() {
  const today = new Date()
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(), // 0-based
  })
  const [ref, { w, h }] = useElementSize()

  const first = new Date(view.year, view.month, 1)
  const startDay = first.getDay() // 0=Sun
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const numWeeks = Math.ceil((startDay + daysInMonth) / 7)

  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  // Pad to a full grid so row heights divide evenly.
  while (cells.length < numWeeks * 7) cells.push(null)

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

  // Scale text to whichever dimension is the binding constraint: cell width
  // (w/7) or cell height ((h - header/weekday rows) / weeks).
  const cellW = w > 0 ? w / 7 : 0
  const cellH = h > 0 ? (h * 0.78) / numWeeks : 0
  const cell = Math.min(cellW, cellH)
  const dayFont = clamp(8, cell * 0.5, 16)
  const headFont = clamp(10, w * 0.05, 15)
  const dowFont = clamp(7, cell * 0.42, 12)

  return (
    <div
      ref={ref}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: clamp(2, h * 0.02, 8),
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: headFont,
          fontWeight: 700,
          flex: '0 0 auto',
        }}
      >
        <button onClick={() => shift(-1)} style={navBtn} aria-label="이전 달">
          ‹
        </button>
        <span>
          {view.year}.{String(view.month + 1).padStart(2, '0')}
        </span>
        <button onClick={() => shift(1)} style={navBtn} aria-label="다음 달">
          ›
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          fontSize: dowFont,
          flex: '0 0 auto',
        }}
      >
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            style={{
              textAlign: 'center',
              color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : 'var(--text-muted)',
              fontWeight: 600,
            }}
          >
            {wd}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `repeat(${numWeeks}, 1fr)`,
          gap: clamp(1, cell * 0.05, 4),
          flex: 1,
          minHeight: 0,
        }}
      >
        {cells.map((d, i) => (
          <button
            key={i}
            disabled={d === null}
            onClick={() => d && openDay(d)}
            style={{
              border: 'none',
              background: d && isToday(d) ? 'var(--accent)' : 'transparent',
              color: d && isToday(d) ? '#fff' : 'inherit',
              borderRadius: clamp(4, cell * 0.2, 10),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1.05,
              cursor: d ? 'pointer' : 'default',
              visibility: d === null ? 'hidden' : 'visible',
              minWidth: 0,
              minHeight: 0,
              padding: 0,
              overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: dayFont }}>{d ?? ''}</span>
            {d && (
              <span
                style={{
                  fontSize: '8pt',
                  color: isToday(d) ? '#fff' : 'var(--text-muted)',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {rotationLabel(view.year, view.month, d)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: '1.1em',
  lineHeight: 1,
  padding: '0 6px',
}
