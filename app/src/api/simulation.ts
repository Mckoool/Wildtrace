/**
 * simulation.ts — Typed client for the CorridorG / WildTrace simulation API.
 * ===========================================================================
 *
 * The Python backend (``simulation/api.py``) exposes:
 *
 *   GET  /health            -> { status, service }
 *   GET  /candidates        -> { count, candidates: CandidateRoadSummary[] }
 *   GET  /candidate-roads   -> GeoJSON FeatureCollection of candidate roads
 *   POST /simulate          -> SimulationResponse
 *
 * The request body accepted by ``/simulate`` is exactly:
 *
 *   { "intervention": string, "road_id": number, "radius_m": number }
 *
 * Only ``overpass``, ``underpass``, ``road_reroute`` and ``green_corridor``
 * are accepted by the engine; other intervention types are surfaced in the
 * UI but are NOT sent to the backend (see ``SUPPORTED_INTERVENTIONS``).
 *
 * No endpoint URLs or response fields are invented here: everything below
 * mirrors ``api.py``. The base URL is configurable through the Vite env var
 * ``VITE_API_BASE_URL``.
 */

import type { FeatureCollection } from 'geojson'

/** Every intervention the UI can offer, including ones the engine does not model. */
export type InterventionType =
  | 'overpass'
  | 'underpass'
  | 'road_reroute'
  | 'green_corridor'
  | 'signage'
  | 'night_lighting'

/** Interventions the backend ``/simulate`` endpoint actually accepts. */
export const SUPPORTED_INTERVENTIONS = [
  'overpass',
  'underpass',
  'road_reroute',
  'green_corridor',
] as const

export type SupportedIntervention = (typeof SUPPORTED_INTERVENTIONS)[number]

export const INTERVENTION_LABELS: Record<InterventionType, string> = {
  overpass: 'Wildlife Overpass',
  underpass: 'Wildlife Underpass',
  road_reroute: 'Road Rerouting',
  green_corridor: 'Green Corridor',
  signage: 'Wildlife Crossing Signage',
  night_lighting: 'Reduced Night Lighting',
}

export function isSupportedIntervention(
  value: InterventionType,
): value is SupportedIntervention {
  return (SUPPORTED_INTERVENTIONS as readonly string[]).includes(value)
}

/** One row of ``GET /candidates`` (``candidate_road_summary.csv``). */
export interface CandidateRoadSummary {
  road_id: number
  highway: string
  movement_segments: number
}

/** Request body for ``POST /simulate``. */
export interface InterventionInput {
  intervention: SupportedIntervention
  road_id: number
  radius_m: number
}

/**
 * Structure point returned by the engine. Note: the backend serialises a
 * projected (UTM) coordinate here and tags it with ``epsg``. The frontend
 * converts it using ``epsg`` before plotting (see ``lib/geo.ts``).
 */
export interface StructurePoint {
  lat: number
  lng: number
  epsg?: number
}

export interface BaselineMetrics {
  observations_near_road: number
  crossing_segments: number
  crossing_events: number
  exposure_index: number
  source?: string
}

export interface ScenarioMetrics {
  observations_near_road?: number
  structure_type?: string
  method?: string
  structure_point?: StructurePoint
  /** overpass / underpass */
  served_crossing_segments?: number
  served_crossing_share?: number
  residual_at_grade_crossing_segments?: number
  /** road_reroute */
  crossing_segments_eliminated?: number
  residual_crossing_segments?: number
  /** green_corridor (or any non-modelled intervention) */
  model_status?: string
  reason?: string
  hypothetical_exposure_index: number | null
  hypothetical_index_change: number | null
}

export interface SimulationResponse {
  intervention: InterventionType
  road_id: number
  radius_m: number
  model_status: string
  baseline: BaselineMetrics
  scenario: ScenarioMetrics
  limitations: string[]
}

export interface HealthResponse {
  status: string
  service: string
}

/** Error carrying the HTTP status (``status === 0`` means a network failure). */
export class ApiError extends Error {
  readonly status: number
  readonly isNetworkError: boolean

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.isNetworkError = status === 0
  }
}

const REQUEST_TIMEOUT_MS = 20000

/** Base URL from Vite env, or an empty string when unconfigured. */
export const API_BASE_URL: string = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
).replace(/\/+$/, '')

/** True when ``VITE_API_BASE_URL`` was provided at build time. */
export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0
}

async function fetchJson<T>(
  path: string,
  init?: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<T> {
  if (!isApiConfigured()) {
    throw new ApiError(
      'VITE_API_BASE_URL is not configured; the backend is unavailable.',
    )
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    })

    const text = await response.text()
    let body: unknown
    if (text.length > 0) {
      try {
        body = JSON.parse(text)
      } catch {
        body = text
      }
    }

    if (!response.ok) {
      const detail =
        body && typeof body === 'object' && 'detail' in body
          ? (body as { detail?: unknown }).detail
          : undefined
      const message =
        typeof detail === 'string'
          ? detail
          : `Request to ${path} failed (HTTP ${response.status})`
      throw new ApiError(message, response.status)
    }

    return body as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(`Request to ${path} timed out`, 0)
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0,
    )
  } finally {
    clearTimeout(timer)
  }
}

export async function getHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>('/health', undefined, 5000)
}

export async function getCandidateRoads(): Promise<FeatureCollection> {
  const data = await fetchJson<FeatureCollection>('/candidate-roads')
  if (!data || !Array.isArray(data.features)) {
    throw new ApiError('Candidate-roads response is not a GeoJSON collection')
  }
  return data
}

interface RawCandidatesResponse {
  count?: number
  candidates?: unknown
}

export async function getCandidates(): Promise<CandidateRoadSummary[]> {
  const data = await fetchJson<RawCandidatesResponse | CandidateRoadSummary[]>(
    '/candidates',
  )
  const rows = Array.isArray(data) ? data : data.candidates
  if (!Array.isArray(rows)) {
    throw new ApiError('Candidates response did not contain a candidates list')
  }

  const summaries: CandidateRoadSummary[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const record = row as Record<string, unknown>
    const roadId = Number(record.road_id)
    if (!Number.isFinite(roadId)) continue
    summaries.push({
      road_id: roadId,
      highway: typeof record.highway === 'string' ? record.highway : 'unknown',
      movement_segments: Number(record.movement_segments) || 0,
    })
  }
  return summaries
}

/** Minimum runtime validation so the UI can trust the shape it renders. */
function isSimulationResponse(value: unknown): value is SimulationResponse {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.intervention === 'string' &&
    typeof record.road_id === 'number' &&
    typeof record.baseline === 'object' &&
    record.baseline !== null &&
    typeof record.scenario === 'object' &&
    record.scenario !== null
  )
}

export async function runSimulation(
  input: InterventionInput,
): Promise<SimulationResponse> {
  const data = await fetchJson<unknown>('/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!isSimulationResponse(data)) {
    throw new ApiError('Unexpected simulation response format from the backend')
  }
  return data
}
