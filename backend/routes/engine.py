from fastapi import APIRouter

from services.engine_service import (
    get_latest_benchmark,
    get_order_book_snapshot,
    get_trades,
    run_engine,
)


router = APIRouter(tags=["engine"])


@router.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "order-matching-engine",
    }


@router.post("/run-engine")
def run_matching_engine() -> dict:
    result = run_engine()
    status = "success" if result.get("success") else "error"

    return {
        "status": status,
        **result,
    }


@router.get("/benchmark")
def benchmark() -> dict:
    result = get_latest_benchmark()
    if result.get("success"):
        return result["benchmark"]

    return result


@router.get("/trades")
def trades() -> list[dict] | dict:
    result = get_trades()
    if result.get("success"):
        return result["trades"]

    return result


@router.get("/order-book")
def order_book() -> dict:
    return get_order_book_snapshot()
