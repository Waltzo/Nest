import { useEffect, useMemo, useRef, useState } from 'react'
import GridLayout, { WidthProvider } from 'react-grid-layout'
import type { Layout } from 'react-grid-layout'
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

  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Active breakpoint: while editing it's the user's chosen target; otherwise
  // it follows the actual container width.
  const activeBp: Breakpoint = editing
    ? editBreakpoint
    : width > 0 && width < SM_VIEW_BREAK
      ? 'sm'
      : 'lg'
  const nCols = activeBp === 'sm' ? SM_COLS : cols
  const constrainSm = editing && activeBp === 'sm'

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
          className="layout"
          layout={layout}
          cols={nCols}
          rowHeight={rowHeight}
          margin={[MARGIN, MARGIN]}
          containerPadding={[PAD, PAD]}
          isDraggable={editing}
          isResizable={editing}
          draggableHandle=".card-drag-handle"
          compactType={null}
          preventCollision
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
