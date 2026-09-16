import modal

image = (
    modal.Image.debian_slim()
    .pip_install("fastapi", "scikit-learn==1.9.1", "joblib", "pydantic")
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
