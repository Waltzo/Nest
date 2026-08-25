import type { ReactNode } from 'react'

interface Props {
  editing: boolean
  onDelete: () => void
  onEdit: () => void
  children: ReactNode
}

// Glass container around every card. In edit mode it shows delete/settings
// actions. The whole surface acts as the react-grid-layout drag handle
// (`.card-drag-handle`), while the action buttons stop propagation so clicks
// on them don't start a drag.
export default function CardShell({ editing, onDelete, onEdit, children }: Props) {
  return (
    <div className={`card-shell glass card-drag-handle${editing ? ' editing' : ''}`}>
      {editing && (
        <div className="card-actions" onMouseDown={(e) => e.stopPropagation()}>
          <button title="Edit card" onClick={onEdit}>
            ⚙
          </button>
          <button title="Delete card" onClick={onDelete}>
            ✕
          </button>
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  )
}
