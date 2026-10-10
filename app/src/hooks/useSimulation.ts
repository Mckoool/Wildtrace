/**
 * useSimulation — owns the simulation request lifecycle.
 *
 * Sends the scenario to ``POST /simulate`` when the backend is available.
 * Falls back to a clearly-labelled deterministic demonstration result when the
 * API is unconfigured or unreachable. HTTP errors from a reachable backend are
 * surfaced as errors (never silently replaced with demo data).
 */

import { useCallback, useState } from 'react'
import {
  ApiError,
  isApiConfigured,
  runSimulation,
  type InterventionInput,
  type SimulationResponse,
} from '../api/simulation'
import { buildDemoSimulation } from '../lib/demoData'
import type { CandidateRoad } from '../lib/geo'

export type SimulationStatus = 'idle' | 'loading' | 'success' | 'error'

export interface SimulationState {
  status: SimulationStatus
  result: SimulationResponse | null
  error: string | null
  /** True when the shown result is demonstration data. */
  isDemo: boolean
  demoReason: string | null
  run: (input: InterventionInput) => Promise<void>
  reset: () => void
}

export function useSimulation(demoRoads: CandidateRoad[]): SimulationState {
  const [status, setStatus] = useState<SimulationStatus>('idle')
  const [result, setResult] = useState<SimulationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [demoReason, setDemoReason] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
    setIsDemo(false)
    setDemoReason(null)
  }, [])

  const run = useCallback(
    async (input: InterventionInput) => {
      setStatus('loading')
      setError(null)

      const demo = (reason: string) => {
        setResult(buildDemoSimulation(input, demoRoads))
        setIsDemo(true)
        setDemoReason(reason)
        setStatus('success')
      }

      if (!isApiConfigured()) {
        demo('Backend not configured — result is demonstration data.')
        return
      }

      try {
        const response = await runSimulation(input)
        setResult(response)
        setIsDemo(false)
        setDemoReason(null)
        setStatus('success')
      } catch (runError) {
        if (runError instanceof ApiError && runError.isNetworkError) {
          demo('Backend unreachable — result is demonstration data.')
          return
        }
        setResult(null)
        setIsDemo(false)
        setError(
          runError instanceof Error ? runError.message : 'Simulation failed',
        )
        setStatus('error')
      }
    },
    [demoRoads],
  )

  return { status, result, error, isDemo, demoReason, run, reset }
}
