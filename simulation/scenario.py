
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "app" / "public" / "data"
CLEAN = ROOT / "simulation" / "humid_chaco_clean.csv"


def main():
    jaguars = pd.read_csv(CLEAN)
    roads = gpd.read_file(DATA / "roads.geojson").to_crs("EPSG:32721")

    points = gpd.GeoDataFrame(
        jaguars,
        geometry=gpd.points_from_xy(
            jaguars["longitude"],
            jaguars["latitude"],
        ),
        crs="EPSG:4326",
    ).to_crs("EPSG:32721")

    # Find the road nearest to the most frequently observed location.
    center = points.geometry.union_all().centroid
    road_distances = roads.geometry.distance(center)
    candidate_index = road_distances.idxmin()
    candidate_road = roads.loc[candidate_index]

    # Illustrative intervention parameters, not ecological facts.
    crossing_radius_m = 500
    crossing_cost_factor = 0.5

    before = points.geometry.distance(candidate_road.geometry)
    after = before.copy()

    affected = before <= crossing_radius_m
    after.loc[affected] = before.loc[affected] * crossing_cost_factor

    print("=== HYPOTHETICAL CROSSING SCENARIO ===")
    print("GPS observations:", len(points))
    print("Selected road category:", candidate_road.get("highway"))
    print("Observations within 500 m:", int(affected.sum()))
    print("Mean modelled distance before (m):", round(before.mean(), 2))
    print("Mean modelled cost after (m-equivalent):", round(after.mean(), 2))
    print("Assumed cost factor:", crossing_cost_factor)
    print("\nWARNING: This is a toy scenario, not a validated connectivity model.")


if __name__ == "__main__":
    main()
