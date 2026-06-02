import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

// Beschikbare basemaps (geen API-key nodig). Schakelbaar in de UI.
export const BASEMAPS = {
  color: {
    label: '🌊 Kleur',
    tiles: [
      'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png'
    ],
    attribution: '© OpenStreetMap, © CARTO',
    paint: { 'raster-opacity': 1, 'raster-saturation': 0.25, 'raster-contrast': 0.05 },
    bg: '#0a1626'
  },
  satellite: {
    label: '🛰️ Satelliet',
    tiles: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    ],
    attribution: '© Esri, Maxar, Earthstar Geographics',
    paint: { 'raster-opacity': 1, 'raster-saturation': 0.3, 'raster-contrast': 0.1 },
    bg: '#06141f'
  },
  dark: {
    label: '🌙 Donker',
    tiles: [
      'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
    ],
    attribution: '© OpenStreetMap, © CARTO',
    paint: { 'raster-opacity': 0.92, 'raster-saturation': 0, 'raster-contrast': 0 },
    bg: '#060b14'
  }
}

const DEFAULT_BASEMAP = 'color'

const STYLE = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    carto: {
      type: 'raster',
      tiles: BASEMAPS[DEFAULT_BASEMAP].tiles,
      tileSize: 256,
      attribution: '© OpenStreetMap, © CARTO, © Esri · demo Havenbedrijf Rotterdam'
    }
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': BASEMAPS[DEFAULT_BASEMAP].bg } },
    { id: 'carto', type: 'raster', source: 'carto', paint: BASEMAPS[DEFAULT_BASEMAP].paint }
  ]
}

const ROTTERDAM_BOUNDS = [
  [3.78, 51.85],
  [4.52, 52.02]
]

// Teken een scheepssilhouet van bovenaf (boeg wijst naar het noorden) als
// SDF-template, zodat het via icon-color per type ingekleurd kan worden.
function makeVesselImage() {
  const s = 128
  const c = document.createElement('canvas')
  c.width = c.height = s
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, s, s)
  ctx.fillStyle = '#fff'
  const cx = s / 2
  // langwerpige romp: spitse boeg boven, ronde achtersteven onder
  ctx.beginPath()
  ctx.moveTo(cx, 8) // boegpunt
  ctx.quadraticCurveTo(cx + 30, 32, cx + 28, 62) // stuurboord boeg
  ctx.lineTo(cx + 28, 94) // stuurboord zijde
  ctx.quadraticCurveTo(cx + 26, 116, cx, 118) // stuurboord achtersteven -> midden
  ctx.quadraticCurveTo(cx - 26, 116, cx - 28, 94) // bakboord achtersteven
  ctx.lineTo(cx - 28, 62) // bakboord zijde
  ctx.quadraticCurveTo(cx - 30, 32, cx, 8) // bakboord boeg -> boeg
  ctx.closePath()
  ctx.fill()
  // subtiele inkeping bij de achtersteven voor een vleugje detail
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.moveTo(cx, 104)
  ctx.lineTo(cx + 10, 116)
  ctx.lineTo(cx - 10, 116)
  ctx.closePath()
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
  return { width: s, height: s, data: ctx.getImageData(0, 0, s, s).data }
}

function shipsToGeoJSON(ships, filter) {
  return {
    type: 'FeatureCollection',
    features: ships
      .filter((s) => !filter || filter[s.type])
      .map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: s.position },
        properties: {
          mmsi: s.mmsi,
          name: s.name,
          color: s.color,
          heading: s.heading || 0,
          moving: s.speed > 0.5 ? 1 : 0,
          size: Math.max(0.55, Math.min(1.4, s.length / 300))
        }
      }))
  }
}

function trailsToGeoJSON(ships, filter) {
  return {
    type: 'FeatureCollection',
    features: ships
      .filter((s) => (!filter || filter[s.type]) && s.trail && s.trail.length > 1)
      .map((s) => ({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: s.trail },
        properties: { color: s.color }
      }))
  }
}

export default function MapView({ ships, selectedMmsi, onSelect, showHeatmap, showTrails, typeFilter, basemap = DEFAULT_BASEMAP }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const readyRef = useRef(false)
  const popupRef = useRef(null)

  // init kaart één keer
  useEffect(() => {
    // bescherm tegen dubbele initialisatie (bv. hot-reload)
    if (mapRef.current) return

    const mobile = window.innerWidth < 820
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      bounds: ROTTERDAM_BOUNDS,
      fitBoundsOptions: {
        padding: mobile
          ? { top: 70, bottom: 90, left: 16, right: 16 }
          : { top: 90, bottom: 60, left: 290, right: 370 }
      },
      attributionControl: false,
      maxZoom: 15,
      minZoom: 9
    })
    mapRef.current = map
    map.addControl(new maplibregl.AttributionControl({ compact: true }))

    map.on('error', (e) => console.error('MapLibre error:', e?.error?.message || e))
    popupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 16 })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    map.on('load', () => {
      map.addImage('vessel', makeVesselImage(), { sdf: true })

      map.addSource('trails', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addSource('ships', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })

      // sporen (trails)
      map.addLayer({
        id: 'trails',
        type: 'line',
        source: 'trails',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.35,
          'line-blur': 1
        }
      })

      // heatmap van scheepsdichtheid
      map.addLayer({
        id: 'heat',
        type: 'heatmap',
        source: 'ships',
        layout: { visibility: 'none' },
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': 1.2,
          'heatmap-radius': 34,
          'heatmap-opacity': 0.75,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.2, 'rgba(34,211,238,0.35)',
            0.45, 'rgba(56,189,248,0.6)',
            0.7, 'rgba(251,191,36,0.8)',
            1, 'rgba(248,113,113,0.95)'
          ]
        }
      })

      // selectie-halo achter het gekozen schip
      map.addLayer({
        id: 'ship-halo',
        type: 'circle',
        source: 'ships',
        filter: ['==', ['get', 'mmsi'], -1],
        paint: {
          'circle-radius': 18,
          'circle-color': 'rgba(56,189,248,0.18)',
          'circle-stroke-color': '#38bdf8',
          'circle-stroke-width': 2
        }
      })

      // de schepen zelf (gekleurde pijl op koers)
      map.addLayer({
        id: 'ships',
        type: 'symbol',
        source: 'ships',
        layout: {
          'icon-image': 'vessel',
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
          'icon-size': ['*', ['get', 'size'], 0.24]
        },
        paint: {
          'icon-color': ['get', 'color'],
          'icon-halo-color': 'rgba(3, 8, 16, 0.85)',
          'icon-halo-width': 1.8,
          'icon-opacity': ['case', ['==', ['get', 'moving'], 1], 1, 0.82]
        }
      })

      readyRef.current = true
      pushData()

      // interactie
      map.on('click', 'ships', (e) => {
        if (e.features?.length) onSelect(e.features[0].properties.mmsi)
      })
      map.on('mouseenter', 'ships', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const f = e.features[0]
        popupRef.current
          .setLngLat(f.geometry.coordinates)
          .setHTML(`<strong>${f.properties.name}</strong>`)
          .addTo(map)
      })
      map.on('mouseleave', 'ships', () => {
        map.getCanvas().style.cursor = ''
        popupRef.current.remove()
      })
    })

    function pushData() {
      if (!readyRef.current) return
      map.getSource('ships')?.setData(shipsToGeoJSON(shipsRef.current, filterRef.current))
      map.getSource('trails')?.setData(trailsToGeoJSON(shipsRef.current, filterRef.current))
    }
    map._pushData = pushData

    return () => {
      map.remove()
      mapRef.current = null
      readyRef.current = false
    }
  }, [])

  // houd laatste props bij in refs zodat de eenmalige init ze kan lezen
  const shipsRef = useRef(ships)
  const filterRef = useRef(typeFilter)
  shipsRef.current = ships
  filterRef.current = typeFilter

  // data bijwerken bij elke tick / filterwijziging
  useEffect(() => {
    if (mapRef.current?._pushData) mapRef.current._pushData()
  }, [ships, typeFilter])

  // selectie-halo bijwerken
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    if (map.getLayer('ship-halo')) {
      map.setFilter('ship-halo', ['==', ['get', 'mmsi'], selectedMmsi ?? -1])
    }
    if (selectedMmsi != null) {
      const s = ships.find((x) => x.mmsi === selectedMmsi)
      if (s) {
        // op mobiel het schip omhoog pannen zodat het boven de bottom-sheet blijft
        const offset = window.innerWidth < 820 ? [0, -window.innerHeight * 0.2] : [0, 0]
        map.easeTo({ center: s.position, zoom: Math.max(map.getZoom(), 12), offset, duration: 800 })
      }
    }
  }, [selectedMmsi])

  // heatmap toggle
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current || !map.getLayer('heat')) return
    map.setLayoutProperty('heat', 'visibility', showHeatmap ? 'visible' : 'none')
    map.setLayoutProperty('ships', 'visibility', showHeatmap ? 'none' : 'visible')
  }, [showHeatmap])

  // trails toggle
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current || !map.getLayer('trails')) return
    map.setLayoutProperty('trails', 'visibility', showTrails ? 'visible' : 'none')
  }, [showTrails])

  // basemap wisselen (Kleur / Satelliet / Donker)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    const cfg = BASEMAPS[basemap] || BASEMAPS[DEFAULT_BASEMAP]
    const src = map.getSource('carto')
    if (src && src.setTiles) src.setTiles(cfg.tiles)
    map.setPaintProperty('bg', 'background-color', cfg.bg)
    for (const [prop, val] of Object.entries(cfg.paint)) {
      map.setPaintProperty('carto', prop, val)
    }
  }, [basemap])

  return <div id="map" ref={containerRef} />
}
