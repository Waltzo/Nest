import type { DashboardConfig } from '../types'
import { CONFIG_VERSION } from '../types'

const LS_KEY = 'nest.dashboard.config'

// Vite exposes the configured base (e.g. '/Nest/') at runtime, so the default
// config fetch works both in dev ('/') and on GitHub Pages ('/Nest/').
const DASHBOARD_URL = `${import.meta.env.BASE_URL}dashboard.json`

function isConfig(v: unknown): v is DashboardConfig {
  if (!v || typeof v !== 'object') return false
  const c = v as Record<string, unknown>
  return Array.isArray(c.cards) && typeof c.cols === 'number'
}

// Load order: localStorage edit copy wins over the repo default so the user
// sees their unpublished edits on refresh. Falls back to the bundled default.
export async function loadConfig(): Promise<DashboardConfig> {
  const local = readLocal()
  if (local) return local
  return fetchRepoConfig()
}

export function readLocal(): DashboardConfig | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isConfig(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function fetchRepoConfig(): Promise<DashboardConfig> {
  try {
    const res = await fetch(DASHBOARD_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const parsed = await res.json()
    if (isConfig(parsed)) return parsed
    throw new Error('invalid config shape')
  } catch {
    return emptyConfig()
  }
}

export function saveLocal(config: DashboardConfig): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(config))
  } catch {
    /* localStorage full or blocked — non-fatal */
  }
}

export function clearLocal(): void {
  try {
    localStorage.removeItem(LS_KEY)
  } catch {
    /* ignore */
  }
}

export function emptyConfig(): DashboardConfig {
  return {
    version: CONFIG_VERSION,
    cards: [],
    theme: 'light',
    cols: 12,
    rowHeight: 80,
  }
}

export function exportConfig(config: DashboardConfig): void {
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dashboard.json'
  a.click()
  URL.revokeObjectURL(url)
}

export function importConfig(file: File): Promise<DashboardConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (isConfig(parsed)) resolve(parsed)
        else reject(new Error('Invalid dashboard.json'))
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
