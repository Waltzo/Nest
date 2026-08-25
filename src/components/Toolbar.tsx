import { useRef } from 'react'
import type { CardType } from '../types'
import type { Breakpoint } from './GridBoard'

interface Props {
  editing: boolean
  theme: 'light' | 'dark'
  publishing: boolean
  editBreakpoint: Breakpoint
  onToggleEdit: () => void
  onToggleTheme: () => void
  onAddCard: (type: CardType) => void
  onPublish: () => void
  onOpenToken: () => void
  onExport: () => void
  onImport: (file: File) => void
  onRefreshFromRepo: () => void
  onToggleBreakpoint: () => void
}

const ADD_TYPES: { type: CardType; label: string }[] = [
  { type: 'link', label: '🔗 링크' },
  { type: 'memo', label: '📝 메모' },
  { type: 'clock', label: '🕐 시계' },
  { type: 'weather', label: '🌤️ 날씨' },
  { type: 'image', label: '🖼️ 이미지/프로필' },
  { type: 'calendar', label: '📅 캘린더' },
  { type: 'youtube', label: '🎵 유튜브 음악' },
]

// Floating controls, bottom-right. Two circular FABs (theme + edit) are always
// visible; the rest of the edit actions appear in a panel above when editing.
export default function Toolbar({
  editing,
  theme,
  publishing,
  editBreakpoint,
  onToggleEdit,
  onToggleTheme,
  onAddCard,
  onPublish,
  onOpenToken,
  onExport,
  onImport,
  onRefreshFromRepo,
  onToggleBreakpoint,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="fab-stack">
      {editing && (
        <div className="edit-panel glass">
          <button onClick={onToggleBreakpoint} title="편집할 레이아웃 전환">
            {editBreakpoint === 'lg' ? '🖥 데스크탑' : '📱 모바일'}
          </button>

          <details className="add-menu up">
            <summary>＋ 카드 추가</summary>
            <div className="add-list glass">
              {ADD_TYPES.map((a) => (
                <button
                  key={a.type}
                  onClick={(e) => {
                    onAddCard(a.type)
                    ;(e.currentTarget.closest('details') as HTMLDetailsElement).open =
                      false
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </details>

          <button className="primary" onClick={onPublish} disabled={publishing}>
            {publishing ? '⏳ 게시 중…' : '🚀 Publish'}
          </button>
          <button onClick={onOpenToken}>🔑 토큰</button>
          <button onClick={onExport}>⬇ Export</button>
          <button onClick={() => fileRef.current?.click()}>⬆ Import</button>
          <button onClick={onRefreshFromRepo} title="리포의 최신 config 불러오기">
            ↻ 리포에서
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onImport(f)
              e.target.value = ''
            }}
          />
        </div>
      )}

      <div className="fab-row">
        <button className="fab" onClick={onToggleTheme} title="테마 전환">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <button
          className={`fab${editing ? ' primary' : ''}`}
          onClick={onToggleEdit}
          title={editing ? '편집 완료' : '편집'}
        >
          {editing ? '✓' : '✎'}
        </button>
      </div>
    </div>
  )
}
