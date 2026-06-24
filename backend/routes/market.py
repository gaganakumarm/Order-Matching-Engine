from fastapi import APIRouter

from services.market_service import get_market_price


router = APIRouter(tags=["market"])


@router.get("/market-price/{symbol}")
def market_price(symbol: str) -> dict:
    return get_market_price(symbol)
