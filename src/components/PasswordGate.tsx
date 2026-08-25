import { useState } from 'react'
import { sha256Hex } from '../config/crypto'

interface Props {
  // Existing hash from config, or undefined on first-ever use (setup mode).
  existingHash?: string
  onClose: () => void
  // On setup: returns the newly chosen hash to persist. On unlock: not called.
  onSetupComplete: (hash: string) => void
  // On successful unlock (hash matched).
  onUnlocked: () => void
}

// Gate for entering edit mode. First run sets a password (stores only the
// SHA-256 hash). Later runs verify the entered password against that hash.
// Note: on a static site this is a soft gate — the real write authority is the
// GitHub PAT. Documented in the UI below.
export default function PasswordGate({
  existingHash,
  onClose,
  onSetupComplete,
  onUnlocked,
}: Props) {
  const isSetup = !existingHash
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setError(null)
    if (isSetup) {
      if (pw.length < 4) return setError('비밀번호는 4자 이상')
      if (pw !== pw2) return setError('비밀번호가 일치하지 않음')
      onSetupComplete(await sha256Hex(pw))
      return
    }
    const hash = await sha256Hex(pw)
    if (hash === existingHash) onUnlocked()
    else setError('비밀번호가 틀렸습니다')
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal glass" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{isSetup ? '편집 비밀번호 설정' : '편집 잠금 해제'}</h2>
        <p className="hint">
          {isSetup
            ? '편집 모드 진입에 사용할 비밀번호를 정하세요. 해시(SHA-256)만 저장됩니다.'
            : '편집하려면 비밀번호를 입력하세요.'}
        </p>

        <label>비밀번호</label>
        <input
          type="password"
          value={pw}
          autoFocus
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isSetup && submit()}
        />

        {isSetup && (
          <>
            <label>비밀번호 확인</label>
            <input
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          </>
        )}

        {error && <div className="error">{error}</div>}

        <div className="warn">
          ⚠️ 정적 사이트 특성상 이 잠금은 편집 UI를 가리는 용도입니다. 실제 리포
          반영은 GitHub 토큰(PAT)을 가진 본인만 가능합니다.
        </div>

        <div className="modal-actions">
          <button onClick={onClose}>취소</button>
          <button className="primary" onClick={submit}>
            {isSetup ? '설정' : '잠금 해제'}
          </button>
        </div>
      </div>
    </div>
  )
}
