
from pathlib import Path

import geopandas as gpd
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "app" / "public" / "data"
SIM = ROOT / "simulation"


def main():
    roads = gpd.read_file(DATA / "roads.geojson").to_crs("EPSG:32721")
    roads = roads.reset_index(drop=True)
    roads["road_id"] = roads.index

    summary = pd.read_csv(SIM / "candidate_road_summary.csv")

    candidates = roads.merge(summary, on="road_id", how="inner")

    output = SIM / "candidate_roads.geojson"
    candidates.to_crs("EPSG:4326").to_file(output, driver="GeoJSON")

    print("Candidate road features:", len(candidates))
    print("Saved:", output)


if __name__ == "__main__":
    main()
