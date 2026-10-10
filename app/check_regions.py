
import csv
from collections import Counter
from math import floor

regions = Counter()

with open(
    "public/data/jaguar_movement_data.csv",
    newline="",
    encoding="utf-8-sig",
) as file:
    reader = csv.DictReader(file)

    for row in reader:
        try:
            lat = float(row["location.lat"])
            lon = float(row["location.long"])

            if -90 <= lat <= 90 and -180 <= lon <= 180:
                # Group coordinates into roughly 2-degree blocks.
                region = (floor(lat / 2) * 2, floor(lon / 2) * 2)
                regions[region] += 1
        except (ValueError, KeyError, TypeError):
            continue

print("Regions: southwest corner (lat, lon), observation count")
for region, count in regions.most_common(30):
    print(region, count)
