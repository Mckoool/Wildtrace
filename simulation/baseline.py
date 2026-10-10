
from pathlib import Path

import pandas as pd
import geopandas as gpd

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "app" / "public" / "data"
CLEAN_FILE = ROOT / "simulation" / "humid_chaco_clean.csv"


def main():
    jaguars = pd.read_csv(CLEAN_FILE)
    roads = gpd.read_file(DATA / "roads.geojson")

    # Convert GPS observations into geographic points
    points = gpd.GeoDataFrame(
        jaguars,
        geometry=gpd.points_from_xy(
            jaguars["longitude"],
            jaguars["latitude"],
        ),
        crs="EPSG:4326",
    ).to_crs("EPSG:32721")

    roads = roads.to_crs("EPSG:32721")

    # Find the nearest road to each GPS observation
    nearest = gpd.sjoin_nearest(
        points,
        roads[["highway", "geometry"]],
        how="left",
        distance_col="distance_to_road_m",
    )

    print("=== BASELINE ANALYSIS ===")
    print("GPS observations:", len(points))
    print("Unique jaguars:", points[
        "individual.local.identifier (ID)"
    ].nunique())

    print(
        "Median distance to nearest mapped road (m):",
        round(nearest["distance_to_road_m"].median(), 2),
    )

    print(
        "Observations within 100 m of a mapped road:",
        int((nearest["distance_to_road_m"] <= 100).sum()),
    )

    print("\nNearest road categories:")
    print(nearest["highway"].value_counts().head(10))

    output = ROOT / "simulation" / "baseline_metrics.csv"
    nearest.drop(columns="geometry").to_csv(output, index=False)
    print("\nSaved baseline metrics:", output)


if __name__ == "__main__":
    main()
