/**
 * roadIntersections.ts — Reusable road × movement-trail intersection analysis
 * ===========================================================================
 * CorridorG analysis utility.
 *
 * Given animal GPS movement trails (polylines) and a set of road features
 * (GeoJSON LineStrings), this module finds *candidate* locations where a
 * movement trail crosses a road or passes within a configurable distance
 * threshold of one.
 *
 * Design goals
 * ------------
 * - Reusable and decoupled from the React view: it accepts plain data
 *   structures (points / trails / GeoJSON feature collections) and returns
 *   plain candidate records. It never reads files, fetches data, or touches
 *   the map.
 * - Accepts road features as input. If roads.geojson has not been generated
 *   yet, callers simply pass an empty collection — the module returns an
 *   empty result instead of throwing.
 * - The threshold is configurable and expressed in ground metres.
 *
 * Method (distance measure)
 * -------------------------
 * 1. Trails are sequences of GPS fixes (lat/lng). Roads are GeoJSON
 *    LineStrings (coordinates are [longitude, latitude], matching the OSM
 *    output produced by `download_roads.py`).
 * 2. Coordinates are projected to a local Cartesian plane using an
 *    equirectangular approximation around a reference latitude:
 *        x = (lng - refLng) * R * cos(refLat) * (pi / 180)
 *        y = (lat - refLat) * R * (pi / 180)
 *    This makes the distance threshold comparable in metres.
 * 3. For every trail segment and every road segment, the exact closest
 *    approach between the two segments is computed, and the pair is kept as
 *    a candidate when that distance is <= thresholdMeters. The reported
 *    lat/lng is the closest-approach point *on the trail*.
 *
 * Limitations (read before relying on the results)
 * ------------------------------------------------
 * - Equirectangular projection is only an approximation. Distortion grows
 *   with distance from the reference latitude and at high latitudes, so the
 *   threshold is approximate (~cm-to-metre scale at 23°S for this study
 *   area). For exactness, switch to a proper CRS (e.g. a local UTM zone).
 * - Distances are measured to the road *centreline*; road widths and
 *   crossing structures (bridges, underpasses) are not modelled.
 * - A trail that runs *alongside* a road will produce many candidates
 *   (one per within-threshold segment pair). De-duplicate by
 *   grouping/clustering if only distinct crossing sites are needed.
 * - Exact crossings between sampled fixes are not guaranteed to be detected
 *   if the fixes are sparse: the trail is a straight interpolation between
 *   consecutive fixes, so a true road crossing between two far-apart fixes
 *   may be missed (or, conversely, a near-miss can appear to cross).
 * - Time ordering is the caller's responsibility; a "movement trail" is
 *   assumed to already be ordered by timestamp.
 * - Performance is O(trails * trailSegments * roads * roadSegments). For
 *   large datasets, pre-filter roads/trails by bounding box before calling,
 *   or sample trail points.
 */

// ---------------------------------------------------------------------------
// Input / output types
// ---------------------------------------------------------------------------

export interface GeoPoint {
  lat: number
  lng: number
}

/** A single animal's chronological sequence of GPS fixes. */
export interface MovementTrail {
  tagId: string
  /** Consecutive fixes in chronological order; at least 2 are needed to form a segment. */
  points: GeoPoint[]
}

/**
 * Minimal structural shape of a GPS observation as used by the app
 * (`App.tsx`). Used by `buildTrailsFromObservations`.
 */
export interface MovementObservation {
  eventId: string
  timestamp: string
  tagId: string
  lat: number
  lng: number
}

/**
 * Minimum structural shape of a GeoJSON LineString feature, as produced by
 * `download_roads.py` (coordinates are [longitude, latitude]).
 */
export interface RoadFeature {
  geometry?: {
    type?: string
    coordinates?: unknown
  } | null
}

/** Minimum structural shape of a GeoJSON FeatureCollection of roads. */
export interface RoadCollection {
  features?: RoadFeature[] | null
}

/** One candidate road–trail crossing/near-pass. */
export interface RoadIntersectionCandidate {
  /** Trail (animal tag) involved. */
  tagId: string
  /** Shortest distance between the trail segment and road segment, in metres. */
  distanceMeters: number
  /** Approximate closest-approach point on the trail, in WGS84. */
  lat: number
  lng: number
  /** Index of the feature within `roads.features`. */
  roadFeatureIndex: number
  /** Index of the road segment within its LineString (segment i joins points i and i + 1). */
  roadSegmentIndex: number
  /** Index of the trail segment within the trail (segment i joins points i and i + 1). */
  trailSegmentIndex: number
}

export interface FindRoadIntersectionsOptions {
  /** Movement trails to test. */
  trails: MovementTrail[]
  /** Road features (GeoJSON FeatureCollection). May be empty. */
  roads: RoadCollection
  /**
   * Maximum distance in metres between a trail segment and a road segment
   * for a candidate to be reported. A non-positive value keeps only exact
   * crossings (distance 0). Must be a finite number.
   */
  thresholdMeters: number
  /**
   * Optional fixed reference latitude used by the equirectangular
   * projection. Defaults to the mean latitude of all input data.
   */
  referenceLatitude?: number
}

// ---------------------------------------------------------------------------
// Small internal helpers
// ---------------------------------------------------------------------------

interface Pt2 {
  x: number
  y: number
}

const EARTH_RADIUS_M = 6371008.8
const DEG_TO_RAD = Math.PI / 180

/** Multiplication-free clamp. */
function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value))
}

/**
 * Closest point on segment [a, b] to point p (both in projected metres).
 * Returns the squared distance and the closest point on the segment.
 */
function pointSegmentClosest(
  p: Pt2,
  a: Pt2,
  b: Pt2,
): { distSq: number; cx: number; cy: number } {
  const abx = b.x - a.x
  const aby = b.y - a.y
  const apx = p.x - a.x
  const apy = p.y - a.y
  const abLen2 = abx * abx + aby * aby

  if (abLen2 === 0) {
    const dx = p.x - a.x
    const dy = p.y - a.y
    return { distSq: dx * dx + dy * dy, cx: a.x, cy: a.y }
  }

  const t = clamp((apx * abx + apy * aby) / abLen2, 0, 1)
  const cx = a.x + t * abx
  const cy = a.y + t * aby
  const dx = p.x - cx
  const dy = p.y - cy
  return { distSq: dx * dx + dy * dy, cx, cy }
}

/**
 * Exact closest approach between two segments (projected metres).
 * Returns the squared distance and the closest point on segment [a, b]
 * (the trail segment). Clamped parameter minimisation keeps the solution
 * on both segments even when they do not intersect.
 */
function segmentClosestApproach(
  a: Pt2,
  b: Pt2,
  c: Pt2,
  d: Pt2,
): { distSq: number; cx: number; cy: number } {
  const d1x = b.x - a.x
  const d1y = b.y - a.y
  const d2x = d.x - c.x
  const d2y = d.y - c.y
  const rx = a.x - c.x
  const ry = a.y - c.y

  const aLen2 = d1x * d1x + d1y * d1y
  const bDot = d1x * d2x + d1y * d2y
  const cDot = d1x * rx + d1y * ry
  const eLen2 = d2x * d2x + d2y * d2y
  const fDot = d2x * rx + d2y * ry

  // Degenerate segments (zero length): fall back to point–segment distance.
  if (aLen2 === 0) return pointSegmentClosest(a, c, d)
  if (eLen2 === 0) return pointSegmentClosest(c, a, b)

  const denom = aLen2 * eLen2 - bDot * bDot
  let s: number
  let t: number

  if (denom !== 0) {
    s = clamp((bDot * fDot - cDot * eLen2) / denom, 0, 1)
  } else {
    // Parallel/collinear segments: the closest pair is captured by endpoint
    // projection, so fix one parameter and clamp the other.
    s = 0
  }

  t = (bDot * s + fDot) / eLen2
  if (t < 0) {
    t = 0
    s = clamp(-cDot / aLen2, 0, 1)
  } else if (t > 1) {
    t = 1
    s = clamp((bDot - cDot) / aLen2, 0, 1)
  }

  const dx = rx + s * d1x - t * d2x
  const dy = ry + s * d1y - t * d2y
  return { distSq: dx * dx + dy * dy, cx: a.x + s * d1x, cy: a.y + s * d1y }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Group raw GPS observations into per-animal movement trails, ordered by
 * `timestamp`. This mirrors the app's existing trail grouping (same
 * `Date.parse` convention) so results are comparable with the rendered
 * polylines. Observations with missing/invalid coordinates are skipped;
 * trails with fewer than 2 points are dropped.
 */
export function buildTrailsFromObservations(
  observations: MovementObservation[],
): MovementTrail[] {
  if (!Array.isArray(observations)) return []

  const groups = new Map<string, MovementObservation[]>()

  for (const obs of observations) {
    if (!obs) continue
    if (!Number.isFinite(obs.lat) || !Number.isFinite(obs.lng)) continue

    const group = groups.get(obs.tagId) ?? []
    group.push(obs)
    groups.set(obs.tagId, group)
  }

  const trails: MovementTrail[] = []
  for (const [tagId, group] of groups) {
    group.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
    const points = group.map((obs) => ({ lat: obs.lat, lng: obs.lng }))
    if (points.length >= 2) trails.push({ tagId, points })
  }

  return trails
}

/**
 * Find candidate road–movement-trail intersections.
 *
 * Returns an empty array when the trail or road dataset is empty (e.g.
 * when `roads.geojson` has not been generated yet), or when no segment
 * pair is within `thresholdMeters` of each other. Throws only on invalid
 * configuration (non-finite threshold).
 */
export function findRoadIntersections(
  options: FindRoadIntersectionsOptions,
): RoadIntersectionCandidate[] {
  const { trails, roads, thresholdMeters } = options
  const candidates: RoadIntersectionCandidate[] = []

  if (!Number.isFinite(thresholdMeters)) {
    throw new Error(
      'findRoadIntersections: thresholdMeters must be a finite number',
    )
  }
  if (!Array.isArray(trails) || trails.length === 0) return candidates

  // --- Road dataset safety --------------------------------------------
  // roads.geojson may not exist yet; treat missing/empty collections as
  // "no roads" rather than an error.
  if (!Array.isArray(roads?.features) || roads.features.length === 0) {
    return candidates
  }

  // Keep only usable LineString roads; skip anything without geometry or
  // with a different geometry type (e.g. future polygon layers).
  const roadLines: { featureIndex: number; pts: GeoPoint[] }[] = []
  for (const [featureIndex, feature] of roads.features.entries()) {
    const geometry = feature?.geometry
    if (!geometry || geometry.type !== 'LineString') continue
    if (!Array.isArray(geometry.coordinates)) continue

    const pts: GeoPoint[] = []
    for (const coordinate of geometry.coordinates) {
      if (!Array.isArray(coordinate) || coordinate.length < 2) continue
      const lng = Number(coordinate[0])
      const lat = Number(coordinate[1])
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue
      pts.push({ lat, lng })
    }
    if (pts.length >= 2) roadLines.push({ featureIndex, pts })
  }
  if (roadLines.length === 0) return candidates

  // --- Reference latitude for the local equirectangular projection -----
  // Mean of all valid input latitudes (trails and roads). Callers can pin
  // a fixed value (e.g. the study-area centre) for stable results.
  let latSum = 0
  let lngSum = 0
  let coordCount = 0
  for (const trail of trails) {
    if (!trail || !Array.isArray(trail.points)) continue
    for (const point of trail.points) {
      if (point && Number.isFinite(point.lat) && Number.isFinite(point.lng)) {
        latSum += point.lat
        lngSum += point.lng
        coordCount += 1
      }
    }
  }
  for (const roadLine of roadLines) {
    for (const point of roadLine.pts) {
      latSum += point.lat
      lngSum += point.lng
      coordCount += 1
    }
  }
  if (coordCount === 0) return candidates

  const referenceLatitude = options.referenceLatitude ?? latSum / coordCount

  const metersPerDegLat = EARTH_RADIUS_M * DEG_TO_RAD
  const metersPerDegLng = metersPerDegLat * Math.cos(referenceLatitude * DEG_TO_RAD)

  // Reference longitude: mean of all input longitudes (only affects where
  // x = 0 sits; distances are translation-invariant in the plane).
  const refLng = lngSum / coordCount

  const toXY = (lat: number, lng: number): Pt2 => ({
    x: (lng - refLng) * metersPerDegLng,
    y: (lat - referenceLatitude) * metersPerDegLat,
  })
  const toLatLng = (x: number, y: number): { lat: number; lng: number } => ({
    lat: referenceLatitude + y / metersPerDegLat,
    lng: refLng + x / metersPerDegLng,
  })

  // Pre-project roads once (their points never change).
  const projectedRoads = roadLines.map((roadLine) => ({
    featureIndex: roadLine.featureIndex,
    pts: roadLine.pts.map((p) => toXY(p.lat, p.lng)),
  }))

  const thresholdSq = thresholdMeters * thresholdMeters

  // --- Segment-pair search ---------------------------------------------
  for (const trail of trails) {
    if (!trail || !Array.isArray(trail.points)) continue
    const projectedTrail = trail.points.map((p) =>
      Number.isFinite(p?.lat) && Number.isFinite(p?.lng) ? toXY(p.lat, p.lng) : null,
    )
    if (projectedTrail.length < 2) continue

    for (let trailSegmentIndex = 0; trailSegmentIndex < projectedTrail.length - 1; trailSegmentIndex += 1) {
      const a = projectedTrail[trailSegmentIndex]
      const b = projectedTrail[trailSegmentIndex + 1]
      if (a === null || b === null) continue

      for (const roadLine of projectedRoads) {
        for (let roadSegmentIndex = 0; roadSegmentIndex < roadLine.pts.length - 1; roadSegmentIndex += 1) {
          const approach = segmentClosestApproach(
            a,
            b,
            roadLine.pts[roadSegmentIndex],
            roadLine.pts[roadSegmentIndex + 1],
          )

          if (Number.isFinite(approach.distSq) && approach.distSq <= thresholdSq) {
            const { lat, lng } = toLatLng(approach.cx, approach.cy)
            candidates.push({
              tagId: trail.tagId,
              distanceMeters: Math.sqrt(approach.distSq),
              lat,
              lng,
              roadFeatureIndex: roadLine.featureIndex,
              roadSegmentIndex,
              trailSegmentIndex,
            })
          }
        }
      }
    }
  }

  return candidates
}