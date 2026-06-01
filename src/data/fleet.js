// Definitie van scheepstypes en een generator voor een realistische vloot.

import { FAIRWAYS, ANCHORAGE, BERTHS } from './routes.js'
import { routeLength } from './geo.js'

// Scheepstypes met kleur (voor de kaart) en typische afmetingen.
export const SHIP_TYPES = {
  container: { label: 'Containerschip', color: '#38bdf8', maxLen: 400, maxSpeed: 13 },
  tanker: { label: 'Tanker', color: '#f97316', maxLen: 330, maxSpeed: 11 },
  bulk: { label: 'Bulkschip', color: '#a78bfa', maxLen: 300, maxSpeed: 11 },
  cargo: { label: 'Vrachtschip', color: '#34d399', maxLen: 200, maxSpeed: 12 },
  tug: { label: 'Sleepboot', color: '#fbbf24', maxLen: 35, maxSpeed: 10 },
  pilot: { label: 'Loodsboot', color: '#f472b6', maxLen: 25, maxSpeed: 16 },
  passenger: { label: 'Passagiersschip', color: '#22d3ee', maxLen: 180, maxSpeed: 14 },
  dredger: { label: 'Baggerschip', color: '#94a3b8', maxLen: 130, maxSpeed: 8 }
}

const FLAGS = [
  { code: 'NL', name: 'Nederland', emoji: '🇳🇱' },
  { code: 'PA', name: 'Panama', emoji: '🇵🇦' },
  { code: 'LR', name: 'Liberia', emoji: '🇱🇷' },
  { code: 'MT', name: 'Malta', emoji: '🇲🇹' },
  { code: 'MH', name: 'Marshalleilanden', emoji: '🇲🇭' },
  { code: 'SG', name: 'Singapore', emoji: '🇸🇬' },
  { code: 'DE', name: 'Duitsland', emoji: '🇩🇪' },
  { code: 'GR', name: 'Griekenland', emoji: '🇬🇷' },
  { code: 'CY', name: 'Cyprus', emoji: '🇨🇾' },
  { code: 'BE', name: 'België', emoji: '🇧🇪' }
]

const NAME_PARTS_A = [
  'MSC', 'Maersk', 'Stena', 'Nordic', 'Atlantic', 'Rhine', 'Delta', 'Polar',
  'Orient', 'Pacific', 'Iberian', 'Baltic', 'Hanseatic', 'Royal', 'Spliethoff',
  'Vroon', 'Damen', 'Smit', 'Boluda', 'Ever'
]
const NAME_PARTS_B = [
  'Rotterdam', 'Pioneer', 'Voyager', 'Trader', 'Spirit', 'Endeavour', 'Falcon',
  'Horizon', 'Guardian', 'Mariner', 'Express', 'Carrier', 'Star', 'Eagle',
  'Bridge', 'Wave', 'Sun', 'Breeze', 'Glory', 'Pearl'
]

const DESTINATIONS = [
  'Shanghai', 'Singapore', 'Hamburg', 'Antwerpen', 'New York', 'Santos',
  'Dubai', 'Felixstowe', 'Gioia Tauro', 'Algeciras', 'Le Havre', 'Gdansk',
  'Rotterdam', 'Bremerhaven', 'Piraeus'
]

const STATUSES = {
  underway: 'Onderweg',
  moored: 'Afgemeerd',
  anchor: 'Voor anker'
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
function rand(min, max) {
  return min + Math.random() * (max - min)
}
function randInt(min, max) {
  return Math.floor(rand(min, max + 1))
}

let mmsiCounter = 244000000

function makeName() {
  return `${pick(NAME_PARTS_A)} ${pick(NAME_PARTS_B)}`
}

function makeEta() {
  const d = new Date(Date.now() + rand(1, 72) * 3600 * 1000)
  return d.toISOString()
}

// Maak één schip aan met begintoestand.
function createShip(typeKey, behaviour) {
  const type = SHIP_TYPES[typeKey]
  const length = Math.round(rand(type.maxLen * 0.45, type.maxLen))
  const width = Math.round(length / rand(5.5, 8))
  const ship = {
    mmsi: mmsiCounter++,
    name: makeName(),
    type: typeKey,
    typeLabel: type.label,
    color: type.color,
    flag: pick(FLAGS),
    length,
    width,
    draught: +rand(4, Math.min(16, length / 22)).toFixed(1),
    destination: pick(DESTINATIONS),
    eta: makeEta(),
    yearBuilt: randInt(1998, 2024),
    grossTonnage: Math.round(length * width * rand(2.5, 5)),
    behaviour, // 'route' | 'anchor' | 'berth'
    trail: []
  }

  if (behaviour === 'route') {
    const routeKey = pick(Object.keys(FAIRWAYS))
    const points = FAIRWAYS[routeKey]
    ship.routeKey = routeKey
    ship.routePoints = points
    ship.routeTotal = routeLength(points)
    ship.dir = Math.random() > 0.5 ? 1 : -1 // varen heen of terug
    ship.dist = rand(0, ship.routeTotal)
    ship.speed = +rand(type.maxSpeed * 0.5, type.maxSpeed).toFixed(1) // knopen
    ship.status = STATUSES.underway
  } else if (behaviour === 'anchor') {
    const a = ANCHORAGE
    ship.position = [
      a.center[0] + rand(-a.radiusDeg, a.radiusDeg),
      a.center[1] + rand(-a.radiusDeg * 0.6, a.radiusDeg * 0.6)
    ]
    ship.heading = rand(0, 360)
    ship.speed = +rand(0, 0.4).toFixed(1)
    ship.status = STATUSES.anchor
  } else {
    const berth = pick(BERTHS)
    ship.position = [
      berth.pos[0] + rand(-0.004, 0.004),
      berth.pos[1] + rand(-0.002, 0.002)
    ]
    ship.berthName = berth.name
    ship.heading = pick([45, 90, 135, 225, 270])
    ship.speed = 0
    ship.status = STATUSES.moored
  }
  return ship
}

// Bouw een volledige vloot. `count` schepen, verdeeld over gedragingen.
export function createFleet(count = 70) {
  const ships = []
  const typeKeys = Object.keys(SHIP_TYPES)
  for (let i = 0; i < count; i++) {
    // verdeling: 55% varend, 25% afgemeerd, 20% voor anker
    const r = Math.random()
    const behaviour = r < 0.55 ? 'route' : r < 0.8 ? 'berth' : 'anchor'
    // type-verdeling: containers en tankers domineren
    const tr = Math.random()
    let typeKey
    if (tr < 0.32) typeKey = 'container'
    else if (tr < 0.52) typeKey = 'tanker'
    else if (tr < 0.65) typeKey = 'bulk'
    else if (tr < 0.78) typeKey = 'cargo'
    else if (tr < 0.86) typeKey = 'tug'
    else if (tr < 0.92) typeKey = 'pilot'
    else if (tr < 0.97) typeKey = 'passenger'
    else typeKey = 'dredger'
    ships.push(createShip(typeKey, behaviour))
  }
  return ships
}

export { STATUSES }
