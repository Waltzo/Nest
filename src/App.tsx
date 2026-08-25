import { useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import type { Layout } from 'react-grid-layout'
import type { Card, CardType, CardLayout, DashboardConfig } from './types'
import { cardDefaults, cardDefaultSize, SM_COLS } from './types'
import type { Breakpoint } from './components/GridBoard'
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

// Ensure every card has a mobile (sm) layout. Missing ones are stacked in a
// single column so the 4-col view is tidy instead of an auto-reflowed jumble.
function withSmLayouts(cfg: DashboardConfig): DashboardConfig {
  let nextY = cfg.cards.reduce(
    (m, c) => (c.layoutSm ? Math.max(m, c.layoutSm.y + c.layoutSm.h) : m),
    0,
  )
  const cards = cfg.cards.map((c) => {
    if (c.layoutSm) return c
    const w = Math.min(SM_COLS, Math.max(1, c.layout.w))
    const sm: CardLayout = { x: 0, y: nextY, w, h: c.layout.h }
    nextY += c.layout.h
    return { ...c, layoutSm: sm }
  })
  return { ...cfg, cards }
}

export default function App() {
  const [config, setConfig] = useState<DashboardConfig | null>(null)
  const [editing, setEditing] = useState(false)
  const [gateOpen, setGateOpen] = useState(false)
  const [tokenOpen, setTokenOpen] = useState(false)
  const [pendingPublish, setPendingPublish] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editBreakpoint, setEditBreakpoint] = useState<Breakpoint>('lg')
  const [publishing, setPublishing] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const firstLoad = useRef(true)

  // Initial load.
  useEffect(() => {
    loadConfig().then((c) => setConfig(withSmLayouts(c)))
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
    // Drop new card at the bottom of each layout.
    const maxY = config.cards.reduce(
      (m, c) => Math.max(m, c.layout.y + c.layout.h),
      0,
    )
    const maxYSm = config.cards.reduce(
      (m, c) => (c.layoutSm ? Math.max(m, c.layoutSm.y + c.layoutSm.h) : m),
      0,
    )
    const card: Card = {
      id: uuid(),
      type,
      layout: { x: 0, y: maxY, w: size.w, h: size.h },
      layoutSm: { x: 0, y: maxYSm, w: Math.min(SM_COLS, size.w), h: size.h },
      props: { ...cardDefaults[type] },
    }
    patch({ cards: [...config.cards, card] })
  }

  function deleteCard(id: string) {
    if (!config) return
    patch({ cards: config.cards.filter((c) => c.id !== id) })
  }

  function onLayoutChange(bp: Breakpoint, layout: Layout[]) {
    if (!config) return
    const byId = new Map(layout.map((l) => [l.i, l]))
    patch({
      cards: config.cards.map((c) => {
        const l = byId.get(c.id)
        if (!l) return c
        const next: CardLayout = { x: l.x, y: l.y, w: l.w, h: l.h }
        return bp === 'sm' ? { ...c, layoutSm: next } : { ...c, layout: next }
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
    setConfig(withSmLayouts(repo))
    showToast('리포의 config를 불러왔습니다.', 'ok')
  }

  async function doImport(file: File) {
    try {
      const imported = await importConfig(file)
      setConfig(withSmLayouts(imported))
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
        editBreakpoint={editBreakpoint}
        onToggleBreakpoint={() =>
          setEditBreakpoint((b) => (b === 'lg' ? 'sm' : 'lg'))
        }
      />

      <GridBoard
        cards={config.cards}
        cols={config.cols}
        rowHeight={config.rowHeight}
        editing={editing}
        editBreakpoint={editBreakpoint}
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
