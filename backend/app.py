from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.engine import router as engine_router


app = FastAPI(
    title="Order Matching Engine API",
    description="REST API for the high-performance C order matching engine.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(engine_router)
