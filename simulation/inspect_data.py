
from pathlib import Path

import geopandas as gpd
import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "app" / "public" / "data"

JAGUAR_FILE = DATA_DIR / "jaguar_movement_data.csv"
ROADS_FILE = DATA_DIR / "roads.geojson"


def main():
    print("=== JAGUAR DATA ===")

    jaguars = pd.read_csv(
        JAGUAR_FILE,
        dtype={"tag.local.identifier": "string"}
    )
    print("\n=== INDIVIDUAL IDENTIFIERS ===")

    for column in [
        "tag.local.identifier",
        "individual.local.identifier (ID)",
    ]:
        print(f"\n{column}")
        print("Unique values:", jaguars[column].nunique())
        print("Most common values:")
        print(jaguars[column].value_counts().head(10))

    print("Total observations:", len(jaguars))
    print("Columns:", jaguars.columns.tolist())
    
    print("\n=== HUMID CHACO IDENTIFIERS ===")

    # Keep only observations from our study
    humid = jaguars[
        jaguars["study.name"] == "Humid Chaco"
    ]
    
    print("\n=== HUMID CHACO TRACKING INTERVALS ===")

    humid["timestamp_parsed"] = pd.to_datetime(
        humid["timestamp"],
        errors="coerce"
    )

    humid = humid.sort_values(
        ["individual.local.identifier (ID)", "timestamp_parsed"]
    )

    humid["time_gap_hours"] = (
        humid.groupby("individual.local.identifier (ID)")[
            "timestamp_parsed"
        ].diff().dt.total_seconds() / 3600
    )

    print("\nTime gaps between consecutive observations:")
    print(humid["time_gap_hours"].describe())

    print("\nMedian time gap by individual:")
    print(
        humid.groupby("individual.local.identifier (ID)")[
            "time_gap_hours"
        ].median()
    )

    print("Total observations:", len(humid))

    # Check the two possible animal identifiers
    print("\nTag IDs:")
    print(humid["tag.local.identifier"].value_counts().head())

    print("\nIndividual IDs:")
    print(
        humid["individual.local.identifier (ID)"]
        .value_counts()
        .head()
    )


    # Check which studies and countries are represented
    print("\nObservations by study:")
    print(jaguars["study.name"].value_counts().head(10))

    print("\nObservations by country:")
    print(jaguars["country"].value_counts().head(10))

    # Check coordinates
    longitude = pd.to_numeric(
        jaguars["location.long"], errors="coerce"
    )
    latitude = pd.to_numeric(
        jaguars["location.lat"], errors="coerce"
    )

    valid = (
        longitude.between(-180, 180)
        & latitude.between(-90, 90)
    )

    print("\nValid coordinate pairs:", int(valid.sum()))
    print("Missing/invalid coordinate pairs:", int((~valid).sum()))

    print("Jaguar longitude range:",
          longitude[valid].min(), "to", longitude[valid].max())
    print("Jaguar latitude range:",
          latitude[valid].min(), "to", latitude[valid].max())

    # Inspect timestamp format
    timestamps = pd.to_datetime(
        jaguars["timestamp"],
        errors="coerce"
    )

    print("\nValid timestamps:", int(timestamps.notna().sum()))
    print("Earliest timestamp:", timestamps.min())
    print("Latest timestamp:", timestamps.max())

    print("\n=== ROAD DATA ===")

    roads = gpd.read_file(ROADS_FILE)

    print("Total road features:", len(roads))
    print("CRS:", roads.crs)
    print("Geometry types:")
    print(roads.geom_type.value_counts())
    print("Empty geometries:", int(roads.geometry.is_empty.sum()))
    print("Missing geometries:", int(roads.geometry.isna().sum()))

    print("\nRoad geographic bounds:")
    print("West, South, East, North:", roads.total_bounds)

    if "highway" in roads.columns:
        print("\nRoad categories:")
        print(roads["highway"].value_counts().head(10))


if __name__ == "__main__":
    main()
