import { useEffect, useMemo, useRef, useState } from 'react'
import GridLayout, { WidthProvider } from 'react-grid-layout'
import type { Layout, ItemCallback } from 'react-grid-layout'
import type { Card, CardLayout } from '../types'
import { SM_COLS, SM_VIEW_BREAK } from '../types'
import CardShell from './CardShell'
import LinkCard from './cards/LinkCard'
import MemoCard from './cards/MemoCard'
import ClockWidget from './cards/ClockWidget'
import WeatherWidget from './cards/WeatherWidget'
import ImageCard from './cards/ImageCard'
import CalendarWidget from './cards/CalendarWidget'
import YouTubeCard from './cards/YouTubeCard'

// Non-responsive grid: we control cols + layout ourselves per breakpoint, so
// the layout never auto-reflows into a jumble when the window resizes.
const Grid = WidthProvider(GridLayout)

const MARGIN = 14
const PAD = 14
// Width of the mobile editing canvas (so sm can be edited on a wide screen).
const SM_EDIT_WIDTH = 460
// Hover-to-make-room dwell time before colliding cards get pushed aside.
const DWELL_MS = 1500

function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

export type Breakpoint = 'lg' | 'sm'

interface Props {
  cards: Card[]
  cols: number
  rowHeight: number
  editing: boolean
  editBreakpoint: Breakpoint
  onLayoutChange: (bp: Breakpoint, layout: Layout[]) => void
  onDeleteCard: (id: string) => void
  onEditCard: (id: string) => void
}

function renderCard(card: Card) {
  switch (card.type) {
    case 'link':
      return <LinkCard props={card.props} />
    case 'memo':
      return <MemoCard props={card.props} />
    case 'clock':
      return <ClockWidget props={card.props} />
    case 'weather':
      return <WeatherWidget props={card.props} />
    case 'image':
      return <ImageCard props={card.props} />
    case 'calendar':
      return <CalendarWidget />
    case 'youtube':
      return <YouTubeCard props={card.props} />
    default:
      return null
  }
}

function layoutFor(card: Card, bp: Breakpoint): CardLayout {
  return bp === 'sm' ? card.layoutSm ?? card.layout : card.layout
}

export default function GridBoard({
  cards,
  cols,
  rowHeight,
  editing,
  editBreakpoint,
  onLayoutChange,
  onDeleteCard,
  onEditCard,
}: Props) {
  const measureRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  // Hover-to-make-room: while dragging, if the held card's target cell overlaps
  // another card for DWELL_MS, we flip preventCollision off so RGL pushes the
  // colliding cards out of the way. Reset on drop.
  const [pushMode, setPushMode] = useState(false)
  const grab = useRef({ dx: 0, dy: 0 })
  const dwellTimer = useRef<number | undefined>(undefined)
  const dwellCell = useRef<string | null>(null)

  const clearDwell = () => {
    if (dwellTimer.current !== undefined) {
      clearTimeout(dwellTimer.current)
      dwellTimer.current = undefined
    }
    dwellCell.current = null
  }

  useEffect(() => () => clearDwell(), [])

  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Breakpoint follows the viewport width (not the container), so "1024" means
  // the actual screen width regardless of page padding.
  const [vw, setVw] = useState(() => window.innerWidth)
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Active breakpoint: while editing it's the user's chosen target; otherwise
  // it follows the viewport width (< 1024 → mobile 4-col).
  const activeBp: Breakpoint = editing
    ? editBreakpoint
    : vw < SM_VIEW_BREAK
      ? 'sm'
      : 'lg'
  const nCols = activeBp === 'sm' ? SM_COLS : cols
  // Mobile layout is always constrained + centered with side margins.
  const constrainSm = activeBp === 'sm'

  const layout: Layout[] = useMemo(
    () =>
      cards.map((c) => {
        const l = layoutFor(c, activeBp)
        return { i: c.id, x: l.x, y: l.y, w: l.w, h: l.h }
      }),
    [cards, activeBp],
  )

  // Cell geometry for the edit overlay (uses the measured canvas width).
  const colWidth = width > 0 ? (width - MARGIN * (nCols - 1) - PAD * 2) / nCols : 0
  const pitchX = colWidth + MARGIN
  const pitchY = rowHeight + MARGIN
  const gridWidth = nCols * colWidth + (nCols - 1) * MARGIN

  const overlayStyle: React.CSSProperties | undefined =
    editing && colWidth > 0
      ? {
          left: PAD,
          top: PAD,
          width: gridWidth,
          bottom: PAD,
          backgroundImage: [
            `repeating-linear-gradient(90deg, var(--grid-line-edit) 0 1px, transparent 1px ${colWidth}px, var(--grid-line-edit) ${colWidth}px ${colWidth + 1}px, transparent ${colWidth + 1}px ${pitchX}px)`,
            `repeating-linear-gradient(180deg, var(--grid-line-edit) 0 1px, transparent 1px ${rowHeight}px, var(--grid-line-edit) ${rowHeight}px ${rowHeight + 1}px, transparent ${rowHeight + 1}px ${pitchY}px)`,
          ].join(','),
        }
      : undefined

  // --- Drag dwell handlers ---
  const onDragStart: ItemCallback = (_l, _old, newItem, _ph, e) => {
    setPushMode(false)
    clearDwell()
    const rect = measureRef.current?.getBoundingClientRect()
    if (!rect) return
    const itemLeft = rect.left + PAD + newItem.x * pitchX
    const itemTop = rect.top + PAD + newItem.y * pitchY
    grab.current = { dx: e.clientX - itemLeft, dy: e.clientY - itemTop }
  }

  const onDrag: ItemCallback = (_l, _old, newItem, _ph, e) => {
    if (pushMode) return // already making room
    const rect = measureRef.current?.getBoundingClientRect()
    if (!rect || pitchX <= 0) return
    // Target top-left cell under the cursor (grab offset preserved).
    const leftPx = e.clientX - grab.current.dx - rect.left - PAD
    const topPx = e.clientY - grab.current.dy - rect.top - PAD
    const tx = Math.max(0, Math.min(Math.round(leftPx / pitchX), nCols - newItem.w))
    const ty = Math.max(0, Math.round(topPx / pitchY))
    const target = { x: tx, y: ty, w: newItem.w, h: newItem.h }
    const collides = layout.some((l) => l.i !== newItem.i && overlaps(target, l))
    const cell = `${tx},${ty}`
    if (collides) {
      if (dwellCell.current !== cell) {
        dwellCell.current = cell
        if (dwellTimer.current !== undefined) clearTimeout(dwellTimer.current)
        dwellTimer.current = window.setTimeout(() => setPushMode(true), DWELL_MS)
      }
    } else {
      clearDwell()
    }
  }

  const onDragStop: ItemCallback = () => {
    // Layout is persisted by the Grid's onLayoutChange; here we only reset.
    clearDwell()
    setPushMode(false)
  }

  return (
    <div className="grid-board-wrap">
      <div
        ref={measureRef}
        className="grid-canvas"
        style={
          constrainSm
            ? { maxWidth: SM_EDIT_WIDTH, margin: '0 auto', position: 'relative' }
            : { position: 'relative' }
        }
      >
        {overlayStyle && <div className="grid-overlay" style={overlayStyle} />}
        <Grid
          className={`layout${pushMode ? ' push-mode' : ''}`}
          layout={layout}
          cols={nCols}
          rowHeight={rowHeight}
          margin={[MARGIN, MARGIN]}
          containerPadding={[PAD, PAD]}
          isDraggable={editing}
          isResizable={editing}
          draggableHandle=".card-drag-handle"
          compactType={null}
          preventCollision={!pushMode}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragStop={onDragStop}
          onLayoutChange={(l) => editing && onLayoutChange(activeBp, l)}
        >
          {cards.map((card) => (
            <div key={card.id}>
              <CardShell
                editing={editing}
                onDelete={() => onDeleteCard(card.id)}
                onEdit={() => onEditCard(card.id)}
              >
                {renderCard(card)}
              </CardShell>
            </div>
          ))}
        </Grid>
      </div>
    </div>
  )
}
