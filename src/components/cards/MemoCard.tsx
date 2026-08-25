import ReactMarkdown from 'react-markdown'
import type { MemoProps } from '../../types'

export default function MemoCard({ props }: { props: Record<string, unknown> }) {
  const p = props as unknown as MemoProps
  return (
    <div
      className="memo"
      style={{ fontSize: 13.5, lineHeight: 1.5 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <ReactMarkdown>{p.markdown || ''}</ReactMarkdown>
    </div>
  )
}
