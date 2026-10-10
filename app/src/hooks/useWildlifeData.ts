/**
 * useWildlifeData — loads and prepares the jaguar GPS dataset.
 *
 * Parses ``public/data/jaguar_movement_data.csv`` with Papa Parse, keeps only
 * rows with valid coordinates, and derives per-animal movement trails for the
 * map. Marker/trail counts are thinned for performance on the ~135k-row
 * dataset, matching the approach already used in the project.
 */

import { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'

export interface Observation {
  eventId: string
  timestamp: string
  tagId: string
  lat: number
  lng: number
}

export interface WildlifeTrail {
  tagId: string
  positions: [number, number][]
}

export interface WildlifeData {
  observations: Observation[]
  /** Thinned subset suitable for rendering. */
  displayObservations: Observation[]
  trails: WildlifeTrail[]
  totalCount: number
  loading: boolean
  error: string | null
}

const DATA_URL = `${import.meta.env.BASE_URL}data/jaguar_movement_data.csv`
const MAX_MARKERS = 2500
const TRAIL_STEP = 10

function parseObservations(
  result: Papa.ParseResult<Record<string, string>>,
): Observation[] {
  const observations: Observation[] = []

  for (const row of result.data) {
    const latRaw = row['location.lat']?.trim()
    const lngRaw = row['location.long']?.trim()
    if (!latRaw || !lngRaw) continue

    const lat = Number(latRaw)
    const lng = Number(lngRaw)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue

    const eventId = row['Event_ID']?.trim()
    const timestamp = row['timestamp']?.trim()
    const tagId = row['tag.local.identifier']?.trim()
    if (!eventId || !timestamp || !tagId) continue

    observations.push({ eventId, timestamp, tagId, lat, lng })
  }

  observations.sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
  return observations
}

export function useWildlifeData(): WildlifeData {
  const [observations, setObservations] = useState<Observation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Papa.parse<Record<string, string>>(DATA_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (cancelled) return
        try {
          if (result.errors.length > 0 && result.data.length === 0) {
            setError(result.errors[0]?.message ?? 'Failed to parse GPS dataset')
          } else {
            setObservations(parseObservations(result))
          }
        } catch (parseError) {
          setError(
            parseError instanceof Error ? parseError.message : 'Failed to parse GPS dataset',
          )
        } finally {
          setLoading(false)
        }
      },
      error: () => {
        if (cancelled) return
        setError('Failed to load GPS dataset')
        setLoading(false)
      },
    })

    return () => {
      cancelled = true
    }
  }, [])

  const displayObservations = useMemo(() => {
    if (observations.length <= MAX_MARKERS) return observations
    const step = Math.ceil(observations.length / MAX_MARKERS)
    return observations.filter((_, index) => index % step === 0)
  }, [observations])

  const trails = useMemo(() => {
    const byTag = new Map<string, Observation[]>()
    for (const obs of observations) {
      const group = byTag.get(obs.tagId)
      if (group) group.push(obs)
      else byTag.set(obs.tagId, [obs])
    }

    const result: WildlifeTrail[] = []
    for (const [tagId, group] of byTag) {
      const positions: [number, number][] = []
      for (let i = 0; i < group.length; i += TRAIL_STEP) {
        positions.push([group[i].lat, group[i].lng])
      }
      if (positions.length >= 2) result.push({ tagId, positions })
    }
    return result
  }, [observations])

  return {
    observations,
    displayObservations,
    trails,
    totalCount: observations.length,
    loading,
    error,
  }
}
