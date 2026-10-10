
from pathlib import Path

import geopandas as gpd
import matplotlib.pyplot as plt
import pandas as pd
from shapely.geometry import box


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "app" / "public" / "data"

JAGUAR_FILE = DATA_DIR / "jaguar_movement_data.csv"
ROADS_FILE = DATA_DIR / "roads.geojson"

OUTPUT_FILE = PROJECT_ROOT / "simulation" / "humid_chaco_data_check.png"

# UTM zone 21 South, suitable for this study area in Paraguay.
PROJECTED_CRS = "EPSG:32721"


def main():
    print("Loading data...")

    jaguars = pd.read_csv(
        JAGUAR_FILE,
        dtype={"tag.local.identifier": "string"},
    )

    # Select the Humid Chaco study only.
    jaguars = jaguars[
        jaguars["study.name"].str.strip().eq("Humid Chaco")
    ].copy()

    jaguars["longitude"] = pd.to_numeric(
        jaguars["location.long"], errors="coerce"
    )
    jaguars["latitude"] = pd.to_numeric(
        jaguars["location.lat"], errors="coerce"
    )

    jaguars = jaguars.dropna(
        subset=["longitude", "latitude"]
    )

    points = gpd.GeoDataFrame(
        jaguars,
        geometry=gpd.points_from_xy(
            jaguars["longitude"],
            jaguars["latitude"],
        ),
        crs="EPSG:4326",
    ).to_crs(PROJECTED_CRS)

    roads = gpd.read_file(ROADS_FILE).to_crs(PROJECTED_CRS)

    if points.empty:
        print("No valid Humid Chaco observations found.")
        return

    # Create a 20 km buffer around the observation extent.
    min_x, min_y, max_x, max_y = points.total_bounds
    study_window = box(
        min_x - 20_000,
        min_y - 20_000,
        max_x + 20_000,
        max_y + 20_000,
    )

    local_roads = roads[
        roads.intersects(study_window)
    ].copy()

    print("Humid Chaco observations:", len(points))
    print("Road features in local window:", len(local_roads))
    print("CRS used for analysis:", PROJECTED_CRS)

    # Plot the road network and observed GPS locations.
    fig, ax = plt.subplots(figsize=(12, 10))

    local_roads.plot(
        ax=ax,
        color="dimgray",
        linewidth=0.45,
        alpha=0.65,
    )

    points.plot(
        ax=ax,
        color="red",
        markersize=2,
        alpha=0.45,
    )

    ax.set_title(
        "Humid Chaco: Jaguar Observations and Road Network"
    )
    ax.set_xlabel("Easting (metres)")
    ax.set_ylabel("Northing (metres)")
    ax.set_aspect("equal")

    fig.tight_layout()
    fig.savefig(OUTPUT_FILE, dpi=180)
    plt.close(fig)

    print("Map saved to:", OUTPUT_FILE)


if __name__ == "__main__":
    main()
