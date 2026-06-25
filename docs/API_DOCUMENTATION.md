<h1 align="center">API Documentation<h1>

Base URL:

```text
http://127.0.0.1:8000
```

All endpoints are used for market reference data, synthetic order generation, matching simulation, and dashboard result retrieval. The system does not place real trades.

## GET /health

### Description

Checks whether the FastAPI backend is running.

### Request

No request body is required.

### Response

Returns backend service status.

### Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 | Backend is running |

### Example JSON

```json
{
  "status": "ok",
  "service": "order-matching-engine"
}
```

## GET /market-price/{symbol}

### Description

Fetches live market quote data for the provided symbol using Finnhub. This endpoint is for market reference only. It does not generate orders and does not execute trades.

### Request

Path parameter:

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| symbol | string | Yes | Market symbol such as `AAPL` |

Request body is not required.

### Response

Returns live quote values when successful.

### Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 | Request processed successfully |

Application-level failures are returned with `success: false`.

Possible failure cases:

- Missing `FINNHUB_API_KEY`
- Invalid symbol format
- Finnhub API/network error
- No quote found for symbol

### Example JSON

Success:

```json
{
  "success": true,
  "symbol": "AAPL",
  "price": 201.25,
  "change": 2.7,
  "change_percent": 1.35,
  "high": 202.1,
  "low": 198.9,
  "open": 199.0,
  "previous_close": 198.55
}
```

Error:

```json
{
  "success": false,
  "symbol": "AAPL",
  "message": "FINNHUB_API_KEY is missing in backend/.env."
}
```

## POST /generate-market-orders

### Description

Generates synthetic buy and sell orders around a live market reference price and writes them to:

```text
engine/data/orders_large.csv
```

This endpoint generates simulated orders only. It does not place real trades.

### Request

Request body:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| symbol | string | Yes | Market symbol used for labeling the generated order set |
| base_price | number | Yes | Live price used as the center price for synthetic order generation |
| count | integer | No | Number of orders to generate. Defaults to `10000` |

Generation rules:

- BUY prices are generated between `base_price - 1.00` and `base_price + 0.20`
- SELL prices are generated between `base_price - 0.20` and `base_price + 1.00`
- Quantity is generated between `1` and `1000`
- Side is randomly selected as `B` or `S`

### Response

Returns generation status and output file path.

### Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 | Request processed successfully |
| 422 | Request body validation failed |

Application-level failures are returned with `success: false`.

Possible failure cases:

- Invalid symbol
- Invalid `base_price`
- Invalid `count`
- File write error

### Example JSON

Request:

```json
{
  "symbol": "AAPL",
  "base_price": 201.25,
  "count": 10000
}
```

Success:

```json
{
  "success": true,
  "symbol": "AAPL",
  "base_price": 201.25,
  "orders_generated": 10000,
  "file": "engine/data/orders_large.csv"
}
```

Error:

```json
{
  "success": false,
  "message": "Invalid base_price. It must be greater than 0."
}
```

## POST /run-engine

### Description

Runs the compiled C17 matching engine executable. The engine reads:

```text
engine/data/orders_large.csv
```

Then it matches simulated orders, writes trade history, writes benchmark metrics, and writes an order book snapshot.

### Request

No request body is required.

### Response

Returns engine execution status, return code, parsed summary metrics, captured standard output, and captured error output.

### Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 | Request processed successfully |

Application-level failures are returned with `status: "error"` and/or `success: false`.

Possible failure cases:

- Compiled executable missing
- Engine execution timeout
- OS execution error
- Non-zero C process return code

### Example JSON

Success:

```json
{
  "status": "success",
  "success": true,
  "return_code": 0,
  "summary": {
    "orders_loaded": "10000",
    "orders_processed": "10000",
    "execution_time_ms": "86.000",
    "throughput_ops_sec": "116279.070",
    "avg_latency_us": "8.600"
  },
  "output": "Orders Loaded: 10000\n...",
  "error": ""
}
```

Error:

```json
{
  "status": "error",
  "success": false,
  "message": "Compiled engine executable not found. Compile the C engine first.",
  "expected_path": "C:\\Users\\gagan\\OneDrive\\Desktop\\OrderMatchingEngine\\engine\\order_matching_engine.exe"
}
```

## GET /benchmark

### Description

Returns the latest benchmark metrics from:

```text
engine/benchmark/benchmark.csv
```

### Request

No request body is required.

### Response

Returns the latest benchmark row when available.

### Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 | Request processed successfully |

Application-level failures are returned with `success: false`.

Possible failure cases:

- Benchmark CSV does not exist
- Benchmark CSV exists but contains no rows

### Example JSON

Success:

```json
{
  "orders_processed": "10000",
  "execution_time_ms": "86.000",
  "throughput_ops_sec": "116279.070",
  "avg_latency_us": "8.600"
}
```

Error:

```json
{
  "success": false,
  "message": "Benchmark CSV not found. Run /run-engine first.",
  "expected_path": "C:\\Users\\gagan\\OneDrive\\Desktop\\OrderMatchingEngine\\engine\\benchmark\\benchmark.csv"
}
```

## GET /trades

### Description

Returns the simulated trade history from:

```text
engine/data/trades.csv
```

### Request

No request body is required.

### Response

Returns an array of trade rows when available.

### Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 | Request processed successfully |

Application-level failures are returned with `success: false`.

Possible failure cases:

- Trades CSV does not exist

### Example JSON

Success:

```json
[
  {
    "trade_id": "1",
    "buy_order_id": "10",
    "sell_order_id": "11",
    "price": "100.00",
    "quantity": "50"
  },
  {
    "trade_id": "2",
    "buy_order_id": "12",
    "sell_order_id": "13",
    "price": "100.00",
    "quantity": "10"
  }
]
```

Error:

```json
{
  "success": false,
  "message": "Trades CSV not found. Run /run-engine first.",
  "expected_path": "C:\\Users\\gagan\\OneDrive\\Desktop\\OrderMatchingEngine\\engine\\data\\trades.csv",
  "trades": []
}
```

## GET /order-book

### Description

Returns the latest order book snapshot. The preferred snapshot source is:

```text
engine/data/order_book_snapshot.json
```

If JSON is not available, the backend can fall back to CSV or text snapshot files.

### Request

No request body is required.

### Response

Returns the order book snapshot with buy and sell orders when available.

### Status Codes

| Status Code | Meaning |
| --- | --- |
| 200 | Request processed successfully |

Application-level failures are returned with `success: false`.

Possible failure cases:

- No order book snapshot file exists

### Example JSON

Success:

```json
{
  "success": true,
  "format": "json",
  "snapshot": {
    "buy_count": 2509,
    "sell_count": 2574,
    "buy_orders": [
      {
        "order_id": 7652,
        "price": 99.89,
        "quantity": 64
      }
    ],
    "sell_orders": [
      {
        "order_id": 3637,
        "price": 99.9,
        "quantity": 74
      }
    ]
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Order book snapshot file does not exist yet.",
  "expected_paths": [
    "C:\\Users\\gagan\\OneDrive\\Desktop\\OrderMatchingEngine\\engine\\data\\order_book_snapshot.json",
    "C:\\Users\\gagan\\OneDrive\\Desktop\\OrderMatchingEngine\\engine\\data\\order_book_snapshot.csv",
    "C:\\Users\\gagan\\OneDrive\\Desktop\\OrderMatchingEngine\\engine\\data\\order_book_snapshot.txt"
  ]
}
```

