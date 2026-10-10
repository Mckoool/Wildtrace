/**
 * geo.ts — Geospatial helpers shared by the map and the simulation overlay.
 * ===========================================================================
 * - ``utmToLatLng``: inverse UTM (transverse Mercator) projection so the
 *   intervention point returned by the backend can be drawn on a WGS84 map.
 * - ``toLatLng``: resolves a ``StructurePoint`` tagged with its EPSG code.
 * - ``normalizeCandidateRoads``: turns the backend GeoJSON into typed records.
 */

import type { Feature, FeatureCollection, LineString, MultiLineString } from 'geojson'
import type { CandidateRoadSummary, StructurePoint } from '../api/simulation'

export interface LatLng {
  lat: number
  lng: number
}

/** A candidate road ready for rendering / selection. */
export interface CandidateRoad {
  roadId: number
  highway: string
  movementSegments: number
  /** Outer ring(s) of the line geometry in WGS84 ``[lat, lng]`` order. */
  paths: [number, number][][]
}

const WGS84_A = 6378137.0
const WGS84_ECC_SQ = 0.00669438
const UTM_K0 = 0.9996

/**
 * Inverse UTM projection (Snyder), accurate to sub-metre at these scales.
 * Southern-hemisphere northing already includes the 10,000,000 m offset
 * (as produced by pyproj for EPSG:327xx), which this function removes.
 */
export function utmToLatLng(
  easting: number,
  northing: number,
  zone: number,
  northernHemisphere: boolean,
): LatLng {
  const x = easting - 500000
  const y = northernHemisphere ? northing : northing - 10000000

  const eccPrimeSq = WGS84_ECC_SQ / (1 - WGS84_ECC_SQ)
  const e1 = (1 - Math.sqrt(1 - WGS84_ECC_SQ)) / (1 + Math.sqrt(1 - WGS84_ECC_SQ))
  const longOrigin = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180)

  const m = y / UTM_K0
  const mu =
    m /
    (WGS84_A *
      (1 - WGS84_ECC_SQ / 4 - (3 * WGS84_ECC_SQ ** 2) / 64 - (5 * WGS84_ECC_SQ ** 3) / 256))

  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu)

  const sinPhi1 = Math.sin(phi1)
  const cosPhi1 = Math.cos(phi1)
  const tanPhi1 = Math.tan(phi1)

  const n1 = WGS84_A / Math.sqrt(1 - WGS84_ECC_SQ * sinPhi1 ** 2)
  const t1 = tanPhi1 ** 2
  const c1 = eccPrimeSq * cosPhi1 ** 2
  const r1 =
    (WGS84_A * (1 - WGS84_ECC_SQ)) / (1 - WGS84_ECC_SQ * sinPhi1 ** 2) ** 1.5
  const d = x / (n1 * UTM_K0)

  const latRad =
    phi1 -
    ((n1 * tanPhi1) / r1) *
      (d ** 2 / 2 -
        ((5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * eccPrimeSq) * d ** 4) / 24 +
        ((61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * eccPrimeSq - 3 * c1 ** 2) *
          d ** 6) /
          720)

  const lngRad =
    (d -
      ((1 + 2 * t1 + c1) * d ** 3) / 6 +
      ((5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * eccPrimeSq + 24 * t1 ** 2) * d ** 5) /
        120) /
    cosPhi1

  return {
    lat: (latRad * 180) / Math.PI,
    lng: longOrigin * (180 / Math.PI) + (lngRad * 180) / Math.PI,
  }
}

/** Resolve a backend structure point to WGS84 using its ``epsg`` tag. */
export function structurePointToLatLng(point: StructurePoint): LatLng | null {
  const { lat, lng, epsg } = point
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  if (epsg === undefined || epsg === 4326) {
    // Already WGS84 (as in demonstration mode).
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
    return { lat, lng }
  }

  // UTM zones for Paraguay's Humid Chaco live in the 21S/22S band.
  if (epsg >= 32601 && epsg <= 32660) {
    return utmToLatLng(lng, lat, epsg - 32600, true)
  }
  if (epsg >= 32701 && epsg <= 32760) {
    return utmToLatLng(lng, lat, epsg - 32700, false)
  }

  return null
}

function lineToPaths(
  geometry: LineString | MultiLineString,
): [number, number][][] {
  const toLatLng = (position: number[]): [number, number] | null => {
    const lng = Number(position[0])
    const lat = Number(position[1])
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return [lat, lng]
  }

  if (geometry.type === 'LineString') {
    const line = geometry.coordinates
      .map(toLatLng)
      .filter((p): p is [number, number] => p !== null)
    return line.length >= 2 ? [line] : []
  }

  return geometry.coordinates
    .map((ring) => ring.map(toLatLng).filter((p): p is [number, number] => p !== null))
    .filter((ring) => ring.length >= 2)
}

/**
 * Normalise the backend candidate-roads GeoJSON into typed records. The
 * engine writes the road id under ``road_id``; the highway class appears as
 * ``highway`` (or ``highway_y`` after a column merge), and the observed
 * crossing count as ``movement_segments``.
 */
export function normalizeCandidateRoads(
  collection: FeatureCollection | null,
): CandidateRoad[] {
  if (!collection || !Array.isArray(collection.features)) return []

  const roads: CandidateRoad[] = []
  for (const feature of collection.features as Feature[]) {
    const geometry = feature.geometry
    if (!geometry) continue
    if (geometry.type !== 'LineString' && geometry.type !== 'MultiLineString') continue

    const properties = (feature.properties ?? {}) as Record<string, unknown>
    const roadId = Number(properties.road_id ?? feature.id)
    if (!Number.isFinite(roadId)) continue

    const highway =
      (typeof properties.highway === 'string' && properties.highway) ||
      (typeof properties.highway_y === 'string' && properties.highway_y) ||
      (typeof properties.highway_x === 'string' && properties.highway_x) ||
      'unknown'

    const paths = lineToPaths(geometry)
    if (paths.length === 0) continue

    roads.push({
      roadId,
      highway,
      movementSegments: Number(properties.movement_segments) || 0,
      paths,
    })
  }
  return roads
}

/** Convenience: midpoint of a candidate road (for demo siting / tooltips). */
export function roadMidpoint(road: CandidateRoad): LatLng | null {
  const path = road.paths[0]
  if (!path || path.length === 0) return null
  const [lat, lng] = path[Math.floor(path.length / 2)]
  return { lat, lng }
}

/** Summaries keyed by road id, for quick metadata lookups. */
export function indexSummaries(
  summaries: CandidateRoadSummary[],
): Map<number, CandidateRoadSummary> {
  const map = new Map<number, CandidateRoadSummary>()
  for (const summary of summaries) map.set(summary.road_id, summary)
  return map
}
