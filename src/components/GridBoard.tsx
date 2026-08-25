import { useMemo } from 'react'
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

export default function GridBoard({
  cards,
  cols,
  rowHeight,
  editing,
  onLayoutChange,
  onDeleteCard,
  onEditCard,
}: Props) {
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

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout, md: layout, sm: layout, xs: layout, xxs: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: cols, md: cols, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={rowHeight}
      margin={[14, 14]}
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
  )
}
