import { useEffect, useState } from 'react'
import type { WeatherProps } from '../../types'

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

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{p.label}</div>
      {error && <div style={{ fontSize: 13 }}>⚠️ {error}</div>}
      {!error && !data && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>…</div>}
      {data && (
        <>
          <div style={{ fontSize: 30 }}>{describe(data.weathercode).icon}</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>
            {Math.round(data.temperature)}°
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {describe(data.weathercode).label} · 풍속 {data.windspeed}m/s
          </div>
        </>
      )}
    </div>
  )
}
