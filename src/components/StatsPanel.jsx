// Live statistieken links: kerncijfers + type-verdeling (tevens filter).

import { SHIP_TYPES } from '../data/fleet.js'

export default function StatsPanel({ ships, typeFilter, onToggleType }) {
  const total = ships.length
  const underway = ships.filter((s) => s.status === 'Onderweg').length
  const moored = ships.filter((s) => s.status === 'Afgemeerd').length
  const anchored = ships.filter((s) => s.status === 'Voor anker').length
  const avgSpeed =
    underway > 0
      ? (
          ships.filter((s) => s.status === 'Onderweg').reduce((a, s) => a + s.speed, 0) /
          underway
        ).toFixed(1)
      : '0.0'

  const counts = {}
  for (const key of Object.keys(SHIP_TYPES)) counts[key] = 0
  for (const s of ships) counts[s.type]++
  const max = Math.max(1, ...Object.values(counts))

  return (
    <div className="stats">
      <div className="panel stat-grid">
        <div className="stat accent">
          <span className="value">{total}</span>
          <span className="label">Schepen in beeld</span>
        </div>
        <div className="stat good">
          <span className="value">{underway}</span>
          <span className="label">Onderweg</span>
        </div>
        <div className="stat warn">
          <span className="value">{anchored}</span>
          <span className="label">Voor anker</span>
        </div>
        <div className="stat">
          <span className="value">{moored}</span>
          <span className="label">Afgemeerd</span>
        </div>
        <div className="stat">
          <span className="value">{avgSpeed}</span>
          <span className="label">Gem. snelheid (kn)</span>
        </div>
        <div className="stat">
          <span className="value">{Object.values(counts).filter((c) => c > 0).length}</span>
          <span className="label">Scheepstypes</span>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">Type · klik om te filteren</h3>
        <div className="type-list">
          {Object.entries(SHIP_TYPES).map(([key, t]) => (
            <div
              key={key}
              className={`type-row ${typeFilter && !typeFilter[key] ? 'dim' : ''}`}
              onClick={() => onToggleType(key)}
            >
              <span className="dot" style={{ background: t.color }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="name">{t.label}</span>
                  <span className="count">{counts[key]}</span>
                </div>
                <div className="type-bar">
                  <span style={{ width: `${(counts[key] / max) * 100}%`, background: t.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
