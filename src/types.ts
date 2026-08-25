export type CardType =
  | 'link'
  | 'memo'
  | 'clock'
  | 'weather'
  | 'image'
  | 'calendar'
  | 'youtube'

export interface CardLayout {
  x: number
  y: number
  w: number
  h: number
}

// Type-specific props. Kept loose (Record) at the storage layer, but each card
// component narrows what it reads. Defaults live in `cardDefaults` below.
export interface LinkProps {
  title: string
  url: string
  icon?: string // emoji or single char
  color?: string
}
export interface MemoProps {
  markdown: string
}
export interface ClockProps {
  timezone?: string // IANA tz, e.g. 'Asia/Seoul'; undefined = local
  format24?: boolean
}
export interface WeatherProps {
  lat: number
  lon: number
  label: string
}
export interface ImageProps {
  src: string
  alt?: string
  caption?: string
  name?: string // profile mode
  bio?: string
}
export type CalendarProps = Record<string, never>
export interface YouTubeProps {
  url: string // any YouTube video or playlist link
  title?: string
}

export type CardProps =
  | LinkProps
  | MemoProps
  | ClockProps
  | WeatherProps
  | ImageProps
  | CalendarProps
  | YouTubeProps

export interface Card {
  id: string
  type: CardType
  layout: CardLayout // desktop / lg (12 cols)
  layoutSm?: CardLayout // mobile / sm (4 cols)
  props: Record<string, unknown>
}

// Two fixed breakpoints only, each with its own stored layout.
export const SM_COLS = 4
// Below this viewport width the dashboard renders the mobile (sm) layout.
export const SM_VIEW_BREAK = 1024

export interface DashboardConfig {
  version: number
  cards: Card[]
  theme: 'light' | 'dark'
  cols: number
  rowHeight: number
  editPasswordHash?: string // SHA-256 hex. Never store plaintext.
}

export const CONFIG_VERSION = 1

// Default props used when adding a new card of a given type.
export const cardDefaults: Record<CardType, Record<string, unknown>> = {
  link: { title: 'New Link', url: 'https://', icon: '🔗' },
  memo: { markdown: '# Memo\n\nWrite **markdown** here.' },
  clock: { timezone: 'Asia/Seoul', format24: true },
  weather: { lat: 37.5665, lon: 126.978, label: '서울' },
  image: { src: '', alt: 'image', caption: '' },
  calendar: {},
  youtube: { url: '', title: 'Music' },
}

// Sensible default size (in grid units) for a freshly added card.
export const cardDefaultSize: Record<CardType, { w: number; h: number }> = {
  link: { w: 2, h: 2 },
  memo: { w: 3, h: 3 },
  clock: { w: 3, h: 2 },
  weather: { w: 3, h: 2 },
  image: { w: 3, h: 3 },
  calendar: { w: 3, h: 3 },
  youtube: { w: 4, h: 3 },
}
