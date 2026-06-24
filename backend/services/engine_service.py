"""Service helpers for integrating FastAPI with the C matching engine."""

from __future__ import annotations

import csv
import re
import subprocess
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]
ENGINE_DIR = PROJECT_ROOT / "engine"
ENGINE_EXE = ENGINE_DIR / "order_matching_engine.exe"
BENCHMARK_CSV = ENGINE_DIR / "benchmark" / "benchmark.csv"
TRADES_CSV = ENGINE_DIR / "data" / "trades.csv"
NESTED_TRADES_CSV = ENGINE_DIR / "engine" / "data" / "trades.csv"
ORDER_BOOK_SNAPSHOT_CSV = ENGINE_DIR / "data" / "order_book_snapshot.csv"
ORDER_BOOK_SNAPSHOT_TXT = ENGINE_DIR / "data" / "order_book_snapshot.txt"


def _read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as csv_file:
        return list(csv.DictReader(csv_file))


def _parse_engine_summary(output: str) -> dict[str, str]:
    summary_fields = {
        "Orders Loaded": "orders_loaded",
        "Orders Processed": "orders_processed",
        "Execution Time (ms)": "execution_time_ms",
        "Throughput (ops/sec)": "throughput_ops_sec",
        "Average Latency (us)": "avg_latency_us",
    }
    summary: dict[str, str] = {}

    for label, key in summary_fields.items():
        match = re.search(rf"{re.escape(label)}:\s*([^\r\n]+)", output)
        if match:
            summary[key] = match.group(1).strip()

    return summary


def _sync_trade_csv_if_needed() -> None:
    """Mirror the C engine's nested trade CSV path into engine/data if needed."""
    if NESTED_TRADES_CSV.exists():
        TRADES_CSV.parent.mkdir(parents=True, exist_ok=True)
        TRADES_CSV.write_text(NESTED_TRADES_CSV.read_text(encoding="utf-8"), encoding="utf-8")


def run_engine() -> dict[str, Any]:
    if not ENGINE_EXE.exists():
        return {
            "success": False,
            "message": "Compiled engine executable not found. Compile the C engine first.",
            "expected_path": str(ENGINE_EXE),
        }

    try:
        result = subprocess.run(
            [str(ENGINE_EXE)],
            cwd=ENGINE_DIR,
            capture_output=True,
            text=True,
            timeout=60,
            check=False,
        )
        _sync_trade_csv_if_needed()

        return {
            "success": result.returncode == 0,
            "return_code": result.returncode,
            "summary": _parse_engine_summary(result.stdout),
            "output": result.stdout,
            "error": result.stderr,
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "message": "Engine execution timed out.",
        }
    except OSError as exc:
        return {
            "success": False,
            "message": "Failed to execute engine.",
            "error": str(exc),
        }


def get_latest_benchmark() -> dict[str, Any]:
    if not BENCHMARK_CSV.exists():
        return {
            "success": False,
            "message": "Benchmark CSV not found. Run /run-engine first.",
            "expected_path": str(BENCHMARK_CSV),
        }

    rows = _read_csv_rows(BENCHMARK_CSV)
    if not rows:
        return {
            "success": False,
            "message": "Benchmark CSV exists but has no benchmark rows.",
        }

    return {
        "success": True,
        "benchmark": rows[-1],
    }


def get_trades() -> dict[str, Any]:
    _sync_trade_csv_if_needed()

    if not TRADES_CSV.exists():
        return {
            "success": False,
            "message": "Trades CSV not found. Run /run-engine first.",
            "expected_path": str(TRADES_CSV),
            "trades": [],
        }

    return {
        "success": True,
        "trades": _read_csv_rows(TRADES_CSV),
    }


def get_order_book_snapshot() -> dict[str, Any]:
    if ORDER_BOOK_SNAPSHOT_CSV.exists():
        return {
            "success": True,
            "format": "csv",
            "snapshot": _read_csv_rows(ORDER_BOOK_SNAPSHOT_CSV),
        }

    if ORDER_BOOK_SNAPSHOT_TXT.exists():
        return {
            "success": True,
            "format": "text",
            "snapshot": ORDER_BOOK_SNAPSHOT_TXT.read_text(encoding="utf-8"),
        }

    return {
        "success": False,
        "message": "Order book snapshot file does not exist yet.",
        "expected_paths": [
            str(ORDER_BOOK_SNAPSHOT_CSV),
            str(ORDER_BOOK_SNAPSHOT_TXT),
        ],
    }
