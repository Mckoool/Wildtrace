/**
 * useRoadData — loads the local OpenStreetMap road network used as the base
 * "Road network" map layer. A missing or invalid file surfaces a non-blocking
 * error rather than crashing the map.
 */

import { useEffect, useState } from 'react'
import type { FeatureCollection } from 'geojson'

const ROADS_URL = `${import.meta.env.BASE_URL}data/roads.geojson`

export interface RoadDataState {
  roads: FeatureCollection | null
  loading: boolean
  error: string | null
}

export function useRoadData(): RoadDataState {
  const [roads, setRoads] = useState<FeatureCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch(ROADS_URL)
        if (!response.ok) {
          throw new Error(`Road network request failed (HTTP ${response.status})`)
        }
        const data = (await response.json()) as FeatureCollection
        if (!data || !Array.isArray(data.features)) {
          throw new Error('Road file is not a valid GeoJSON FeatureCollection')
        }
        if (!cancelled) setRoads(data)
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : 'Failed to load road network',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return { roads, loading, error }
}
