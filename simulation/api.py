
from pathlib import Path
import json

import geopandas as gpd
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from shapely.geometry import LineString as ShapelyLineString
from shapely.geometry import Point as ShapelyPoint

ROOT = Path(__file__).resolve().parent.parent
SIM = ROOT / "simulation"

app = FastAPI(title="CorridorG Simulation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://wildtrace.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class Scenario(BaseModel):
    intervention: str
    road_id: int
    radius_m: float = Field(default=500, gt=0, le=5000)


@app.get("/")
def home():
    return {
        "service": "CorridorG",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "CorridorG"}


@app.get("/candidates")
def candidates():
    path = SIM / "candidate_road_summary.csv"

    if not path.exists():
        raise HTTPException(500, "Candidate summary not found")

    data = pd.read_csv(path)

    return {
        "count": len(data),
        "candidates": data.to_dict(orient="records"),
    }


@app.get("/candidate-roads")
def candidate_roads():
    path = SIM / "candidate_roads.geojson"

    if not path.exists():
        raise HTTPException(
            500, "Candidate road GeoJSON not found"
        )

    roads = gpd.read_file(path).to_crs("EPSG:4326")

    return json.loads(roads.to_json())


def _load_movement_segments(points: pd.DataFrame) -> gpd.GeoDataFrame:
    """Build the same movement segments used by ``find_candidates.py``.

    A movement segment is the straight line between two consecutive GPS
    fixes of the same animal within the same continuous movement segment
    (continuous segments are delimited by >24 h gaps in ``prepare_data.py``).
    Segments are returned in EPSG:32721 (UTM 21S, metres) to match the roads.
    """
    rows = []
    grouped = points.groupby(
        ["individual.local.identifier (ID)", "segment_id"],
        sort=False,
    )
    for (_animal, _segment), group in grouped:
        group = group.sort_values("timestamp")
        lons = group["longitude"].to_numpy()
        lats = group["latitude"].to_numpy()
        for i in range(len(lons) - 1):
            rows.append(
                {
                    "geometry": ShapelyLineString(
                        [(lons[i], lats[i]), (lons[i + 1], lats[i + 1])]
                    )
                }
            )
    return gpd.GeoDataFrame(
        rows, geometry="geometry", crs="EPSG:4326"
    ).to_crs("EPSG:32721")


def _extract_crossing_points(segment_geometry, road_geometry):
    """Return the points where a movement segment crosses a road.

    Handles Point, MultiPoint and collinear-overlap results. Overlapping
    (tangential) sections are represented by a single representative point,
    so a segment that runs along a road counts as one crossing location.
    """
    if segment_geometry is None or segment_geometry.is_empty:
        return []
    if not segment_geometry.intersects(road_geometry):
        return []

    intersection = segment_geometry.intersection(road_geometry)
    geom_type = intersection.geom_type

    if geom_type == "Point":
        return [intersection]
    if geom_type == "MultiPoint":
        return list(intersection.geoms)
    if geom_type == "GeometryCollection":
        points = []
        for part in intersection.geoms:
            points.extend(_extract_crossing_points(part, road_geometry))
        return points
    if geom_type in ("LineString", "MultiLineString"):
        return [intersection.representative_point()]
    return []


@app.post("/simulate")
def simulate(scenario: Scenario):
    allowed = {
        "overpass",
        "underpass",
        "green_corridor",
        "road_reroute",
    }

    if scenario.intervention not in allowed:
        raise HTTPException(400, "Unsupported intervention")

    roads_path = SIM / "candidate_roads.geojson"
    points_path = SIM / "humid_chaco_clean.csv"

    if not roads_path.exists() or not points_path.exists():
        raise HTTPException(
            500, "Simulation data files are missing"
        )

    roads = gpd.read_file(roads_path).to_crs("EPSG:32721")
    points = pd.read_csv(points_path)

    match = roads[roads["road_id"] == scenario.road_id]

    if match.empty:
        raise HTTPException(404, "Candidate road not found")

    gps = gpd.GeoDataFrame(
        points,
        geometry=gpd.points_from_xy(
            points["longitude"],
            points["latitude"],
        ),
        crs="EPSG:4326",
    ).to_crs("EPSG:32721")

    road = match.geometry.iloc[0]
    radius = scenario.radius_m

    # --- Baseline metrics, all derived from observed GPS data ---------------
    observations_near_road = int(
        (gps.geometry.distance(road) <= radius).sum()
    )

    segments = _load_movement_segments(points)
    segment_hits = segments.geometry.apply(
        lambda geom: _extract_crossing_points(geom, road)
    )
    crossing_segments = int((segment_hits.apply(len) > 0).sum())
    crossing_events = [p for points_hit in segment_hits for p in points_hit]
    crossing_event_count = len(crossing_events)

    # --- Hypothetical structure site ----------------------------------------
    # Place the hypothetical structure at the point of the road closest to
    # the centroid of all observed crossing points (the densest observed
    # crossing cluster). Real siting would require engineering/ecological
    # review; this is an explicit, reproducible modelling assumption.
    if crossing_events:
        mean_x = sum(p.x for p in crossing_events) / crossing_event_count
        mean_y = sum(p.y for p in crossing_events) / crossing_event_count
        structure_point = road.interpolate(
            road.project(ShapelyPoint(mean_x, mean_y))
        )
    else:
        structure_point = road.interpolate(0.5, normalized=True)

    structure_geometry = {
        "lat": round(structure_point.y, 6),
        "lng": round(structure_point.x, 6),
        "epsg": 32721,
    }

    # --- Scenario comparison ------------------------------------------------
    if scenario.intervention in ("overpass", "underpass"):
        # Accessibility-proxy model (honest prototype):
        # Every observed segment that crosses the road within `radius_m` of
        # the structure is modelled as relocated to the structure; the
        # remaining segments keep crossing at grade. The benefit is computed
        # from observed geometry + coverage, not an assumed percentage.
        served_mask = segment_hits.apply(
            lambda pts: len(pts) > 0
            and any(p.distance(structure_point) <= radius for p in pts)
        )
        served_segments = int(served_mask.sum())
        residual_segments = crossing_segments - served_segments
        served_share = (
            served_segments / crossing_segments
            if crossing_segments > 0
            else 0.0
        )

        scenario_result = {
            "structure_type": scenario.intervention,
            "method": (
                "Accessibility proxy: observed movement segments that cross "
                "the road within radius_m of the structure point are "
                "modelled as using the structure; the rest remain at-grade "
                "crossings in the model. Benefit = observed covered crossings, "
                "not an assumed effectiveness rate."
            ),
            "structure_point": structure_geometry,
            "served_crossing_segments": served_segments,
            "served_crossing_share": round(served_share, 4),
            "residual_at_grade_crossing_segments": residual_segments,
        }
        hypothetical_index = residual_segments

    elif scenario.intervention == "road_reroute":
        # Geometric reroute model: the road sub-segment within radius_m of
        # the structure point is removed from the modelled network and the
        # observed movement segments are re-checked against the remainder.
        # Elimination is a direct measurement of segments whose crossing is
        # contained in the rerouted section.
        road_remaining = road.difference(structure_point.buffer(radius))
        residual = (
            0
            if road_remaining.is_empty
            else int(
                segments.geometry.apply(
                    lambda g: g.intersects(road_remaining)
                ).sum()
            )
        )
        eliminated = crossing_segments - residual

        scenario_result = {
            "structure_type": "reroute",
            "method": (
                "Road rerouted outside the observed crossing zone: the road "
                "sub-segment within radius_m of the structure point is "
                "removed from the modelled network and the observed "
                "movement segments are re-checked against the remaining "
                "road. Eliminated crossings are measured geometrically."
            ),
            "structure_point": structure_geometry,
            "crossing_segments_eliminated": int(eliminated),
            "residual_crossing_segments": int(residual),
        }
        hypothetical_index = residual

    else:  # green_corridor
        # No habitat/land-cover dataset exists in the project. Modelling a
        # green corridor from roads and GPS geometry alone would invent
        # habitat data, so no scenario index is produced.
        scenario_result = {
            "structure_type": "green_corridor",
            "model_status": "not_modelled",
            "reason": (
                "No habitat or land-cover dataset exists in this project, "
                "so green-corridor connectivity cannot be modelled. An index "
                "derived only from roads and GPS geometry would invent "
                "habitat data; no scenario value is reported."
            ),
            "structure_point": structure_geometry,
        }
        hypothetical_index = None

    return {
        "intervention": scenario.intervention,
        "road_id": scenario.road_id,
        "radius_m": scenario.radius_m,
        "model_status": (
            "observed_geometry_model_with_explicit_assumptions"
            if scenario.intervention != "green_corridor"
            else "not_modelled_habitat_data_missing"
        ),
        "baseline": {
            "observations_near_road": observations_near_road,
            "crossing_segments": crossing_segments,
            "crossing_events": crossing_event_count,
            "exposure_index": crossing_segments,
            "source": (
                "Observed movement segments (straight lines between "
                "consecutive GPS fixes, capped at 24 h gaps)"
            ),
        },
        "scenario": {
            "observations_near_road": observations_near_road,
            **scenario_result,
            "hypothetical_exposure_index": hypothetical_index,
            "hypothetical_index_change": (
                None
                if hypothetical_index is None
                else hypothetical_index - crossing_segments
            ),
        },
        "limitations": [
            "Observed segments are straight interpolations between GPS fixes; "
            "gaps of up to 24 h mean crossings are geometric candidates, "
            "not proven road crossings.",
            "The accessibility-proxy assumption (proximity to the structure "
            "implies use) is not validated and does not guarantee any "
            "ecological benefit.",
            "The structure site is chosen automatically at the densest "
            "observed crossing cluster; real sites need engineering and "
            "ecological review.",
            "The model does not predict jaguar mortality, behaviour, traffic "
            "outcomes, or road-user impacts.",
            "No habitat data exists, so green corridors and alternative "
            "animal routes through habitat cannot be modelled.",
        ],
    }
