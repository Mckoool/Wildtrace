
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely.geometry import LineString

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "app" / "public" / "data"
CLEAN = ROOT / "simulation" / "humid_chaco_clean.csv"


def main():
    animals = pd.read_csv(CLEAN)
    animals["timestamp"] = pd.to_datetime(
        animals["timestamp"], errors="coerce"
    )

    animals = animals.dropna(
        subset=["timestamp", "longitude", "latitude"]
    )

    animals = animals.sort_values(
        ["individual.local.identifier (ID)", "timestamp"]
    )

    grouped = animals.groupby("individual.local.identifier (ID)")

    animals["gap_hours"] = grouped["timestamp"].diff()
    animals["gap_hours"] = (
        animals["gap_hours"].dt.total_seconds() / 3600
    )

    animals["previous_lon"] = grouped["longitude"].shift()
    animals["previous_lat"] = grouped["latitude"].shift()

    valid = animals[
        animals["gap_hours"].between(0, 24)
        & animals["previous_lon"].notna()
        & animals["previous_lat"].notna()
    ].copy()

    valid["segment_index"] = range(len(valid))

    tracks = gpd.GeoDataFrame(
        valid,
        geometry=[
            LineString([
                (row.previous_lon, row.previous_lat),
                (row.longitude, row.latitude),
            ])
            for row in valid.itertuples()
        ],
        crs="EPSG:4326",
    ).to_crs("EPSG:32721")

    roads = gpd.read_file(DATA / "roads.geojson").to_crs("EPSG:32721")
    roads = roads.reset_index(drop=True)
    roads["road_id"] = roads.index

    # Preserve road IDs so each candidate can be identified.
    intersections = gpd.sjoin(
        tracks[["segment_index", "geometry"]],
        roads[["road_id", "highway", "geometry"]],
        how="inner",
        predicate="intersects",
    )

    print("=== MOVEMENT / ROAD INTERSECTIONS ===")
    print("Movement segments examined:", len(tracks))
    print("Intersecting pairs:", len(intersections))
    print("Distinct road features intersected:",
          intersections["road_id"].nunique())

    if intersections.empty:
        print("No candidate intersections found.")
        return

    # Count distinct movement segments for each road.
    ranked = (
        intersections.groupby("road_id")
        .agg(
            highway=("highway", "first"),
            movement_segments=("segment_index", "nunique"),
        )
        .sort_values("movement_segments", ascending=False)
        .reset_index()
    )

    output = ROOT / "simulation" / "candidate_road_summary.csv"
    ranked.to_csv(output, index=False)

    print("\nTop 10 candidate road features:")
    print(ranked.head(10).to_string(index=False))
    print("\nSaved:", output)
    print(
        "\nThese are geometric candidates, not confirmed crossings "
        "or proven ecological bottlenecks."
    )


if __name__ == "__main__":
    main()
