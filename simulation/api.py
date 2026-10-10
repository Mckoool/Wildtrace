
from pathlib import Path

import geopandas as gpd
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

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
        raise HTTPException(500, "Simulation data files are missing")

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

    # Count GPS observations near the selected road.
    distances = gps.geometry.distance(road)
    nearby = distances <= scenario.radius_m
    baseline_count = int(nearby.sum())

    # Explicit demonstration assumptions, not measured effects.
    assumptions = {
        "overpass": 0.25,
        "underpass": 0.25,
        "green_corridor": 0.20,
        "road_reroute": 0.30,
    }

    assumed_reduction = assumptions[scenario.intervention]

    # Hypothetical index for demonstrating scenario comparisons.
    baseline_index = baseline_count
    scenario_index = round(
        baseline_index * (1 - assumed_reduction)
    )

    return {
        "intervention": scenario.intervention,
        "road_id": scenario.road_id,
        "radius_m": scenario.radius_m,
        "model_status": "illustrative_assumptions_not_validated",
        "baseline": {
            "observations_near_road": baseline_count,
            "exposure_index": baseline_index,
        },
        "scenario": {
            "observations_near_road": baseline_count,
            "hypothetical_exposure_index": scenario_index,
            "hypothetical_index_change": (
                scenario_index - baseline_index
            ),
            "assumed_reduction_fraction": assumed_reduction,
        },
        "limitations": [
            "GPS proximity does not prove a road crossing.",
            "The reduction fraction is a user-independent demonstration assumption.",
            "The index is not a prediction of actual jaguar behaviour.",
            "Traffic outcomes and road-user satisfaction are not modelled.",
        ],
    }
