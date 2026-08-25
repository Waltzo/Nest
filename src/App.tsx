import { useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import type { Layout } from 'react-grid-layout'
import type { Card, CardType, DashboardConfig } from './types'
import { cardDefaults, cardDefaultSize } from './types'
import {
  loadConfig,
  saveLocal,
  fetchRepoConfig,
  exportConfig,
  importConfig,
} from './config/storage'
import { getToken, publishToGitHub } from './config/github'
import GridBoard from './components/GridBoard'
import Toolbar from './components/Toolbar'
import PasswordGate from './components/PasswordGate'
import TokenModal from './components/TokenModal'
import CardEditorModal from './components/CardEditorModal'

const UNLOCK_KEY = 'nest.unlocked'

export default function App() {
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [editing, setEditing] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const [tokenOpen, setTokenOpen] = useState(false)
  const [pendingPublish, setPendingPublish] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const firstLoad = useRef(true)

  // Initial load.
  useEffect(() => {
    loadConfig().then(setConfig)
  }, [])

  // Apply theme to <html> for CSS variables.
  useEffect(() => {
    if (config) document.documentElement.dataset.theme = config.theme
  }, [config?.theme])

  // Persist edits to localStorage (skip the very first render after load).
  useEffect(() => {
    if (!config) return
    if (firstLoad.current) {
      firstLoad.current = false
      return
    }
    saveLocal(config)
  }, [config])

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    window.setTimeout(() => setToast(null), 3000)
  }

  function patch(partial: Partial<DashboardConfig>) {
    setConfig((c) => (c ? { ...c, ...partial } : c))
  }

  // ---- Edit mode gating ----
  function toggleEdit() {
    if (editing) {
      setEditing(false)
      return
    }
    if (sessionStorage.getItem(UNLOCK_KEY) === '1') {
      setEditing(true)
      return
    }
    setGateOpen(true)
  }

  function onUnlocked() {
    sessionStorage.setItem(UNLOCK_KEY, '1')
    setGateOpen(false)
    setEditing(true)
  }

  function onSetupPassword(hash: string) {
    patch({ editPasswordHash: hash })
    sessionStorage.setItem(UNLOCK_KEY, '1')
    setGateOpen(false)
    setEditing(true)
  }

  // ---- Card ops ----
  function addCard(type: CardType) {
    if (!config) return
    const size = cardDefaultSize[type]
    // Drop new card at the bottom of the grid.
    const maxY = config.cards.reduce(
      (m, c) => Math.max(m, c.layout.y + c.layout.h),
      0,
    )
    const card: Card = {
      id: uuid(),
      type,
      layout: { x: 0, y: maxY, w: size.w, h: size.h },
      props: { ...cardDefaults[type] },
    }
    patch({ cards: [...config.cards, card] })
  }

  function deleteCard(id: string) {
    if (!config) return
    patch({ cards: config.cards.filter((c) => c.id !== id) })
  }

  function onLayoutChange(layout: Layout[]) {
    if (!config) return
    const byId = new Map(layout.map((l) => [l.i, l]))
    patch({
      cards: config.cards.map((c) => {
        const l = byId.get(c.id)
        return l ? { ...c, layout: { x: l.x, y: l.y, w: l.w, h: l.h } } : c
      }),
    })
  }

  function saveCardProps(id: string, props: Record<string, unknown>) {
    if (!config) return
    patch({ cards: config.cards.map((c) => (c.id === id ? { ...c, props } : c)) })
    setEditingCardId(null)
  }

  // ---- Publish / import / export ----
  async function publish() {
    if (!config) return
    const token = getToken()
    if (!token) {
      setPendingPublish(true)
      setTokenOpen(true)
      return
    }
    setPublishing(true)
    try {
      const { commitUrl } = await publishToGitHub(config, token)
      showToast(commitUrl ? '게시 완료! 리포에 커밋됨.' : '게시 완료!', 'ok')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '게시 실패', 'err')
    } finally {
      setPublishing(false)
    }
  }

  function onTokenSaved() {
    setTokenOpen(false)
    if (pendingPublish) {
      setPendingPublish(false)
      publish()
    }
  }

  async function refreshFromRepo() {
    const repo = await fetchRepoConfig()
    setConfig(repo)
    showToast('리포의 config를 불러왔습니다.', 'ok')
  }

  async function doImport(file: File) {
    try {
      const imported = await importConfig(file)
      setConfig(imported)
      showToast('Import 완료.', 'ok')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Import 실패', 'err')
    }
  }

  if (!config) {
    return (
      <div className="app" style={{ opacity: 0.6, padding: 40 }}>
        불러오는 중…
      </div>
    )
  }

  const editingCard = config.cards.find((c) => c.id === editingCardId) ?? null

  return (
    <div className={`app${editing ? ' editing' : ''}`}>
      <Toolbar
        editing={editing}
        theme={config.theme}
        publishing={publishing}
        onToggleEdit={toggleEdit}
        onToggleTheme={() =>
          patch({ theme: config.theme === 'light' ? 'dark' : 'light' })
        }
        onAddCard={addCard}
        onPublish={publish}
        onOpenToken={() => setTokenOpen(true)}
        onExport={() => exportConfig(config)}
        onImport={doImport}
        onRefreshFromRepo={refreshFromRepo}
      />

      <GridBoard
        cards={config.cards}
        cols={config.cols}
        rowHeight={config.rowHeight}
        editing={editing}
        onLayoutChange={onLayoutChange}
        onDeleteCard={deleteCard}
        onEditCard={setEditingCardId}
      />

      {gateOpen && (
        <PasswordGate
          existingHash={config.editPasswordHash}
          onClose={() => setGateOpen(false)}
          onSetupComplete={onSetupPassword}
          onUnlocked={onUnlocked}
        />
      )}

      {tokenOpen && (
        <TokenModal
          onClose={() => {
            setTokenOpen(false)
            setPendingPublish(false)
          }}
          onSaved={onTokenSaved}
        />
      )}

      {editingCard && (
        <CardEditorModal
          card={editingCard}
          onClose={() => setEditingCardId(null)}
          onSave={(props) => saveCardProps(editingCard.id, props)}
        />
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  )
}
