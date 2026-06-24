from fastapi import FastAPI

from routes.engine import router as engine_router


app = FastAPI(
    title="Order Matching Engine API",
    description="REST API for the high-performance C order matching engine.",
    version="0.1.0",
)

app.include_router(engine_router)
