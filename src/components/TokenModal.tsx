import { useState } from 'react'
import { getToken, setToken, clearToken } from '../config/github'

interface Props {
  onClose: () => void
  onSaved: () => void
}

// Collects the GitHub Personal Access Token used to commit dashboard.json.
// Stored in localStorage on this browser only.
export default function TokenModal({ onClose, onSaved }: Props) {
  const [token, setTokenValue] = useState(getToken() ?? '')

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal glass" onMouseDown={(e) => e.stopPropagation()}>
        <h2>GitHub 토큰 (Publish용)</h2>
        <p className="hint">
          Publish 시 <code>Waltzo/Nest</code>의 <code>public/dashboard.json</code>에
          커밋합니다. <b>Contents: Read and write</b> 권한의 Fine-grained PAT를
          권장합니다.
        </p>

        <label>Personal Access Token</label>
        <input
          type="password"
          value={token}
          autoFocus
          placeholder="github_pat_..."
          onChange={(e) => setTokenValue(e.target.value)}
        />

        <div className="warn">
          ⚠️ 토큰은 이 브라우저의 localStorage에만 저장됩니다. 본인 기기에서만
          사용하고, 최소 권한(이 리포 Contents write)만 부여하세요. 공용 PC에서는
          사용 후 "토큰 삭제"를 누르세요.
        </div>

        <div className="modal-actions">
          <button
            onClick={() => {
              clearToken()
              setTokenValue('')
            }}
          >
            토큰 삭제
          </button>
          <button onClick={onClose}>취소</button>
          <button
            className="primary"
            onClick={() => {
              if (token.trim()) setToken(token)
              onSaved()
            }}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}
