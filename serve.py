from pathlib import Path
from typing import List, Literal

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from pipeline_def import PlaystyleEncoder, TAG_VOCAB, REGION_VOCAB, AMBITION_VOCAB  # must be importable, or unpickling fails

app = FastAPI(title="EU4 Playstyle Recommender")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ARTIFACT_PATH = Path(__file__).parent / "pipeline.joblib"
TOP_K = 5

try:
    bundle = joblib.load(ARTIFACT_PATH)  # load ONCE at import, never per-request
    nations_by_tag = {n["tag"]: n for n in bundle["nations"]}
except Exception:
    bundle = None
    nations_by_tag = {}

PlaystyleTag = Literal[tuple(TAG_VOCAB)]
MacroRegion = Literal[tuple(REGION_VOCAB)]
Ambition = Literal[tuple(AMBITION_VOCAB)]


class RecommendRequest(BaseModel):
    playstyle_tags: List[PlaystyleTag] = Field(min_length=1)
    macro_region: MacroRegion
    ambition: Ambition


@app.get("/")
def root():
    return {"message": "EU4 Playstyle Recommender API", "docs": "/docs", "health": "/health"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/info")
def info():
    if bundle is None:
        raise HTTPException(status_code=503, detail="artifact not loaded")
    return bundle["metadata"]


@app.post("/recommend")
def recommend(req: RecommendRequest):
    if bundle is None:
        raise HTTPException(status_code=503, detail="artifact not loaded")
    record = [{
        "playstyle_tags": req.playstyle_tags,
        "macro_region": req.macro_region,
        "ambition": req.ambition,
    }]
    vec = bundle["pipeline"].transform(record)
    distances, indices = bundle["nn_model"].kneighbors(vec, n_neighbors=TOP_K)
    return [
        {
            "tag": bundle["nations"][i]["tag"],
            "name": bundle["nations"][i]["name"],
            "region": bundle["nations"][i]["region"],
            "key_idea": bundle["nations"][i]["national_ideas"]["key_idea"],
            "ambition": bundle["nations"][i]["ambition"],
            "playstyle_tags": bundle["nations"][i]["playstyle_tags"],
            "distance": float(d),
        }
        for i, d in zip(indices[0], distances[0])
    ]


@app.get("/nations/{tag}")
def get_nation(tag: str):
    if bundle is None:
        raise HTTPException(status_code=503, detail="artifact not loaded")
    nation = nations_by_tag.get(tag.upper())
    if nation is None:
        raise HTTPException(status_code=404, detail=f"no nation with tag '{tag}'")
    return nation
