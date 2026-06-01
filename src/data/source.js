// Data-laag met verwisselbare bron.
//
// MockSource  -> gesimuleerde vloot die live over de kaart vaart (default).
// AisStreamSource (stub) -> echte real-time AIS via aisstream.io (zie onderaan).
//
// Beide leveren dezelfde interface:
//   source.start(onUpdate)   // onUpdate(ships[]) wordt periodiek aangeroepen
//   source.stop()
//   source.ships             // huidige array van schepen
//
// Zo kun je later in App.jsx simpelweg MockSource vervangen door AisStreamSource
// zonder de rest van de UI aan te raken.

import { createFleet } from './fleet.js'
import { pointAlongRoute, destinationPoint } from './geo.js'

const KNOTS_TO_MS = 0.514444 // 1 knoop = 0,514444 m/s

export class MockSource {
  constructor({ count = 70, tickMs = 1000, timeScale = 30, trailLength = 25 } = {}) {
    this.tickMs = tickMs
    this.timeScale = timeScale // versnel de tijd zodat beweging zichtbaar is
    this.trailLength = trailLength
    this.ships = createFleet(count)
    this.timer = null
    this.onUpdate = null
    this._primeTrails()
  }

  _primeTrails() {
    // Geef varende schepen alvast een beginpositie zodat het trail-spoor klopt.
    for (const s of this.ships) {
      if (s.behaviour === 'route') {
        const { position, heading } = pointAlongRoute(s.routePoints, s.dist)
        s.position = position
        s.heading = heading
      }
    }
  }

  start(onUpdate) {
    this.onUpdate = onUpdate
    this._emit()
    this.timer = setInterval(() => this._tick(), this.tickMs)
    return this
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  _tick() {
    const dt = (this.tickMs / 1000) * this.timeScale // gesimuleerde seconden
    for (const s of this.ships) {
      if (s.behaviour === 'route') {
        const meters = s.speed * KNOTS_TO_MS * dt
        s.dist += meters * s.dir
        // keer om aan de uiteinden van de vaargeul
        if (s.dist >= s.routeTotal) {
          s.dist = s.routeTotal
          s.dir = -1
        } else if (s.dist <= 0) {
          s.dist = 0
          s.dir = 1
        }
        const { position, heading } = pointAlongRoute(s.routePoints, s.dist)
        s.position = position
        s.heading = heading
      } else if (s.behaviour === 'anchor') {
        // langzaam ronddrijven rond het anker
        s.heading = (s.heading + (Math.random() - 0.5) * 4 + 360) % 360
        const drift = 0.3 * KNOTS_TO_MS * dt
        s.position = destinationPoint(s.position, s.heading, drift)
      }
      // afgemeerde schepen bewegen niet

      // werk het spoor (trail) bij
      if (s.speed > 0.5) {
        s.trail.push([...s.position])
        if (s.trail.length > this.trailLength) s.trail.shift()
      }
    }
    this._emit()
  }

  _emit() {
    if (this.onUpdate) this.onUpdate(this.ships)
  }
}

// --- Live bron (stub) -------------------------------------------------------
// Activeer later door in App.jsx te wisselen naar AisStreamSource.
// Vereist een gratis API-key van https://aisstream.io en idealiter een
// kleine server-proxy (de websocket-key hoort niet in de browser thuis).
export class AisStreamSource {
  constructor({ apiKey, boundingBox } = {}) {
    this.apiKey = apiKey
    // standaard bounding box rond de haven van Rotterdam
    this.boundingBox = boundingBox || [[51.85, 3.75], [52.02, 4.55]]
    this.ships = []
    this.ws = null
    this.onUpdate = null
  }

  start(onUpdate) {
    this.onUpdate = onUpdate
    this.ws = new WebSocket('wss://stream.aisstream.io/v0/stream')
    this.ws.onopen = () => {
      this.ws.send(
        JSON.stringify({
          APIKey: this.apiKey,
          BoundingBoxes: [this.boundingBox],
          FilterMessageTypes: ['PositionReport', 'ShipStaticData']
        })
      )
    }
    this.ws.onmessage = (event) => this._handle(JSON.parse(event.data))
    return this
  }

  stop() {
    if (this.ws) this.ws.close()
    this.ws = null
  }

  _handle(msg) {
    // TODO: AIS-bericht mappen naar het ship-formaat dat de UI verwacht
    // (mmsi, name, type, position [lon,lat], heading, speed, ...).
    // Zie de README voor het volledige mapping-voorbeeld.
    if (this.onUpdate) this.onUpdate(this.ships)
  }
}
