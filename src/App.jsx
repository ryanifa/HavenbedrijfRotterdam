import { useEffect, useMemo, useRef, useState } from 'react'
import MapView from './components/MapView.jsx'
import Sidebar from './components/Sidebar.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import { MockSource } from './data/source.js'
import { SHIP_TYPES } from './data/fleet.js'

// Wil je later live AIS-data? Vervang MockSource hieronder door AisStreamSource
// (zie src/data/source.js) en geef je aisstream.io API-key mee.
function createSource() {
  return new MockSource({ count: 72, tickMs: 1000, timeScale: 26 })
}

export default function App() {
  const [ships, setShips] = useState([])
  const [selectedMmsi, setSelectedMmsi] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showTrails, setShowTrails] = useState(true)
  const [clock, setClock] = useState(new Date())
  // typeFilter: object met per type true/false; null = alles aan
  const [typeFilter, setTypeFilter] = useState(null)
  const sourceRef = useRef(null)

  useEffect(() => {
    const source = createSource()
    sourceRef.current = source
    // nieuwe array-referentie forceren zodat React her-rendert
    source.start((list) => setShips([...list]))
    return () => source.stop()
  }, [])

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const selectedShip = useMemo(
    () => ships.find((s) => s.mmsi === selectedMmsi) || null,
    [ships, selectedMmsi]
  )

  function toggleType(key) {
    setTypeFilter((prev) => {
      const base = prev || Object.fromEntries(Object.keys(SHIP_TYPES).map((k) => [k, true]))
      const next = { ...base, [key]: !base[key] }
      // als alles weer aan staat -> terug naar null (geen filter)
      if (Object.values(next).every(Boolean)) return null
      return next
    })
  }

  // ESC sluit het detailpaneel
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSelectedMmsi(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <MapView
        ships={ships}
        selectedMmsi={selectedMmsi}
        onSelect={setSelectedMmsi}
        showHeatmap={showHeatmap}
        showTrails={showTrails}
        typeFilter={typeFilter}
      />

      <header className="topbar">
        <div className="brand">
          <span className="logo">⚓</span>
          <div>
            <h1>PORT OF ROTTERDAM</h1>
            <div className="sub">Mission Control · Live Vessel Traffic</div>
          </div>
        </div>
        <div className="clock">
          {clock.toLocaleTimeString('nl-NL')} ·{' '}
          {clock.toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: 'short' })}
        </div>
        <div className="live-pill">
          <span className="live-dot" /> LIVE
        </div>
      </header>

      <StatsPanel ships={ships} typeFilter={typeFilter} onToggleType={toggleType} />

      <div className="controls panel">
        <button className={`toggle ${showTrails ? 'on' : ''}`} onClick={() => setShowTrails((v) => !v)}>
          ✦ Sporen
        </button>
        <button className={`toggle ${showHeatmap ? 'on' : ''}`} onClick={() => setShowHeatmap((v) => !v)}>
          ◍ Heatmap
        </button>
      </div>

      <Sidebar ship={selectedShip} onClose={() => setSelectedMmsi(null)} />

      {!selectedShip && (
        <div className="hint panel">
          Klik op een schip voor live details <span className="kbd">ESC</span> om te sluiten
        </div>
      )}
    </div>
  )
}
