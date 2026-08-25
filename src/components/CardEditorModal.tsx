import { useState } from 'react'
import type { Card, CardType } from '../types'

interface Props {
  card: Card
  onClose: () => void
  onSave: (props: Record<string, unknown>) => void
}

// Field definitions per card type. `num` fields are parsed to Number on save.
const FIELDS: Record<
  CardType,
  { key: string; label: string; type: 'text' | 'num' | 'area' | 'check' }[]
> = {
  link: [
    { key: 'title', label: '제목', type: 'text' },
    { key: 'url', label: 'URL', type: 'text' },
    { key: 'icon', label: '아이콘(이모지)', type: 'text' },
    { key: 'color', label: '아이콘 색(옵션)', type: 'text' },
  ],
  memo: [{ key: 'markdown', label: '마크다운', type: 'area' }],
  clock: [
    { key: 'timezone', label: '타임존 (예: Asia/Seoul)', type: 'text' },
    { key: 'format24', label: '24시간 형식', type: 'check' },
  ],
  weather: [
    { key: 'label', label: '지역 이름', type: 'text' },
    { key: 'lat', label: '위도', type: 'num' },
    { key: 'lon', label: '경도', type: 'num' },
  ],
  image: [
    { key: 'src', label: '이미지 URL', type: 'text' },
    { key: 'name', label: '이름(프로필)', type: 'text' },
    { key: 'bio', label: '소개(프로필)', type: 'text' },
    { key: 'caption', label: '캡션(일반)', type: 'text' },
    { key: 'alt', label: '대체 텍스트', type: 'text' },
  ],
  calendar: [],
  youtube: [
    { key: 'url', label: '유튜브 링크 (영상/재생목록)', type: 'text' },
    { key: 'title', label: '제목', type: 'text' },
  ],
}

export default function CardEditorModal({ card, onClose, onSave }: Props) {
  const fields = FIELDS[card.type]
  const [draft, setDraft] = useState<Record<string, unknown>>({ ...card.props })

  function set(key: string, value: unknown) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function save() {
    // Coerce number fields.
    const out: Record<string, unknown> = { ...draft }
    for (const f of fields) {
      if (f.type === 'num') out[f.key] = Number(out[f.key])
    }
    onSave(out)
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal glass" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{card.type} 카드 편집</h2>
        {fields.length === 0 && (
          <p className="hint">이 카드는 편집할 속성이 없습니다.</p>
        )}
        {fields.map((f) => (
          <div key={f.key}>
            <label>{f.label}</label>
            {f.type === 'area' ? (
              <textarea
                value={String(draft[f.key] ?? '')}
                onChange={(e) => set(f.key, e.target.value)}
              />
            ) : f.type === 'check' ? (
              <input
                type="checkbox"
                checked={Boolean(draft[f.key])}
                onChange={(e) => set(f.key, e.target.checked)}
                style={{ width: 'auto' }}
              />
            ) : (
              <input
                type={f.type === 'num' ? 'number' : 'text'}
                step="any"
                value={String(draft[f.key] ?? '')}
                onChange={(e) => set(f.key, e.target.value)}
              />
            )}
          </div>
        ))}
        <div className="modal-actions">
          <button onClick={onClose}>취소</button>
          <button className="primary" onClick={save}>
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
