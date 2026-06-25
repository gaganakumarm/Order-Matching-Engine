<h1 align="center">Software Requirements Specification</h1>

## Introduction

### Purpose

This Software Requirements Specification (SRS) defines the requirements for the High-Performance Order Matching Engine project. The system provides a simulation-only trading environment where users can fetch live market reference prices, generate synthetic orders around those prices, execute a C17 price-time priority matching engine, and view the resulting trades, benchmarks, and order book snapshots through a React dashboard.

### Scope

The project includes:

- A C17 order matching engine.
- A FastAPI backend for orchestration and APIs.
- A React frontend dashboard.
- Finnhub live market quote integration.
- Market-based synthetic order generation.
- Benchmark, trade log, and order book visualization.

The project does not place real trades, connect to broker APIs, or execute financial transactions.

### Intended Users

- Students learning market infrastructure.
- Developers studying order matching engines.
- Reviewers evaluating system architecture and performance.
- Users who want to simulate market order flow safely.

## Overall Description

### Product Perspective

The system is a full-stack application built around a file-driven C matching engine. The backend acts as the bridge between the frontend, Finnhub, generated CSV orders, and C engine output files.

### Product Functions

- Fetch live quote data for a stock symbol.
- Generate synthetic orders using the live quote as the center price.
- Run the compiled C17 matching engine.
- Display benchmark metrics.
- Display generated trades.
- Display buy/sell order book snapshots.
- Reset dashboard state.

### User Classes

| User Class | Description |
| --- | --- |
| End User | Uses the dashboard to fetch prices and run simulations. |
| Developer | Maintains frontend, backend, and C engine code. |
| Evaluator | Reviews architecture, results, and benchmark performance. |

### Operating Environment

- Windows development environment.
- GCC for compiling the C engine.
- Python with FastAPI backend.
- Node.js with React/Vite frontend.
- Browser access to the dashboard.

## Functional Requirements

### FR-1: Fetch Live Market Price

The system shall allow the user to enter a market symbol and fetch live quote data from Finnhub.

Response data shall include:

- Symbol
- Current price
- Change
- Change percentage
- High
- Low
- Open
- Previous close

### FR-2: Display Live Market Reference

The frontend shall display live market information in a dedicated Live Market Reference panel.

The panel shall clearly state that no orders are generated and no trades are executed during this step.

### FR-3: Generate Market-Based Synthetic Orders

The backend shall generate `engine/data/orders_large.csv` using the fetched live market price as the base price.

Order generation rules:

- BUY prices between `base_price - 1.00` and `base_price + 0.20`
- SELL prices between `base_price - 0.20` and `base_price + 1.00`
- Quantity between `1` and `1000`
- Side randomly selected as `B` or `S`
- Default count: `10000`

### FR-4: Run Matching Engine

The system shall run the compiled C17 engine when the user clicks `Run Market Simulation`.

The engine shall:

- Load `engine/data/orders_large.csv`
- Match orders using price-time priority
- Generate trades
- Generate benchmark metrics
- Generate an order book snapshot

### FR-5: Display Simulation Results

The frontend shall display:

- Trades generated
- Execution time
- Throughput
- Average latency
- Spread
- Buy orders
- Sell orders
- Trade log
- Benchmark history

### FR-6: Reset Dashboard

The system shall allow users to reset dashboard state to default values without changing backend files.

### FR-7: API Health Check

The backend shall provide a health check endpoint returning service status.

## Non-functional Requirements

### NFR-1: Performance

The C engine should process 10,000 orders efficiently and produce benchmark metrics including execution time, throughput, and average latency.

### NFR-2: Reliability

The backend shall handle:

- Missing Finnhub API key
- Invalid symbols
- Invalid base price
- Invalid order count
- Finnhub API/network errors
- Missing generated files
- C engine execution errors

### NFR-3: Usability

The frontend shall use a clear trading-terminal style interface and separate live market reference data from simulated engine output.

### NFR-4: Security

The Finnhub API key shall be loaded from `backend/.env` and shall not be hardcoded in source code.

### NFR-5: Maintainability

The system shall keep responsibilities separated:

- C engine handles matching.
- FastAPI handles orchestration and data access.
- React handles presentation and user interaction.

### NFR-6: Safety

The system shall not place real trades, call broker APIs, or execute financial transactions.

## Use Cases

### Use Case 1: Fetch Live Price

| Field | Description |
| --- | --- |
| Actor | User |
| Precondition | Backend is running and Finnhub API key is configured. |
| Trigger | User enters a symbol and clicks `Fetch Live Price`. |
| Main Flow | Frontend calls `/market-price/{symbol}` and displays quote data. |
| Postcondition | Live Market Reference panel is updated. |
| Exception | Missing API key or invalid symbol returns an error message. |

### Use Case 2: Run Market Simulation

| Field | Description |
| --- | --- |
| Actor | User |
| Precondition | Backend, frontend, and compiled C engine are available. |
| Trigger | User clicks `Run Market Simulation`. |
| Main Flow | System fetches price if needed, generates orders, runs engine, and refreshes dashboard. |
| Postcondition | Simulation results are visible in the dashboard. |
| Exception | Engine or API failure displays an error message. |

### Use Case 3: Reset Dashboard

| Field | Description |
| --- | --- |
| Actor | User |
| Precondition | Dashboard is open. |
| Trigger | User clicks `Reset`. |
| Main Flow | Frontend clears local dashboard state. |
| Postcondition | UI returns to default display state. |

## User Flow

![User Flow](diagrams/userflow.png)

### Step-by-step Explanation

1. Open Dashboard

   The user opens the React dashboard in the browser. The dashboard displays the trading terminal interface, including controls for fetching live price data and running the market simulation.

2. Enter Symbol

   The user enters a stock symbol such as `AAPL`. This symbol is used only to fetch live market reference data from Finnhub.

3. Fetch Live Price

   When the user clicks `Fetch Live Price`, the frontend calls the FastAPI endpoint `/market-price/{symbol}`. The backend reads the Finnhub API key from `backend/.env`, requests the quote from Finnhub, and returns the latest market reference values to the frontend.

4. View Live Market Reference

   The dashboard displays the symbol, current price, change percentage, high, low, and source. At this stage, no synthetic orders are generated and no trades are executed.

5. Run Market Simulation

   When the user clicks `Run Market Simulation`, the frontend uses the fetched live price. If the live price is not already available, the system fetches it first.

6. Generate Synthetic Orders

   The backend uses the live price as the base price and generates simulated buy and sell orders. The generated orders are saved to `engine/data/orders_large.csv`. These orders are artificial and are used only for simulation.

7. Run C17 Matching Engine

   The backend runs the compiled C17 executable. The engine reads `engine/data/orders_large.csv`, applies price-time priority matching, executes simulated trades, and writes output files:

   - `engine/data/trades.csv`
   - `engine/benchmark/benchmark.csv`
   - `engine/data/order_book_snapshot.json`

8. Refresh Benchmark, Trades, and Order Book

   After the engine completes, the frontend requests the latest benchmark metrics, trade history, and order book snapshot from the backend using `/benchmark`, `/trades`, and `/order-book`.

9. View Simulation Results

   The dashboard updates the KPI cards, trade log, order book, benchmark history, and simulation status badge. The user can review performance and matching results without any real trade execution.

## Constraints

- The C engine must be compiled before `/run-engine` can execute successfully.
- The backend must run from the `backend` directory because routes and services use local imports.
- Finnhub live quote fetching requires a valid `FINNHUB_API_KEY`.
- The system uses generated CSV and JSON files for engine input/output.
- The simulation depends on `engine/data/orders_large.csv`.
- The system is simulation-only and must not execute real trades.
- Network access is required for live Finnhub quote fetching.

## Acceptance Criteria

- The user can fetch a live price for a valid symbol.
- The dashboard displays a `LIVE DATA MODE ACTIVE` badge after successful price fetch.
- The user can run market simulation with or without manually fetching price first.
- The backend generates `engine/data/orders_large.csv` using live price as the base price.
- The C engine runs successfully and produces benchmark, trade, and order book files.
- The dashboard displays `SIMULATION COMPLETED` after a successful simulation.
- Trades, benchmark metrics, and order book rows appear after simulation.
- The reset button clears dashboard state.
- Missing API key, invalid symbol, invalid price, and engine errors show clear error messages.
- The system never places real trades or calls broker APIs.
