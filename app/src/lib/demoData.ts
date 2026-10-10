/**
 * demoData.ts — Deterministic demonstration data.
 * ===========================================================================
 *
 * Used ONLY when the backend is not configured or unreachable. It lets the
 * dashboard be explored end-to-end without pretending to be real field
 * output: every value produced here is clearly flagged as demonstration data
 * in the UI (``ScenarioStatus`` / ``SimulationResults``).
 *
 * Candidate roads are derived from the project's real OpenStreetMap road
 * file (``public/data/roads.geojson``) so the map still shows genuine
 * geography; the simulated metrics are synthetic.
 */

import type { FeatureCollection } from 'geojson'
import type {
  CandidateRoadSummary,
  InterventionInput,
  SimulationResponse,
} from '../api/simulation'
import type { CandidateRoad } from './geo'
import { normalizeCandidateRoads, roadMidpoint } from './geo'

/** Stable non-cryptographic hash (FNV-1a) for deterministic pseudo-values. */
function hashNumber(seed: number): number {
  let h = 2166136261 >>> 0
  const text = String(seed)
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Maps a road id to a stable pseudo-crossing count in the 2..60 range. */
function pseudoSegments(roadId: number): number {
  return 2 + (hashNumber(roadId) % 59)
}

const DEMO_ROAD_SAMPLE_STEP = 240

/**
 * Build a deterministic candidate-road set from the real road network.
 * ``road_id`` follows the backend convention of "index within the road
 * feature list", which keeps ids comparable between demo and backend modes.
 */
export function buildDemoCandidates(baseRoads: FeatureCollection | null): {
  roads: CandidateRoad[]
  summaries: CandidateRoadSummary[]
} {
  if (!baseRoads || !Array.isArray(baseRoads.features)) {
    return { roads: [], summaries: [] }
  }

  const sampled: FeatureCollection = {
    type: 'FeatureCollection',
    features: baseRoads.features
      .map((feature, index) => ({ feature, index }))
      .filter(({ index }) => index % DEMO_ROAD_SAMPLE_STEP === 0)
      .slice(0, 48)
      .map(({ feature, index }) => ({
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          road_id: index,
          highway:
            (feature.properties as Record<string, unknown> | null)?.highway ??
            'unknown',
          movement_segments: pseudoSegments(index),
        },
      })),
  }

  const roads = normalizeCandidateRoads(sampled)
  const summaries: CandidateRoadSummary[] = roads.map((road) => ({
    road_id: road.roadId,
    highway: road.highway,
    movement_segments: road.movementSegments,
  }))

  return { roads, summaries }
}

/**
 * Deterministic demonstration simulation. Mirrors the *shape* of the real
 * ``/simulate`` response so the results UI renders identically; the numbers
 * are synthetic and the ``model_status`` marks them clearly.
 */
export function buildDemoSimulation(
  input: InterventionInput,
  roads: CandidateRoad[],
): SimulationResponse {
  const road = roads.find((r) => r.roadId === input.road_id) ?? null
  const crossingSegments = road
    ? Math.max(road.movementSegments, 4)
    : pseudoSegments(input.road_id)
  const crossingEvents = Math.round(crossingSegments * 1.6)
  const observationsNearRoad = crossingSegments * 7

  const point = road ? roadMidpoint(road) : null
  const structurePoint = point
    ? { lat: point.lat, lng: point.lng, epsg: 4326 }
    : { lat: -23.3, lng: -58.03, epsg: 4326 }

  const baseline = {
    observations_near_road: observationsNearRoad,
    crossing_segments: crossingSegments,
    crossing_events: crossingEvents,
    exposure_index: crossingSegments,
    source: 'Demonstration data (no backend connection)',
  }

  if (input.intervention === 'green_corridor') {
    return {
      intervention: input.intervention,
      road_id: input.road_id,
      radius_m: input.radius_m,
      model_status: 'not_modelled_habitat_data_missing',
      baseline,
      scenario: {
        observations_near_road: observationsNearRoad,
        structure_type: 'green_corridor',
        model_status: 'not_modelled',
        reason:
          'Demonstration mode: no habitat dataset is bundled, so a corridor effect cannot be modelled.',
        structure_point: structurePoint,
        hypothetical_exposure_index: null,
        hypothetical_index_change: null,
      },
      limitations: [
        'Demonstration data — not derived from the project backend.',
        'No habitat/land-cover dataset is available, so corridor effects are not modelled.',
      ],
    }
  }

  if (input.intervention === 'road_reroute') {
    const eliminated = Math.round(crossingSegments * 0.75)
    const residual = crossingSegments - eliminated
    return {
      intervention: input.intervention,
      road_id: input.road_id,
      radius_m: input.radius_m,
      model_status: 'demonstration_data',
      baseline,
      scenario: {
        observations_near_road: observationsNearRoad,
        structure_type: 'reroute',
        method:
          'Demonstration model: a fixed share of observed crossings is treated as removed by the reroute.',
        structure_point: structurePoint,
        crossing_segments_eliminated: eliminated,
        residual_crossing_segments: residual,
        hypothetical_exposure_index: residual,
        hypothetical_index_change: residual - crossingSegments,
      },
      limitations: [
        'Demonstration data — not derived from the project backend.',
        'The eliminated-crossing share is illustrative and not an ecological outcome.',
      ],
    }
  }

  // overpass / underpass
  const served = Math.round(crossingSegments * 0.68)
  const residual = crossingSegments - served
  return {
    intervention: input.intervention,
    road_id: input.road_id,
    radius_m: input.radius_m,
    model_status: 'demonstration_data',
    baseline,
    scenario: {
      observations_near_road: observationsNearRoad,
      structure_type: input.intervention,
      method:
        'Demonstration model: a fixed share of observed crossings is treated as relocated to the structure.',
      structure_point: structurePoint,
      served_crossing_segments: served,
      served_crossing_share: crossingSegments > 0 ? Number((served / crossingSegments).toFixed(4)) : 0,
      residual_at_grade_crossing_segments: residual,
      hypothetical_exposure_index: residual,
      hypothetical_index_change: residual - crossingSegments,
    },
    limitations: [
      'Demonstration data — not derived from the project backend.',
      'The served-crossing share is illustrative and not an ecological outcome.',
    ],
  }
}
