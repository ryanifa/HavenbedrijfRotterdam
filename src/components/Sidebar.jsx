// Detail-paneel dat openschuift wanneer je een schip aanklikt.

function fmtEta(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('nl-NL', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return '—'
  }
}

export default function Sidebar({ ship, onClose }) {
  return (
    <aside className={`sidebar panel ${ship ? 'open' : ''}`}>
      {ship && (
        <>
          <div className="sidebar-head">
            <button className="close-btn" onClick={onClose} aria-label="Sluiten">×</button>
            <span className="type-chip" style={{ background: `${ship.color}22`, color: ship.color }}>
              <span className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: ship.color, display: 'inline-block' }} />
              {ship.typeLabel}
            </span>
            <h2>{ship.name}</h2>
            <div className="mmsi">MMSI {ship.mmsi} · {ship.flag.emoji} {ship.flag.name}</div>
          </div>

          <div className="sidebar-body">
            <div className="gauge-row">
              <div className="gauge">
                <div><span className="big">{ship.speed.toFixed(1)}</span> <span className="unit">kn</span></div>
                <div className="cap">Snelheid</div>
              </div>
              <div className="gauge">
                <div><span className="big">{Math.round(ship.heading)}</span><span className="unit">°</span></div>
                <div className="cap">Koers</div>
              </div>
            </div>

            <div className="kv">
              <span className="k">Status</span>
              <span className="v">
                <span className={`status-badge status-${ship.status.replace(/\s/g, '.')}`}>{ship.status}</span>
              </span>
            </div>
            <div className="kv"><span className="k">Bestemming</span><span className="v">{ship.destination}</span></div>
            <div className="kv"><span className="k">ETA</span><span className="v">{fmtEta(ship.eta)}</span></div>
            {ship.berthName && <div className="kv"><span className="k">Ligplaats</span><span className="v">{ship.berthName}</span></div>}
            <div className="kv"><span className="k">Afmetingen</span><span className="v">{ship.length} × {ship.width} m</span></div>
            <div className="kv"><span className="k">Diepgang</span><span className="v">{ship.draught} m</span></div>
            <div className="kv"><span className="k">Brutotonnage</span><span className="v">{ship.grossTonnage.toLocaleString('nl-NL')} GT</span></div>
            <div className="kv"><span className="k">Bouwjaar</span><span className="v">{ship.yearBuilt}</span></div>
            <div className="kv"><span className="k">Positie</span><span className="v">{ship.position[1].toFixed(4)}, {ship.position[0].toFixed(4)}</span></div>
          </div>
        </>
      )}
    </aside>
  )
}
