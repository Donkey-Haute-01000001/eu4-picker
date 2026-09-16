import json
import datetime

import joblib
import sklearn
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import NearestNeighbors

from pipeline_def import PlaystyleEncoder, TAG_VOCAB, REGION_VOCAB, AMBITION_VOCAB

with open("nations.json", encoding="utf-8") as f:
    nations = json.load(f)

tags = list(nations.keys())
records = [
    {
        "playstyle_tags": n["playstyle_tags"],
        "macro_region": n["macro_region"],
        "ambition": n["ambition"],
    }
    for n in nations.values()
]

pipeline = Pipeline([
    ("encode", PlaystyleEncoder()),
    ("scale", StandardScaler()),
])
matrix = pipeline.fit_transform(records)
nn_model = NearestNeighbors(n_neighbors=5).fit(matrix)

nation_profiles = [
    {
        "tag": tag,
        "name": n["name"],
        "region": n["region"],
        "macro_region": n["macro_region"],
        "starting_ruler": n["starting_ruler"],
        "ruler_adm": n["ruler_adm"],
        "ruler_dip": n["ruler_dip"],
        "ruler_mil": n["ruler_mil"],
        "national_ideas": n["national_ideas"],
        "ambition": n["ambition"],
        "playstyle_tags": n["playstyle_tags"],
    }
    for tag, n in nations.items()
]

bundle = {
    "pipeline": pipeline,
    "nn_model": nn_model,
    "matrix": matrix,
    "nations": nation_profiles,
    "metadata": {
        "steps": [name for name, _ in pipeline.steps] + ["NearestNeighbors"],
        "built_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "sklearn_version": sklearn.__version__,
        "n_nations": len(nation_profiles),
        "tag_vocab": TAG_VOCAB,
        "region_vocab": REGION_VOCAB,
        "ambition_vocab": AMBITION_VOCAB,
    },
}
joblib.dump(bundle, "pipeline.joblib")

print(f"sklearn version: {sklearn.__version__}")
print(f"built pipeline.joblib with {len(nation_profiles)} nations")
