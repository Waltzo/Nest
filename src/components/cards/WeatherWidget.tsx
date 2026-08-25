import { useEffect, useState } from 'react'
import type { WeatherProps } from '../../types'
import { useElementSize, clamp } from '../../hooks/useElementSize'

interface CurrentWeather {
  temperature: number
  windspeed: number
  weathercode: number
}

// open-meteo WMO weather codes → emoji + ko label (condensed).
function describe(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: '☀️', label: '맑음' }
  if (code <= 3) return { icon: '⛅', label: '구름' }
  if (code <= 48) return { icon: '🌫️', label: '안개' }
  if (code <= 67) return { icon: '🌧️', label: '비' }
  if (code <= 77) return { icon: '🌨️', label: '눈' }
  if (code <= 82) return { icon: '🌦️', label: '소나기' }
  if (code <= 86) return { icon: '🌨️', label: '눈' }
  return { icon: '⛈️', label: '뇌우' }
}

export default function WeatherWidget({ props }: { props: Record<string, unknown> }) {
  const p = props as unknown as WeatherProps
  const [data, setData] = useState<CurrentWeather | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ref, { w, h }] = useElementSize()

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current_weather=true`
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((j) => {
        if (!cancelled) setData(j.current_weather as CurrentWeather)
      })
      .catch(() => {
        if (!cancelled) setError('날씨 불러오기 실패')
      })
    return () => {
      cancelled = true
    }
  }, [p.lat, p.lon])

  const d = data ? describe(data.weathercode) : null
  const temp = data ? Math.round(data.temperature) : null

  // Short + wide cell (≈1 row tall, ≥2 cols wide) → single-line horizontal
  // layout: "서울 🌧️ 28°". Otherwise the stacked vertical layout.
  const horizontal = h > 0 && h < 95 && w >= 150

  const status = error ? (
    <div style={{ fontSize: 13 }}>⚠️ {error}</div>
  ) : !data ? (
    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>…</div>
  ) : null

  if (horizontal) {
    const labelSize = clamp(11, h * 0.32, 20)
    const iconSize = clamp(20, h * 0.7, 48)
    const tempSize = clamp(16, h * 0.55, 44)
    const showDetail = w >= 320 && d
    return (
      <div
        ref={ref}
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: clamp(6, w * 0.03, 22),
          overflow: 'hidden',
        }}
      >
        {status ?? (
          <>
            <span
              style={{
                fontSize: labelSize,
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {p.label}
            </span>
            <span style={{ fontSize: iconSize, lineHeight: 1 }}>{d!.icon}</span>
            <span style={{ fontSize: tempSize, fontWeight: 700, lineHeight: 1 }}>
              {temp}°
            </span>
            {showDetail && (
              <span style={{ fontSize: labelSize, color: 'var(--text-muted)' }}>
                {d!.label} · {data!.windspeed}m/s
              </span>
            )}
          </>
        )}
      </div>
    )
  }

  // ---- Vertical (default) ----
  const base = Math.min(w || 0, h || 0)
  const labelSize = clamp(10, base * 0.12, 17)
  const iconSize = clamp(22, base * 0.36, 72)
  const tempSize = clamp(16, base * 0.3, 58)
  const detailSize = clamp(10, base * 0.1, 15)
  const showDetail = h >= 120 && w >= 130

  return (
    <div
      ref={ref}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: clamp(0, base * 0.02, 4),
        overflow: 'hidden',
      }}
    >
      <div style={{ fontSize: labelSize, color: 'var(--text-muted)' }}>{p.label}</div>
      {status}
      {data && d && (
        <>
          <div style={{ fontSize: iconSize, lineHeight: 1 }}>{d.icon}</div>
          <div style={{ fontSize: tempSize, fontWeight: 700, lineHeight: 1.1 }}>
            {temp}°
          </div>
          {showDetail && (
            <div style={{ fontSize: detailSize, color: 'var(--text-muted)' }}>
              {d.label} · 풍속 {data.windspeed}m/s
            </div>
          )}
        </>
      )}
    </div>
  )
}
