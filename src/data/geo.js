// Geografische helpers voor de simulatie van scheepsbewegingen.
// Coördinaten zijn [lon, lat] (zoals MapLibre/GeoJSON ze verwacht).

const R = 6371000 // straal aarde in meters

export function toRad(deg) {
  return (deg * Math.PI) / 180
}

export function toDeg(rad) {
  return (rad * 180) / Math.PI
}

// Afstand tussen twee [lon,lat]-punten in meters (haversine).
export function distanceMeters([lon1, lat1], [lon2, lat2]) {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Kompaskoers (0-360°, 0 = noord) van punt a naar punt b.
export function bearing([lon1, lat1], [lon2, lat2]) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2))
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1))
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

// Verplaats een [lon,lat]-punt over `dist` meter langs koers `brng` (graden).
export function destinationPoint([lon, lat], brng, dist) {
  const d = dist / R
  const b = toRad(brng)
  const lat1 = toRad(lat)
  const lon1 = toRad(lon)
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b)
  )
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(b) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    )
  return [toDeg(lon2), toDeg(lat2)]
}

// Totale lengte van een route (array van [lon,lat]-punten) in meters.
export function routeLength(points) {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += distanceMeters(points[i - 1], points[i])
  }
  return total
}

// Bepaal positie + koers op afstand `dist` (meter) langs een route.
export function pointAlongRoute(points, dist) {
  let remaining = dist
  for (let i = 1; i < points.length; i++) {
    const segLen = distanceMeters(points[i - 1], points[i])
    if (remaining <= segLen || i === points.length - 1) {
      const frac = segLen === 0 ? 0 : Math.min(remaining / segLen, 1)
      const brng = bearing(points[i - 1], points[i])
      const pos = destinationPoint(points[i - 1], brng, remaining)
      return { position: pos, heading: brng, segment: i, frac }
    }
    remaining -= segLen
  }
  const last = points[points.length - 1]
  return { position: last, heading: 0, segment: points.length - 1, frac: 1 }
}
