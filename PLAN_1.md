# Assignment 4 — Pipeline API + Frontend
**Due tonight, midnight.** Serious work starts ~4:00pm → 8 hours, 15 min buffer built in.

## The design (locked in — v2, using your `nations.json`)

**Project: EU4 nation "playstyle" recommender.** You upload preferences shaped like a nation's stats (a ruler's admin/diplomacy/military skill + national idea scores), and the API returns the nations from your dataset whose profile is nearest to that. This is a nearest-neighbor recommender, not a classifier — no labels needed, matches the assignment's own "doesn't have to predict labels" note, and it's built on data you actually care about instead of a fake corpus.

Each of your 47 nations has 6 raw numeric fields: `ruler_adm`, `ruler_dip`, `ruler_mil` (ruler skill, ~0-6) and `national_ideas.eco_score`, `dip_score`, `mil_score` (~0-10). The custom transformer's job: blend each nation's *ruler skill* with its *national idea bonus* into 3 clean playstyle axes (administration, diplomacy, military), so "a great diplomat ruler in a diplomacy-focused nation" and "a mediocre ruler compensated by strong diplomatic ideas" can land near each other.

- **Custom transformer**: `PlaystyleBlender` — takes the 6 raw columns, rescales the two ruler stats onto the idea-score's 0-10 range, then blends each pair with a configurable weight into 3 output features: `administration`, `diplomacy`, `military`. Inherits `BaseEstimator, TransformerMixin`. `__init__(self, ruler_weight=0.5)` only assigns. `fit` returns `self` (stateless — the *pipeline's* learned state comes from the `StandardScaler` step after it, which does have real fitted mean/variance from your 47 nations).
- **Pipeline**: `Pipeline([("blend", PlaystyleBlender(ruler_weight=0.5)), ("scale", StandardScaler())])` — fit on the 47 nations' raw 6-column matrix.
- **Recommender**: a `NearestNeighbors` model fit on the pipeline's output (the scaled 3-D playstyle matrix). Kept alongside the pipeline in the bundle, not squeezed inside it (NearestNeighbors isn't a transformer).
- **Fitted bundle** (`pipeline.joblib`, a dict):
  ```python
  {
    "pipeline": fitted_pipeline,     # PlaystyleBlender + StandardScaler, fitted on the 47 nations
    "nn_model": fitted_nn,           # NearestNeighbors fit on pipeline output
    "matrix": scaled_matrix,         # (47, 3) — pipeline.transform(raw), for reference/debugging
    "nations": [                     # aligned row-wise with matrix
      {"tag": "TUR", "name": "Ottomans", "region": "Anatolia", "key_idea": "Timar System (...)"},
      ...
    ],
    "metadata": {
      "steps": ["blend", "scale", "NearestNeighbors"],
      "built_at": "<ISO timestamp>",
      "sklearn_version": sklearn.__version__,
      "n_nations": 47,
      "features": ["administration", "diplomacy", "military"],
    }
  }
  ```
- **POST `/recommend`**: body = `{"ruler_adm": int, "ruler_dip": int, "ruler_mil": int, "eco_score": float, "dip_score": float, "mil_score": float, "top_k": int}` → run through the *loaded* pipeline → `nn_model.kneighbors()` against the stored matrix → return top_k `{tag, name, region, key_idea, distance}`.
- **GET `/info`**: returns `metadata` so a human/grader can see what's loaded (feature axes, nation count, sklearn version, build time).

Why this satisfies "wrong if rebuilt from scratch at boot": `StandardScaler`'s mean/variance and `NearestNeighbors`' fitted index only exist because they were fit on *your specific 47 nations*. If `serve.py` re-fit at import instead of loading the `.joblib`, a query vector would get scaled/matched against whatever happened to be in memory at that moment rather than a stable, versioned fit — the assignment wants a persisted fit loaded once, never refit inside the API process.

Put `nations.json` in the repo root — `build.py` reads it directly.

## Repo layout

```
assignment4/
  pipeline_def.py        # PlaystyleBlender class ONLY (Modal needs to import this)
  nations.json            # your dataset — build.py reads this
  build.py                # loads nations.json, fits pipeline + NearestNeighbors, dumps pipeline.joblib
  pipeline.joblib         # output of build.py
  serve.py                # FastAPI app — local dev entrypoint
  modal_serve.py          # wraps serve.py's app for Modal deployment
  requirements.txt        # pin fastapi, uvicorn, scikit-learn==<exact>, joblib, pydantic
  postman_collection.json
  README.md               # the 3-5 sentence blurb + all URLs
```

## Timeline (today, due midnight)

| Time | Block | Goal |
|---|---|---|
| 4:00–4:40 | Scaffold + transformer | repo skeleton, `pipeline_def.py` written and unit-tested in a REPL |
| 4:40–5:20 | `build.py` | load `nations.json`, build pipeline, fit pipeline + `NearestNeighbors`, dump bundle with metadata, confirm `sklearn.__version__` |
| 5:20–6:20 | `serve.py` | FastAPI app, load-once-at-import, GET `/info`, POST `/recommend`, Pydantic bounds, 503 on missing artifact. Test via `uvicorn serve:app --reload` + `/docs` |
| 6:20–7:20 | Modal | `modal_serve.py`, image with exactly 3 files, pin sklearn version in the image, `modal deploy`, curl the live URL |
| 7:20–8:15 | Vercel frontend | minimal page (plain HTML/JS or Next.js) that calls the **live Modal URL**, `vercel deploy --prod` |
| 8:15–9:15 | Postman | collection: GET `/info`, valid POST `/recommend` (200 + assertions), invalid POST `/recommend` (422 + assertions, e.g. `ruler_adm: 9` or a missing field) — run against the **deployed** URL, screenshot both |
| 9:15–9:45 | Write-up | 3-5 sentences (model type / what it does / transformer name / sklearn version), README with all URLs |
| 9:45–10:30 | Buffer | fix whatever broke in the Modal/Vercel steps (this always takes longer than planned) |
| 10:30–11:30 | Final QA | reload `/docs` URL cold, re-run Postman against the live URL one more time, check Vercel isn't stale |
| 11:30–12:00 | Submit | Canvas: Modal API URL, `/docs` URL, Vercel URL, Postman screenshots, write-up, zip/repo |

## Code skeletons

**`pipeline_def.py`**
```python
from sklearn.base import BaseEstimator, TransformerMixin
import numpy as np

class PlaystyleBlender(BaseEstimator, TransformerMixin):
    """Blends ruler skill (ruler_adm, ruler_dip, ruler_mil) with national
    idea scores (eco_score, dip_score, mil_score) into 3 playstyle axes.
    Expects columns in this exact order:
    [ruler_adm, ruler_dip, ruler_mil, eco_score, dip_score, mil_score]
    """
    def __init__(self, ruler_weight=0.5):
        self.ruler_weight = ruler_weight  # __init__ ONLY assigns — no logic here

    def fit(self, X, y=None):
        return self  # stateless — nothing to learn here

    def transform(self, X):
        X = np.asarray(X, dtype=float)
        w = self.ruler_weight
        ruler_adm, ruler_dip, ruler_mil = X[:, 0], X[:, 1], X[:, 2]
        eco_score, dip_score, mil_score = X[:, 3], X[:, 4], X[:, 5]
        # ruler stats run ~0-6, idea scores run ~0-10 — rescale before blending
        r_adm, r_dip, r_mil = ruler_adm / 6 * 10, ruler_dip / 6 * 10, ruler_mil / 6 * 10
        administration = w * r_adm + (1 - w) * eco_score
        diplomacy = w * r_dip + (1 - w) * dip_score
        military = w * r_mil + (1 - w) * mil_score
        return np.column_stack([administration, diplomacy, military])
```

**`build.py`** (sketch)
```python
import json, joblib, sklearn, datetime
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors
from pipeline_def import PlaystyleBlender

with open("nations.json") as f:
    nations = json.load(f)

tags = list(nations.keys())
raw = np.array([
    [n["ruler_adm"], n["ruler_dip"], n["ruler_mil"],
     n["national_ideas"]["eco_score"], n["national_ideas"]["dip_score"], n["national_ideas"]["mil_score"]]
    for n in nations.values()
])

pipeline = Pipeline([
    ("blend", PlaystyleBlender(ruler_weight=0.5)),
    ("scale", StandardScaler()),
])
matrix = pipeline.fit_transform(raw)
nn_model = NearestNeighbors(n_neighbors=5).fit(matrix)

records = [
    {"tag": tag, "name": n["name"], "region": n["region"], "key_idea": n["national_ideas"]["key_idea"]}
    for tag, n in nations.items()
]

bundle = {
    "pipeline": pipeline,
    "nn_model": nn_model,
    "matrix": matrix,
    "nations": records,
    "metadata": {
        "steps": [name for name, _ in pipeline.steps] + ["NearestNeighbors"],
        "built_at": datetime.datetime.utcnow().isoformat(),
        "sklearn_version": sklearn.__version__,
        "n_nations": len(records),
        "features": ["administration", "diplomacy", "military"],
    },
}
joblib.dump(bundle, "pipeline.joblib")
```

**`serve.py`** (sketch — key gotchas inline)
```python
import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, conint, confloat
from pipeline_def import PlaystyleBlender  # must be importable, or unpickling fails

app = FastAPI()

try:
    bundle = joblib.load("pipeline.joblib")  # load ONCE at import, never per-request
except Exception:
    bundle = None

class RecommendRequest(BaseModel):
    ruler_adm: conint(ge=0, le=6)
    ruler_dip: conint(ge=0, le=6)
    ruler_mil: conint(ge=0, le=6)
    eco_score: confloat(ge=0, le=10)
    dip_score: confloat(ge=0, le=10)
    mil_score: confloat(ge=0, le=10)
    top_k: conint(ge=1, le=10) = 5

@app.get("/info")
def info():
    if bundle is None:
        raise HTTPException(status_code=503, detail="artifact not loaded")
    return bundle["metadata"]

@app.post("/recommend")
def recommend(req: RecommendRequest):
    if bundle is None:
        raise HTTPException(status_code=503, detail="artifact not loaded")
    raw = [[req.ruler_adm, req.ruler_dip, req.ruler_mil, req.eco_score, req.dip_score, req.mil_score]]
    vec = bundle["pipeline"].transform(raw)
    distances, indices = bundle["nn_model"].kneighbors(vec, n_neighbors=req.top_k)
    return [
        {**bundle["nations"][i], "distance": float(d)}
        for i, d in zip(indices[0], distances[0])
    ]
```
Pydantic handles bad input → automatic 422 (e.g. missing field, `ruler_adm` out of 0-6 range, `top_k` out of 1-10, wrong types). Don't hand-roll that validation.

**`modal_serve.py`** (sketch)
```python
import modal

image = (
    modal.Image.debian_slim()
    .pip_install("fastapi", "scikit-learn==<EXACT VERSION FROM metadata>", "joblib", "pydantic")
    .add_local_file("serve.py", "/root/serve.py")
    .add_local_file("pipeline_def.py", "/root/pipeline_def.py")
    .add_local_file("pipeline.joblib", "/root/pipeline.joblib")
    # nations.json itself doesn't need to ship — it's baked into pipeline.joblib at build time
)

app = modal.App("assignment4-pipeline")

@app.function(image=image)
@modal.asgi_app()
def fastapi_app():
    import sys
    sys.path.insert(0, "/root")
    from serve import app as web_app  # import INSIDE the function
    return web_app
```
(Exact Modal API — `add_local_file` vs `copy=True`, decorator names — depends on your installed `modal` version; check `modal --version` and the current Modal docs/`modal deploy` output before finalizing, since Modal's SDK surface has shifted across versions.)

## The "Don't miss" list, mapped to this plan

- **Custom class not in the Modal image** → `pipeline_def.py` is one of the 3 files baked into the image, and `serve.py` imports `TextNormalizer` from it. Verify by checking Modal's deploy logs / hitting `/info` on the live URL.
- **sklearn version mismatch** → run `python -c "import sklearn; print(sklearn.__version__)"` locally right after `build.py`, then hardcode that exact string in `modal_serve.py`'s `pip_install`.
- **Load-per-request** → `joblib.load` happens at module import time in `serve.py`, not inside the route function.
- **Frontend still on localhost** → the Vercel page's fetch URL must be the `https://*.modal.run` URL from `modal deploy` output, never `localhost:8000`.
- **Postman hitting localhost** → collection variables should point at the deployed Modal URL before you screenshot.

## Canvas submission checklist
- [ ] Modal API URL
- [ ] `/docs` URL (same Modal URL + `/docs`, since FastAPI serves Swagger UI automatically)
- [ ] Vercel URL (confirmed calling the live Modal API)
- [ ] Postman screenshots: valid POST (200) + invalid POST (422)
- [ ] 3-5 sentence write-up: why this model type (nearest-neighbor recommender), what it does (matches a preferred ruler/nation profile to your 47 EU4 nations), transformer name (`PlaystyleBlender`), sklearn version
- [ ] Zip/repo: `pipeline_def.py`, `build.py`, `serve.py`, `modal_serve.py`, `pipeline.joblib` (or rebuild script), `postman_collection.json`
- [ ] Everything still up and live right before submitting (re-check at ~11:45pm)
