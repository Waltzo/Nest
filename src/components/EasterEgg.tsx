// Shown when the viewport is narrower than 400px: a single "dead bird" card.
// The nest is too small to hold the dashboard.
export default function EasterEgg() {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', padding: 20 }}>
      <div
        className="glass"
        style={{ padding: '32px 28px', borderRadius: 20, textAlign: 'center', maxWidth: 280 }}
      >
        <div
          style={{
            fontSize: 64,
            lineHeight: 1,
            transform: 'rotate(180deg)',
            filter: 'grayscale(1)',
          }}
        >
          🐦
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 16 }}>
          화면이 너무 작아요
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 6 }}>
          둥지가 감당 못 함… 🪹
        </div>
      </div>
    </div>
  )
}
