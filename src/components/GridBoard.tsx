import { useEffect, useMemo, useRef, useState } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layout } from 'react-grid-layout'
import type { Card } from '../types'
import CardShell from './CardShell'
import LinkCard from './cards/LinkCard'
import MemoCard from './cards/MemoCard'
import ClockWidget from './cards/ClockWidget'
import WeatherWidget from './cards/WeatherWidget'
import ImageCard from './cards/ImageCard'
import CalendarWidget from './cards/CalendarWidget'

const ResponsiveGridLayout = WidthProvider(Responsive)

// Grid geometry — kept in sync with the props passed to ResponsiveGridLayout.
const MARGIN = 14
const PAD = 14
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }

interface Props {
  cards: Card[]
  cols: number
  rowHeight: number
  editing: boolean
  onLayoutChange: (layout: Layout[]) => void
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
    default:
      return null
  }
}

// Resolve the active column count for a measured width, mirroring the `cols`
// map given to ResponsiveGridLayout below.
function colsForWidth(width: number, baseCols: number): number {
  if (width >= BREAKPOINTS.md) return baseCols // lg + md
  if (width >= BREAKPOINTS.sm) return 6
  if (width >= BREAKPOINTS.xs) return 4
  return 2
}

export default function GridBoard({
  cards,
  cols,
  rowHeight,
  editing,
  onLayoutChange,
  onDeleteCard,
  onEditCard,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  // Track the wrapper width — this is the same width WidthProvider measures,
  // so our overlay math matches the real grid cell size.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const layout: Layout[] = useMemo(
    () =>
      cards.map((c) => ({
        i: c.id,
        x: c.layout.x,
        y: c.layout.y,
        w: c.layout.w,
        h: c.layout.h,
      })),
    [cards],
  )

  // Cell geometry for the edit overlay.
  const nCols = colsForWidth(width, cols)
  const colWidth =
    width > 0 ? (width - MARGIN * (nCols - 1) - PAD * 2) / nCols : 0
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
            // Column cell edges (left + right of each cell).
            `repeating-linear-gradient(90deg, var(--grid-line-edit) 0 1px, transparent 1px ${colWidth}px, var(--grid-line-edit) ${colWidth}px ${colWidth + 1}px, transparent ${colWidth + 1}px ${pitchX}px)`,
            // Row cell edges (top + bottom of each cell).
            `repeating-linear-gradient(180deg, var(--grid-line-edit) 0 1px, transparent 1px ${rowHeight}px, var(--grid-line-edit) ${rowHeight}px ${rowHeight + 1}px, transparent ${rowHeight + 1}px ${pitchY}px)`,
          ].join(','),
        }
      : undefined

  return (
    <div className="grid-board-wrap" ref={wrapRef}>
      {overlayStyle && <div className="grid-overlay" style={overlayStyle} />}
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout, md: layout, sm: layout, xs: layout, xxs: layout }}
        breakpoints={BREAKPOINTS}
        cols={{ lg: cols, md: cols, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={rowHeight}
        margin={[MARGIN, MARGIN]}
        containerPadding={[PAD, PAD]}
        isDraggable={editing}
        isResizable={editing}
        draggableHandle=".card-drag-handle"
        compactType={null}
        preventCollision
        onLayoutChange={(l) => editing && onLayoutChange(l)}
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
      </ResponsiveGridLayout>
    </div>
  )
}
