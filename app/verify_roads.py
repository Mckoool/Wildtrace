
import json
from collections import Counter
from pathlib import Path

path = Path("public/data/roads.geojson")

if not path.exists():
    raise FileNotFoundError(f"Missing file: {path}")

print(f"File size: {path.stat().st_size / (1024 * 1024):.2f} MB")

with path.open(encoding="utf-8") as file:
    data = json.load(file)

features = data.get("features", [])
ids = [f.get("id") for f in features]
types = Counter(f.get("geometry", {}).get("type") for f in features)
highways = Counter()
coordinates = []
empty_geometries = 0

for feature in features:
    props = feature.get("properties") or {}
    highways[props.get("highway", "unknown")] += 1

    geometry = feature.get("geometry")
    if not geometry or not geometry.get("coordinates"):
        empty_geometries += 1
        continue

    def collect_coords(value):
        if (
            isinstance(value, list)
            and len(value) >= 2
            and isinstance(value[0], (int, float))
            and isinstance(value[1], (int, float))
        ):
            coordinates.append((value[0], value[1]))
        elif isinstance(value, list):
            for child in value:
                collect_coords(child)

    collect_coords(geometry["coordinates"])

print(f"GeoJSON type: {data.get('type')}")
print(f"Total road features: {len(features):,}")
print(f"Unique feature IDs: {len(set(ids)):,}")
print(f"Geometry types: {dict(types)}")
print(f"Empty geometries: {empty_geometries}")
print(f"Road categories: {dict(highways.most_common(10))}")

if coordinates:
    lons = [p[0] for p in coordinates]
    lats = [p[1] for p in coordinates]
    print(f"Longitude bounds: {min(lons):.4f} to {max(lons):.4f}")
    print(f"Latitude bounds: {min(lats):.4f} to {max(lats):.4f}")

    inside = sum(
        -59.55 <= lon <= -56.95 and -24.55 <= lat <= -21.95
        for lon, lat in coordinates
    )
    print(f"Coordinates inside expected download extent: {inside:,}/{len(coordinates):,}")

print("\nThis checks file integrity, not geographic completeness.")
