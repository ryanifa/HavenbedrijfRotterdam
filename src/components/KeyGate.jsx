import { useState } from 'react'

// Toegangsscherm dat om een AISStream API-key vraagt wanneer er nog geen is.
// De key wordt in localStorage bewaard (komt niet in de repo).
export default function KeyGate({ onConnect, onDemo, onCancel }) {
  const [value, setValue] = useState('')

  function submit(e) {
    e.preventDefault()
    const key = value.trim()
    if (key) onConnect(key)
  }

  return (
    <div className="gate">
      <form className="gate-card panel" onSubmit={submit}>
        {onCancel && (
          <button type="button" className="close-btn gate-close" onClick={onCancel} aria-label="Sluiten">×</button>
        )}
        <div className="gate-logo">⚓</div>
        <h1>Port of Rotterdam · Live Vessel Traffic</h1>
        <p className="gate-sub">
          Voer je gratis <strong>AISStream</strong> API-key in om echte
          scheepsdata van de haven van Rotterdam live op de kaart te zien.
        </p>

        <input
          className="gate-input"
          type="password"
          placeholder="AISStream API-key…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <button className="gate-btn" type="submit" disabled={!value.trim()}>
          Verbinden met live AIS
        </button>

        <div className="gate-steps">
          <span>Nog geen key?</span>
          <ol>
            <li>Ga naar <a href="https://aisstream.io" target="_blank" rel="noreferrer">aisstream.io</a> en maak een gratis account.</li>
            <li>Maak onder <em>API Keys</em> een nieuwe key aan.</li>
            <li>Plak hem hierboven — klaar.</li>
          </ol>
        </div>

        {onDemo && (
          <button type="button" className="gate-link" onClick={onDemo}>
            of bekijk eerst de demo-simulatie →
          </button>
        )}

        <div className="gate-version">build {__APP_VERSION__}</div>
      </form>
    </div>
  )
}
