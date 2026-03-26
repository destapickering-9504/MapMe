from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.geocode_suggest import router as geocode_suggest_router
from app.api.optimize import router as optimize_router

app = FastAPI(title="Route Optimizer API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(optimize_router)
app.include_router(geocode_suggest_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
