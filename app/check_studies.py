
import csv
from collections import defaultdict

studies = defaultdict(
    lambda: {
        "count": 0,
        "min_lat": 90,
        "max_lat": -90,
        "min_lon": 180,
        "max_lon": -180,
        "countries": set(),
    }
)

with open(
    "public/data/jaguar_movement_data.csv",
    newline="",
    encoding="utf-8-sig",
) as file:
    for row in csv.DictReader(file):
        try:
            lat = float(row["location.lat"])
            lon = float(row["location.long"])
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                continue
        except (ValueError, KeyError, TypeError):
            continue

        name = row.get("study.name", "").strip() or "Unknown"
        country = row.get("country", "").strip() or "Unknown"
        s = studies[name]

        s["count"] += 1
        s["min_lat"] = min(s["min_lat"], lat)
        s["max_lat"] = max(s["max_lat"], lat)
        s["min_lon"] = min(s["min_lon"], lon)
        s["max_lon"] = max(s["max_lon"], lon)
        s["countries"].add(country)

for name, s in sorted(
    studies.items(), key=lambda item: item[1]["count"], reverse=True
):
    print(f"\n{name} | {s['count']:,} observations")
    print("Countries:", ", ".join(sorted(s["countries"])))
    print(
        f"Latitude: {s['min_lat']:.4f} to {s['max_lat']:.4f}"
    )
    print(
        f"Longitude: {s['min_lon']:.4f} to {s['max_lon']:.4f}"
    )
