/**
 * useCandidateRoads — loads the candidate road network and its summary list.
 *
 * Prefers the backend (``/candidate-roads`` + ``/candidates``). If the API is
 * not configured, or the backend cannot be reached over the network, it falls
 * back to a deterministic demonstration set derived from the real local road
 * network, and reports that clearly via ``source``.
 */

import { useCallback, useEffect, useState } from 'react'
import type { FeatureCollection } from 'geojson'
import {
  ApiError,
  getCandidateRoads,
  getCandidates,
  isApiConfigured,
  type CandidateRoadSummary,
} from '../api/simulation'
import { normalizeCandidateRoads, type CandidateRoad } from '../lib/geo'
import { buildDemoCandidates } from '../lib/demoData'

export type DataSource = 'backend' | 'demo'

export interface CandidateRoadsState {
  roads: CandidateRoad[]
  summaries: CandidateRoadSummary[]
  source: DataSource
  demoReason: string | null
  loading: boolean
  error: string | null
  reload: () => void
}

export function useCandidateRoads(
  baseRoads: FeatureCollection | null,
  baseLoading: boolean,
): CandidateRoadsState {
  const [roads, setRoads] = useState<CandidateRoad[]>([])
  const [summaries, setSummaries] = useState<CandidateRoadSummary[]>([])
  const [source, setSource] = useState<DataSource>('demo')
  const [demoReason, setDemoReason] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => setReloadToken((value) => value + 1), [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const applyDemo = (reason: string) => {
      const demo = buildDemoCandidates(baseRoads)
      setRoads(demo.roads)
      setSummaries(demo.summaries)
      setSource('demo')
      setDemoReason(reason)
      setLoading(false)
    }

    const load = async () => {
      if (!isApiConfigured()) {
        if (baseLoading) return
        applyDemo('Backend not configured (VITE_API_BASE_URL is unset).')
        return
      }

      try {
        const [geoJson, candidateSummaries] = await Promise.all([
          getCandidateRoads(),
          getCandidates(),
        ])
        if (cancelled) return
        setRoads(normalizeCandidateRoads(geoJson))
        setSummaries(candidateSummaries)
        setSource('backend')
        setDemoReason(null)
        setLoading(false)
      } catch (loadError) {
        if (cancelled) return
        const isNetwork =
          loadError instanceof ApiError && loadError.isNetworkError
        if (isNetwork) {
          if (baseLoading) return
          applyDemo('Backend unreachable — showing demonstration candidates.')
        } else {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load candidate roads',
          )
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [baseRoads, baseLoading, reloadToken])

  return { roads, summaries, source, demoReason, loading, error, reload }
}
