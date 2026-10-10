/**
 * backendtest.tsx — Small development probe for the simulation backend.
 *
 * Kept as a lightweight manual check you can call from the console while
 * developing against the FastAPI service. It is not part of the runtime UI;
 * the dashboard talks to the same helpers through the data hooks.
 */

import {
  ApiError,
  getCandidates,
  getHealth,
  isApiConfigured,
  runSimulation,
  type InterventionInput,
} from './api/simulation'

export interface BackendProbeResult {
  reachable: boolean
  service?: string
  candidateCount?: number
  error?: string
}

export async function probeBackend(): Promise<BackendProbeResult> {
  if (!isApiConfigured()) {
    return { reachable: false, error: 'VITE_API_BASE_URL is not configured' }
  }
  try {
    const [health, candidates] = await Promise.all([getHealth(), getCandidates()])
    return {
      reachable: health.status === 'ok',
      service: health.service,
      candidateCount: candidates.length,
    }
  } catch (error) {
    return {
      reachable: false,
      error: error instanceof ApiError ? error.message : 'Unknown backend error',
    }
  }
}

/** Convenience wrapper for a one-off simulation while debugging. */
export function probeSimulation(input: InterventionInput) {
  return runSimulation(input)
}
