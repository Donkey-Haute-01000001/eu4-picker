from sklearn.base import BaseEstimator, TransformerMixin
import numpy as np

TAG_VOCAB = [
    "tall", "wide",
    "military", "naval", "trade", "diplomatic", "colonial",
    "infantry", "cavalry", "quality", "quantity",
]
REGION_VOCAB = [
    "Western Europe", "Central Europe", "Northern Europe", "Eastern Europe",
    "Southern Europe", "Middle East & North Africa", "Sub-Saharan Africa",
    "South Asia", "East Asia", "Southeast Asia", "Americas",
]
AMBITION_VOCAB = ["beginner", "intermediate", "challenge"]


class PlaystyleEncoder(BaseEstimator, TransformerMixin):
    """Encodes a nation/query record into a numeric playstyle vector.

    Expects an iterable of dict-like records, each with:
      - playstyle_tags: list[str], any subset of TAG_VOCAB
      - macro_region: str, one of REGION_VOCAB
      - ambition: str, one of AMBITION_VOCAB

    Output columns: multi-hot(TAG_VOCAB) + one-hot(REGION_VOCAB) + one-hot(AMBITION_VOCAB).
    """

    def __init__(self, tag_vocab=None, region_vocab=None, ambition_vocab=None):
        self.tag_vocab = tag_vocab if tag_vocab is not None else TAG_VOCAB
        self.region_vocab = region_vocab if region_vocab is not None else REGION_VOCAB
        self.ambition_vocab = ambition_vocab if ambition_vocab is not None else AMBITION_VOCAB

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        rows = []
        for record in X:
            tags = set(record["playstyle_tags"])
            tag_vec = [1.0 if t in tags else 0.0 for t in self.tag_vocab]
            region_vec = [1.0 if record["macro_region"] == r else 0.0 for r in self.region_vocab]
            ambition_vec = [1.0 if record["ambition"] == a else 0.0 for a in self.ambition_vocab]
            rows.append(tag_vec + region_vec + ambition_vec)
        return np.array(rows, dtype=float)

    def get_feature_names_out(self, input_features=None):
        return np.array(
            [f"tag:{t}" for t in self.tag_vocab]
            + [f"region:{r}" for r in self.region_vocab]
            + [f"ambition:{a}" for a in self.ambition_vocab]
        )
