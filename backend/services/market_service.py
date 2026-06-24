"""Market data helpers for display-only live quote lookups."""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
FINNHUB_QUOTE_URL = "https://finnhub.io/api/v1/quote"
SYMBOL_PATTERN = re.compile(r"^[A-Za-z][A-Za-z0-9.-]{0,19}$")

load_dotenv(BACKEND_DIR / ".env")


def _normalize_symbol(symbol: str) -> str | None:
    normalized = symbol.strip().upper()
    if not normalized or not SYMBOL_PATTERN.fullmatch(normalized):
        return None

    return normalized


def get_market_price(symbol: str) -> dict[str, Any]:
    normalized_symbol = _normalize_symbol(symbol)
    if normalized_symbol is None:
        return {
            "success": False,
            "symbol": symbol,
            "message": "Invalid symbol. Use letters, numbers, dots, or hyphens.",
        }

    api_key = os.getenv("FINNHUB_API_KEY", "").strip()
    if not api_key:
        return {
            "success": False,
            "symbol": normalized_symbol,
            "message": "FINNHUB_API_KEY is missing in backend/.env.",
        }

    try:
        response = requests.get(
            FINNHUB_QUOTE_URL,
            params={"symbol": normalized_symbol, "token": api_key},
            timeout=10,
        )
        response.raise_for_status()
        quote = response.json()
    except requests.RequestException as exc:
        return {
            "success": False,
            "symbol": normalized_symbol,
            "message": "Failed to fetch market price from Finnhub.",
            "error": str(exc),
        }
    except ValueError:
        return {
            "success": False,
            "symbol": normalized_symbol,
            "message": "Finnhub returned an invalid JSON response.",
        }

    current_price = quote.get("c")
    if not isinstance(current_price, (int, float)) or current_price <= 0:
        return {
            "success": False,
            "symbol": normalized_symbol,
            "message": "No live quote found for this symbol.",
        }

    return {
        "success": True,
        "symbol": normalized_symbol,
        "price": current_price,
        "change": quote.get("d"),
        "change_percent": quote.get("dp"),
        "high": quote.get("h"),
        "low": quote.get("l"),
        "open": quote.get("o"),
        "previous_close": quote.get("pc"),
    }
