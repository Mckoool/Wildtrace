
from pathlib import Path

import pandas as pd
import geopandas as gpd

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "app" / "public" / "data"


def main():
    jaguars = pd.read_csv(
        DATA / "jaguar_movement_data.csv",
        dtype={"tag.local.identifier": "string"},
    )

    # Keep only the Humid Chaco study
    jaguars = jaguars[
        jaguars["study.name"].str.strip() == "Humid Chaco"
    ].copy()

    jaguars["timestamp"] = pd.to_datetime(
        jaguars["timestamp"], errors="coerce"
    )
    jaguars["longitude"] = pd.to_numeric(
        jaguars["location.long"], errors="coerce"
    )
    jaguars["latitude"] = pd.to_numeric(
        jaguars["location.lat"], errors="coerce"
    )

    jaguars = jaguars.dropna(
        subset=[
            "timestamp",
            "longitude",
            "latitude",
            "individual.local.identifier (ID)",
        ]
    )

    jaguars = jaguars.sort_values(
        ["individual.local.identifier (ID)", "timestamp"]
    )

    jaguars["gap_hours"] = (
        jaguars.groupby("individual.local.identifier (ID)")[
            "timestamp"
        ].diff().dt.total_seconds() / 3600
    )

    # Start a new segment after gaps exceeding 24 hours
    jaguars["new_segment"] = (
        jaguars["gap_hours"].isna()
        | (jaguars["gap_hours"] > 24)
    )

    jaguars["segment_id"] = jaguars.groupby(
        "individual.local.identifier (ID)"
    )["new_segment"].cumsum()

    output = ROOT / "simulation" / "humid_chaco_clean.csv"
    jaguars.to_csv(output, index=False)

    roads = gpd.read_file(DATA / "roads.geojson")

    print("Clean observations:", len(jaguars))
    print("Individuals:", jaguars[
        "individual.local.identifier (ID)"
    ].nunique())
    print("Movement segments:", jaguars[
        ["individual.local.identifier (ID)", "segment_id"]
    ].drop_duplicates().shape[0])
    print("Road features:", len(roads))
    print("Saved:", output)


if __name__ == "__main__":
    main()
