import { useEffect, useMemo, useRef, useState } from 'react'
import MapView, { BASEMAPS } from './components/MapView.jsx'
import Sidebar from './components/Sidebar.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import KeyGate from './components/KeyGate.jsx'
import { MockSource, AisStreamSource } from './data/source.js'
import { SHIP_TYPES } from './data/fleet.js'

// API-key uit build (GitHub Secret -> VITE_AIS_KEY) of uit localStorage.
const ENV_KEY = import.meta.env.VITE_AIS_KEY || ''
const STORED_KEY = typeof localStorage !== 'undefined' ? localStorage.getItem('ais_key') || '' : ''
const INITIAL_KEY = STORED_KEY || ENV_KEY

const STATUS_LABEL = {
  connecting: 'VERBINDEN…',
  live: 'LIVE',
  reconnecting: 'HERVERBINDEN…',
  error: 'FOUT',
  demo: 'DEMO'
}

export default function App() {
  const [ships, setShips] = useState([])
  const [selectedMmsi, setSelectedMmsi] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showTrails, setShowTrails] = useState(true)
  const [clock, setClock] = useState(new Date())
  const [typeFilter, setTypeFilter] = useState(null)
  const [basemap, setBasemap] = useState('color')

  // 'gate' = vraag om key, 'live' = echte AIS, 'demo' = simulatie
  const [aisKey, setAisKey] = useState(INITIAL_KEY)
  const [mode, setMode] = useState(INITIAL_KEY ? 'live' : 'gate')
  const [status, setStatus] = useState(INITIAL_KEY ? 'connecting' : 'demo')
  const [statusDetail, setStatusDetail] = useState('')
  const sourceRef = useRef(null)

  // start/stop de juiste databron op basis van de modus
  useEffect(() => {
    if (mode === 'gate') return
    setShips([])
    setStatusDetail('')
    let source
    if (mode === 'live' && aisKey) {
      source = new AisStreamSource({ apiKey: aisKey })
      source.setStatusHandler((s, detail) => {
        setStatus(s)
        setStatusDetail(detail || '')
      })
    } else {
      source = new MockSource({ count: 72, tickMs: 1000, timeScale: 26 })
      setStatus('demo')
    }
    sourceRef.current = source
    source.start((list) => setShips([...list]))
    return () => source.stop()
  }, [mode, aisKey])

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
      if (Object.values(next).every(Boolean)) return null
      return next
    })
  }

  function connectLive(key) {
    localStorage.setItem('ais_key', key)
    setAisKey(key)
    setMode('live')
  }

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSelectedMmsi(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (mode === 'gate') {
    return (
      <KeyGate
        onConnect={connectLive}
        onDemo={() => { setStatus('demo'); setMode('demo') }}
        onCancel={aisKey ? () => setMode('live') : undefined}
      />
    )
  }

  const isLive = mode === 'live'
  const statusClass = status === 'live' ? 'good' : (status === 'error' || status === 'reconnecting') ? 'bad' : 'warn'

  // eerlijke melding onderin op basis van de echte verbindingsstatus.
  // kind 'instruction' wordt op mobiel verborgen (app is daar intuïtief genoeg).
  function hintInfo() {
    const instruction = {
      kind: 'instruction',
      node: <>Klik op een schip voor live details <span className="kbd">ESC</span> om te sluiten</>
    }
    if (!isLive) return instruction
    if (status === 'error' || status === 'reconnecting') {
      return {
        kind: 'status',
        node: <>⚠️ Geen AIS-verbinding{statusDetail ? ` — ${statusDetail}` : ''}. Controleer je API-key (knop ⚙ Bron) of netwerk.</>
      }
    }
    if (ships.length === 0) {
      return {
        kind: 'status',
        node: status === 'live' ? 'Verbonden met AIS — wachten op de eerste scheepsdata…' : 'Verbinden met AIS…'
      }
    }
    return instruction
  }

  return (
    <div className="app">
      <MapView
        ships={ships}
        selectedMmsi={selectedMmsi}
        onSelect={setSelectedMmsi}
        showHeatmap={showHeatmap}
        showTrails={showTrails}
        typeFilter={typeFilter}
        basemap={basemap}
      />

      <header className="topbar">
        <div className="brand">
          <span className="logo">⚓</span>
          <div>
            <h1>PORT OF ROTTERDAM</h1>
            <div className="sub">Mission Control · {isLive ? 'Live AIS' : 'Demo-simulatie'}</div>
          </div>
        </div>
        <div className="clock">
          {clock.toLocaleTimeString('nl-NL')} ·{' '}
          {clock.toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: 'short' })}
          <span className="build-tag" title="Build-versie">build {__APP_VERSION__}</span>
        </div>
        <div className={`live-pill ${statusClass}`}>
          <span className="live-dot" /> {STATUS_LABEL[status] || 'LIVE'}
        </div>
      </header>

      <StatsPanel ships={ships} typeFilter={typeFilter} onToggleType={toggleType} />

      <div className="controls panel">
        {Object.entries(BASEMAPS).map(([key, cfg]) => (
          <button
            key={key}
            className={`toggle ${basemap === key ? 'on' : ''}`}
            onClick={() => setBasemap(key)}
          >
            {cfg.label}
          </button>
        ))}
        <span className="ctrl-divider" />
        <button className={`toggle ${showTrails ? 'on' : ''}`} onClick={() => setShowTrails((v) => !v)}>
          ✦ Sporen
        </button>
        <button className={`toggle ${showHeatmap ? 'on' : ''}`} onClick={() => setShowHeatmap((v) => !v)}>
          ◍ Heatmap
        </button>
        <button className="toggle source-btn" onClick={() => setMode('gate')}>
          ⚙ Bron
        </button>
      </div>

      <Sidebar ship={selectedShip} onClose={() => setSelectedMmsi(null)} />

      {!selectedShip && (() => {
        const h = hintInfo()
        return <div className={`hint panel ${h.kind === 'instruction' ? 'is-instruction' : ''}`}>{h.node}</div>
      })()}
    </div>
  )
}
