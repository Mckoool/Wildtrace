
import csv
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

# Paths relative to the app folder
DATA_DIR = Path("public/data")
CSV_FILE = DATA_DIR / "jaguar_movement_data.csv"
OUTPUT_FILE = DATA_DIR / "roads.geojson"

# Humid Chaco study region, Paraguay
# We use this study-area window rather than the full dataset,
# which contains observations from multiple countries.
SOUTH, WEST, NORTH, EAST = -24.5, -59.5, -22.0, -57.0

# Smaller tiles reduce the risk of Overpass timeouts.
TILE_SIZE = 0.25
BUFFER = 0.05

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

ROAD_FILTER = (
    '["highway"~"^(motorway|trunk|primary|secondary|tertiary|'
    'unclassified|residential|track|service|path)$"]'
)


def make_tiles():
    tiles = []
    lat = SOUTH

    while lat < NORTH:
        lon = WEST

        while lon < EAST:
            south = max(-90, lat - BUFFER)
            west = max(-180, lon - BUFFER)
            north = min(90, lat + TILE_SIZE + BUFFER)
            east = min(180, lon + TILE_SIZE + BUFFER)

            tiles.append((south, west, north, east))
            lon += TILE_SIZE

        lat += TILE_SIZE

    return tiles


def download_tile(tile):
    south, west, north, east = tile

    query = f"""
    [out:json][timeout:60];
    way{ROAD_FILTER}({south},{west},{north},{east});
    out geom;
    """

    request = urllib.request.Request(
        OVERPASS_URL,
        data=urllib.parse.urlencode({"data": query}).encode(),
        headers={"User-Agent": "CorridorG-Hackathon/1.0"},
    )

    with urllib.request.urlopen(request, timeout=90) as response:
        return json.loads(response.read().decode("utf-8"))


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not CSV_FILE.exists():
        raise FileNotFoundError(f"Could not find {CSV_FILE}")

    # Confirm the CSV contains observations in the chosen study window.
    count = 0
    with CSV_FILE.open(newline="", encoding="utf-8-sig") as file:
        for row in csv.DictReader(file):
            try:
                lat = float(row["location.lat"])
                lon = float(row["location.long"])
                if SOUTH <= lat <= NORTH and WEST <= lon <= EAST:
                    count += 1
            except (ValueError, KeyError, TypeError):
                continue

    print(f"GPS observations inside selected window: {count:,}")

    if count == 0:
        print("No GPS points found in this window. Check the study bounds.")
        return

    tiles = make_tiles()
    print(f"Downloading roads across {len(tiles)} tiles...")

    # Keep each OSM way once, even if it appears in overlapping tiles.
    ways = {}
    failed = []

    for index, tile in enumerate(tiles, start=1):
        print(f"Tile {index}/{len(tiles)}: {tile}")

        for attempt in range(3):
            try:
                result = download_tile(tile)

                for element in result.get("elements", []):
                    if element.get("type") == "way":
                        ways[element["id"]] = element

                print(f"  Total unique road ways collected: {len(ways):,}")
                break

            except Exception as error:
                print(f"  Attempt {attempt + 1} failed: {error}")

                if attempt < 2:
                    time.sleep(10 * (attempt + 1))
                else:
                    failed.append(tile)

        # Be considerate of the public Overpass service.
        time.sleep(3)

    features = []

    for way in ways.values():
        coordinates = [
            [point["lon"], point["lat"]]
            for point in way.get("geometry", [])
        ]

        if len(coordinates) < 2:
            continue

        features.append({
            "type": "Feature",
            "id": way["id"],
            "properties": {
                "osm_id": way["id"],
                **way.get("tags", {}),
            },
            "geometry": {
                "type": "LineString",
                "coordinates": coordinates,
            },
        })

    geojson = {
        "type": "FeatureCollection",
        "name": "CorridorG roads",
        "features": features,
    }

    OUTPUT_FILE.write_text(
        json.dumps(geojson),
        encoding="utf-8",
    )

    print(f"\nSaved {len(features):,} road features to {OUTPUT_FILE}")

    if failed:
        print(f"{len(failed)} tiles failed. Rerun later to retry them.")
    else:
        print("All tiles downloaded successfully.")

    print("Source: OpenStreetMap contributors (ODbL).")


if __name__ == "__main__":
    main()
