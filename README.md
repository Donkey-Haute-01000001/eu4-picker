# EU4 Playstyle Recommender

A nearest-neighbor recommender that matches a desired *Europa Universalis IV* playstyle to one of 49 starting nations. Instead of predicting a label, it encodes a query (playstyle tags, region, ambition) with the same custom transformer used to fit the 49 nations, then returns the 5 closest matches by scaled Euclidean distance. The pipeline's custom step, `PlaystyleEncoder` (`pipeline_def.py`), multi-hot encodes playstyle tags (tall/wide, military/naval/trade/diplomatic/colonial, plus infantry/cavalry/quality/quantity) and one-hot encodes macro-region and ambition; it's stateless, so the pipeline's real fitted state lives entirely in the following `StandardScaler`, which only exists because it was fit on these specific 49 nations. Built with scikit-learn 1.9.1.

## Live URLs

- **Modal API**: https://donkey-haute-01000001--assignment4-pipeline-fastapi-app.modal.run
- **API docs (Swagger UI)**: https://donkey-haute-01000001--assignment4-pipeline-fastapi-app.modal.run/docs
- **Frontend (Vercel)**: https://frontend-pink-two-46.vercel.app
- **Repo**: https://github.com/Donkey-Haute-01000001/eu4-picker

## API

- `GET /info` — pipeline metadata (nation count, sklearn version, tag/region/ambition vocab)
- `POST /recommend` — body: `{"playstyle_tags": string[], "macro_region": string, "ambition": string}` → top 5 nation matches
- `GET /nations/{tag}` — full profile for one nation (ruler stats, national idea scores, flagship idea)

## Repo layout

```
nations.json          # curated dataset: 49 nations, tags, ambition, region
pipeline_def.py        # PlaystyleEncoder custom transformer
build.py                # fits the pipeline + NearestNeighbors, writes pipeline.joblib
pipeline.joblib         # fitted bundle (rebuild with `python build.py`)
serve.py                # FastAPI app
modal_serve.py           # wraps serve.py for Modal deployment
requirements.txt        # pinned dependencies
postman_collection.json # GET /info, valid + invalid POST /recommend, run against the live API
frontend/               # Next.js app: painting hero + multi-step picker wizard
```

## Rebuilding locally

```
pip install -r requirements.txt
python build.py                          # writes pipeline.joblib
uvicorn serve:app --reload               # http://localhost:8000
```

```
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=<your local or deployed API URL>" > .env.local
npm run dev                              # http://localhost:3000
```
