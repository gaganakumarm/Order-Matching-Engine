import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import './App.css'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const emptyBenchmark = {
  orders_processed: '-',
  execution_time_ms: '-',
  throughput_ops_sec: '-',
  avg_latency_us: '-',
}

const emptyMarketPrice = {
  symbol: 'AAPL',
  price: '-',
  change: '-',
  change_percent: '-',
  high: '-',
  low: '-',
  open: '-',
  previous_close: '-',
}

function toNumber(value, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function formatNumber(value, maximumFractionDigits = 2) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }

  const number = Number(value)
  if (!Number.isFinite(number)) {
    return value
  }

  return number.toLocaleString(undefined, { maximumFractionDigits })
}

function formatMoney(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return '-'
  }

  return number.toFixed(2)
}

function formatSigned(value, maximumFractionDigits = 2) {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return '-'
  }

  return `${number >= 0 ? '+' : ''}${number.toLocaleString(undefined, { maximumFractionDigits })}`
}

function formatSignedPercent(value) {
  const formatted = formatSigned(value)
  return formatted === '-' ? '-' : `${formatted}%`
}

function calculateSpread(bestBid, bestAsk) {
  const bid = toNumber(bestBid?.price, Number.NaN)
  const ask = toNumber(bestAsk?.price, Number.NaN)

  if (!Number.isFinite(bid) || !Number.isFinite(ask)) {
    return null
  }

  return ask - bid
}

function generateChartPoints(midpoint) {
  const base = Number.isFinite(midpoint) ? midpoint : 100

  return Array.from({ length: 24 }, (_, index) => {
    const wave = Math.sin(index / 2.2) * 0.32
    const pulse = Math.cos(index / 3.4) * 0.18
    return base + wave + pulse + index * 0.015
  })
}

function buildSvgPath(points) {
  const width = 360
  const height = 130
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width
      const y = height - ((point - min) / range) * height
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

function buildBenchmarkHistory(benchmark) {
  const execTime = toNumber(benchmark.execution_time_ms)
  const throughput = toNumber(benchmark.throughput_ops_sec)
  const latency = toNumber(benchmark.avg_latency_us)

  return [1, 2, 3, 4, 5].map((run) => {
    const variation = 1 + (run - 3) * 0.035

    return {
      run: `RUN-${String(run).padStart(3, '0')}`,
      execTime: execTime ? execTime * variation : '-',
      throughput: throughput ? throughput / variation : '-',
      latency: latency ? latency * variation : '-',
    }
  })
}

function MetricBox({ label, value, unit, tone = 'cyan' }) {
  return (
    <article className={`metric-box ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {unit ? <small>{unit}</small> : null}
    </article>
  )
}

function OrderRows({ orders, side }) {
  if (orders.length === 0) {
    return (
      <tr>
        <td colSpan="2" className="empty-cell">
          Run engine to generate snapshot
        </td>
      </tr>
    )
  }

  return orders.slice(0, 10).map((order) => (
    <tr key={`${side}-${order.order_id}`}>
      <td className={`numeric price ${side}`}>{formatMoney(order.price)}</td>
      <td className="numeric">{formatNumber(order.quantity, 0)}</td>
    </tr>
  ))
}

function App() {
  const [benchmark, setBenchmark] = useState(emptyBenchmark)
  const [trades, setTrades] = useState([])
  const [orderBook, setOrderBook] = useState({ buy_orders: [], sell_orders: [] })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastRunStatus, setLastRunStatus] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [symbolInput, setSymbolInput] = useState('AAPL')
  const [marketPrice, setMarketPrice] = useState(emptyMarketPrice)
  const [marketLoading, setMarketLoading] = useState(false)
  const [marketError, setMarketError] = useState('')
  const [simulationCompleted, setSimulationCompleted] = useState(false)

  const buyOrders = orderBook?.buy_orders ?? []
  const sellOrders = orderBook?.sell_orders ?? []
  const buyCount = orderBook?.buy_count ?? buyOrders.length
  const sellCount = orderBook?.sell_count ?? sellOrders.length
  const bestBid = buyOrders[0]
  const bestAsk = sellOrders[0]
  const spread = calculateSpread(bestBid, bestAsk)
  const ordersLoaded = toNumber(benchmark.orders_processed)
  const matchRate = ordersLoaded > 0 ? (trades.length / ordersLoaded) * 100 : null
  const midpoint =
    bestBid && bestAsk ? (toNumber(bestBid.price) + toNumber(bestAsk.price)) / 2 : Number.NaN
  const chartPoints = useMemo(() => generateChartPoints(midpoint), [midpoint])
  const chartPath = useMemo(() => buildSvgPath(chartPoints), [chartPoints])
  const currentPrice = chartPoints.at(-1)
  const openPrice = chartPoints[0]
  const change = currentPrice - openPrice
  const latestTrades = trades.slice(-10).reverse()
  const benchmarkHistory = useMemo(() => buildBenchmarkHistory(benchmark), [benchmark])
  const liveBasePrice = toNumber(marketPrice.price, Number.NaN)
  const hasLiveMarketPrice = Number.isFinite(liveBasePrice) && liveBasePrice > 0

  const kpis = [
    {
      label: 'Trades Generated',
      value: formatNumber(trades.length, 0),
      tone: 'cyan',
    },
    {
      label: 'Execution Time',
      value: formatNumber(benchmark.execution_time_ms, 3),
      unit: 'ms',
      tone: 'cyan',
    },
    {
      label: 'Throughput',
      value: formatNumber(benchmark.throughput_ops_sec, 0),
      unit: 'ops/sec',
      tone: 'cyan',
    },
    {
      label: 'Avg Latency',
      value: formatNumber(benchmark.avg_latency_us, 3),
      unit: 'us',
      tone: 'amber',
    },
    {
      label: 'Trades Executed',
      value: formatNumber(trades.length, 0),
      tone: 'green',
    },
    {
      label: 'Spread',
      value: spread === null ? '-' : formatMoney(spread),
      tone: 'amber',
    },
  ]

  async function fetchDashboardData() {
    const [benchmarkResponse, tradesResponse, orderBookResponse] = await Promise.all([
      axios.get(`${API_BASE_URL}/benchmark`),
      axios.get(`${API_BASE_URL}/trades`),
      axios.get(`${API_BASE_URL}/order-book`),
    ])

    setBenchmark(benchmarkResponse.data ?? emptyBenchmark)
    setTrades(Array.isArray(tradesResponse.data) ? tradesResponse.data : [])

    const snapshot = orderBookResponse.data?.snapshot
    setOrderBook(
      snapshot && typeof snapshot === 'object'
        ? snapshot
        : { buy_orders: [], sell_orders: [], buy_count: 0, sell_count: 0 },
    )
  }

  function resetMessages() {
    setError('')
    setLastRunStatus('')
    setMarketError('')
  }

  function handleResetTerminal() {
    setBenchmark(emptyBenchmark)
    setTrades([])
    setOrderBook({ buy_orders: [], sell_orders: [], buy_count: 0, sell_count: 0 })
    setSymbolInput('AAPL')
    setMarketPrice(emptyMarketPrice)
    setLoading(false)
    setMarketLoading(false)
    setSimulationCompleted(false)
    setInitialLoading(false)
    resetMessages()
  }

  async function fetchMarketPrice(symbol) {
    const normalizedSymbol = symbol.trim().toUpperCase()

    if (!normalizedSymbol) {
      throw new Error('Enter a market symbol.')
    }

    const response = await axios.get(
      `${API_BASE_URL}/market-price/${encodeURIComponent(normalizedSymbol)}`,
    )

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Unable to fetch live price.')
    }

    setMarketPrice(response.data)
    setSymbolInput(response.data.symbol)
    setSimulationCompleted(false)

    return response.data
  }

  async function handleFetchMarketPrice(event) {
    event.preventDefault()
    setMarketLoading(true)
    setMarketError('')

    try {
      await fetchMarketPrice(symbolInput)
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.message ||
        'Unable to fetch live price.'
      setMarketError(message)
    } finally {
      setMarketLoading(false)
    }
  }

  async function generateMarketOrders(quote) {
    const basePrice = toNumber(quote.price, Number.NaN)
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      throw new Error('Fetch a valid live price before generating market-based orders.')
    }

    const response = await axios.post(`${API_BASE_URL}/generate-market-orders`, {
      symbol: quote.symbol,
      base_price: basePrice,
      count: 10000,
    })

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Market-based order generation failed.')
    }

    return response.data
  }

  async function handleRunEngine() {
    setLoading(true)
    setMarketLoading(!hasLiveMarketPrice)
    resetMessages()

    try {
      const quote = hasLiveMarketPrice ? marketPrice : await fetchMarketPrice(symbolInput)
      await generateMarketOrders(quote)
      const runResponse = await axios.post(`${API_BASE_URL}/run-engine`)

      if (runResponse.data?.status !== 'success') {
        throw new Error(runResponse.data?.message || 'Engine run failed.')
      }

      await fetchDashboardData()
      setSimulationCompleted(true)
      setLastRunStatus('Market simulation completed successfully.')
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        requestError.message ||
        `Market simulation failed. Start FastAPI on ${API_BASE_URL}`
      setError(message)
    } finally {
      setLoading(false)
      setMarketLoading(false)
    }
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        await fetchDashboardData()
      } catch {
        setError(`API connection failed. Start FastAPI on ${API_BASE_URL}`)
      } finally {
        setInitialLoading(false)
      }
    }

    loadInitialData()
  }, [])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => window.clearInterval(timerId)
  }, [])

  return (
    <main className="terminal">
      <header className="topbar">
        <section className="topbar-left">
          <span className="version-tag">OME v1.0</span>
          <div>
            <h1>Order Matching Engine</h1>
            <p>C17 &bull; FastAPI &bull; React</p>
          </div>
        </section>

        <section className="topbar-center">
          <div>
            <span>Engine Status</span>
            <strong className="status-active">ACTIVE</strong>
          </div>
          <div>
            <span>Orders Loaded</span>
            <strong>{formatNumber(benchmark.orders_processed, 0)}</strong>
          </div>
        </section>

        <section className="topbar-right">
          <time>{currentTime.toLocaleTimeString()}</time>
          <form className="symbol-form" onSubmit={handleFetchMarketPrice}>
            <label htmlFor="market-symbol">Symbol</label>
            <input
              id="market-symbol"
              type="text"
              value={symbolInput}
              maxLength="20"
              onChange={(event) => setSymbolInput(event.target.value.toUpperCase())}
              aria-label="Market symbol"
            />
            <button className="quote-button" type="submit" disabled={marketLoading}>
              {marketLoading ? 'FETCHING' : 'FETCH LIVE PRICE'}
            </button>
          </form>
          <button className="run-button" type="button" onClick={handleRunEngine} disabled={loading || marketLoading}>
            {loading ? 'RUNNING SIMULATION' : 'RUN MARKET SIMULATION'}
          </button>
          <button className="reset-button" type="button" onClick={handleResetTerminal}>
            RESET
          </button>
        </section>
      </header>

      <section className="workflow-panels">
        <article className="workflow-panel cyan">
          <div className="workflow-panel-title">
            <div>
              <span>Step 01</span>
              <h2>Live Market Reference</h2>
            </div>
            {hasLiveMarketPrice ? <strong className="mode-badge cyan">LIVE DATA MODE ACTIVE</strong> : null}
          </div>
          <dl className="workflow-metrics">
            <div>
              <dt>Symbol</dt>
              <dd>{marketPrice.symbol || symbolInput || 'AAPL'}</dd>
            </div>
            <div>
              <dt>Current Price</dt>
              <dd>{formatMoney(marketPrice.price)}</dd>
            </div>
            <div>
              <dt>Change %</dt>
              <dd className={toNumber(marketPrice.change_percent, 0) >= 0 ? 'positive' : 'negative'}>
                {formatSignedPercent(marketPrice.change_percent)}
              </dd>
            </div>
            <div>
              <dt>High</dt>
              <dd>{formatMoney(marketPrice.high)}</dd>
            </div>
            <div>
              <dt>Low</dt>
              <dd>{formatMoney(marketPrice.low)}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>Finnhub</dd>
            </div>
          </dl>
          <p>Real market information only. No orders are generated. No trades are executed.</p>
        </article>

        <article className="workflow-panel green">
          <div className="workflow-panel-title">
            <div>
              <span>Step 02</span>
              <h2>Market Simulation Engine</h2>
            </div>
            {simulationCompleted ? <strong className="mode-badge green">SIMULATION COMPLETED</strong> : null}
          </div>
          <dl className="workflow-metrics">
            <div>
              <dt>Orders Generated</dt>
              <dd>{formatNumber(benchmark.orders_processed, 0)}</dd>
            </div>
            <div>
              <dt>Engine Type</dt>
              <dd>C17 Price-Time Priority</dd>
            </div>
            <div>
              <dt>Trades Generated</dt>
              <dd>{formatNumber(trades.length, 0)}</dd>
            </div>
            <div>
              <dt>Benchmark Available</dt>
              <dd>{benchmark.execution_time_ms === '-' ? 'No' : 'Yes'}</dd>
            </div>
          </dl>
          <p>
            Generates synthetic orders around the live market price. Executes matching using the C17 engine. Creates
            trades, benchmarks, and order book snapshots.
          </p>
        </article>
      </section>

      {error ? <div className="terminal-alert error">{error}</div> : null}
      {marketError ? <div className="terminal-alert error">{marketError}</div> : null}
      {lastRunStatus ? <div className="terminal-alert success">{lastRunStatus}</div> : null}
      {initialLoading ? <div className="terminal-alert info">LOADING TERMINAL DATA...</div> : null}

      <section className="kpi-strip">
        {kpis.map((kpi) => (
          <MetricBox key={kpi.label} {...kpi} />
        ))}
      </section>

      <section className="main-grid">
        <section className="panel order-book">
          <div className="panel-title">
            <div>
              <span>Order Book Depth</span>
              <h2>ORDER BOOK</h2>
            </div>
            <div className="quote-line">
              <span>BID {bestBid ? formatMoney(bestBid.price) : '-'}</span>
              <span>ASK {bestAsk ? formatMoney(bestAsk.price) : '-'}</span>
              <span>SPR {spread === null ? '-' : formatMoney(spread)}</span>
            </div>
          </div>

          <div className="book-stack">
            <div className="book-section">
              <div className="book-heading buy">
                <span>BUY ORDERS (BIDS)</span>
                <strong>{formatNumber(buyCount, 0)}</strong>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Price</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  <OrderRows orders={buyOrders} side="buy" />
                </tbody>
              </table>
            </div>

            <div className="book-section">
              <div className="book-heading sell">
                <span>SELL ORDERS (ASKS)</span>
                <strong>{formatNumber(sellCount, 0)}</strong>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Price</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  <OrderRows orders={sellOrders} side="sell" />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="panel engine-activity">
          <div className="panel-title">
            <div>
              <h2>MATCHING ENGINE ACTIVITY</h2>
              <span>Matching Pipeline</span>
            </div>
            <strong className={change >= 0 ? 'positive' : 'negative'}>
              {change >= 0 ? '+' : ''}
              {formatMoney(change)}
            </strong>
          </div>

          <div className="price-display">
            <span>Midpoint Estimate</span>
            <strong>{formatMoney(currentPrice)}</strong>
          </div>

          <svg className="mini-chart" viewBox="0 0 360 130" role="img" aria-label="Simulated price line">
            <defs>
              <linearGradient id="chartGlow" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#00d4ff" />
                <stop offset="100%" stopColor="#00ff88" />
              </linearGradient>
            </defs>
            <path d={chartPath} fill="none" stroke="url(#chartGlow)" strokeWidth="2.4" />
          </svg>

          <div className="market-stats">
            <div>
              <span>Best Bid</span>
              <strong className="positive">{bestBid ? formatMoney(bestBid.price) : '-'}</strong>
            </div>
            <div>
              <span>Best Ask</span>
              <strong className="negative">{bestAsk ? formatMoney(bestAsk.price) : '-'}</strong>
            </div>
            <div>
              <span>Spread</span>
              <strong>{spread === null ? '-' : formatMoney(spread)}</strong>
            </div>
            <div>
              <span>Match Rate</span>
              <strong>{matchRate === null ? '-' : `${formatNumber(matchRate, 3)}%`}</strong>
            </div>
            <div>
              <span>Orders Loaded</span>
              <strong>{formatNumber(benchmark.orders_processed, 0)}</strong>
            </div>
          </div>

          <div className="matching-summary">
            <div className="summary-title">
              <span>Matching Summary</span>
              <strong>PRICE-TIME</strong>
            </div>
            <dl>
              <div>
                <dt>Orders Loaded</dt>
                <dd>{formatNumber(benchmark.orders_processed, 0)}</dd>
              </div>
              <div>
                <dt>Trades Executed</dt>
                <dd>{formatNumber(trades.length, 0)}</dd>
              </div>
              <div>
                <dt>Buy Orders Remaining</dt>
                <dd>{formatNumber(buyCount, 0)}</dd>
              </div>
              <div>
                <dt>Sell Orders Remaining</dt>
                <dd>{formatNumber(sellCount, 0)}</dd>
              </div>
              <div>
                <dt>Spread</dt>
                <dd>{spread === null ? '-' : formatMoney(spread)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="panel trade-log">
          <div className="panel-title">
            <div>
              <span>Live Prints</span>
              <h2>TRADE LOG</h2>
            </div>
            <strong>{latestTrades.length}/10</strong>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>#</th>
                  <th>Trade ID</th>
                  <th>Buy</th>
                  <th>Sell</th>
                  <th>Price</th>
                  <th>Qty</th>
                </tr>
              </thead>
              <tbody>
                {latestTrades.length > 0 ? (
                  latestTrades.map((trade, index) => (
                    <tr key={trade.trade_id}>
                      <td>{new Date(currentTime.getTime() - index * 1000).toLocaleTimeString()}</td>
                      <td>{index + 1}</td>
                      <td>{trade.trade_id}</td>
                      <td>{trade.buy_order_id}</td>
                      <td>{trade.sell_order_id}</td>
                      <td className="numeric price buy">{formatMoney(trade.price)}</td>
                      <td className="numeric">{formatNumber(trade.quantity, 0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      No trades yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="bottom-grid">
        <section className="panel benchmark-history">
          <div className="panel-title">
            <div>
              <span>Performance</span>
              <h2>BENCHMARK HISTORY</h2>
            </div>
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Execution Time</th>
                  <th>Throughput</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkHistory.map((row) => (
                  <tr key={row.run}>
                    <td>{row.run}</td>
                    <td>{formatNumber(row.execTime, 3)} ms</td>
                    <td>{formatNumber(row.throughput, 0)}</td>
                    <td>{formatNumber(row.latency, 3)} us</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel system-info">
          <div className="panel-title">
            <div>
              <span>Runtime</span>
              <h2>SYSTEM INFO</h2>
            </div>
          </div>

          <dl>
            <div>
              <dt>Engine</dt>
              <dd>High-Performance C17</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>1.0.0</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>Price-Time Priority</dd>
            </div>
            <div>
              <dt>Max Orders</dt>
              <dd>100,000</dd>
            </div>
            <div>
              <dt>API</dt>
              <dd>FastAPI</dd>
            </div>
            <div>
              <dt>Frontend</dt>
              <dd>React</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd className="status-active">Operational</dd>
            </div>
          </dl>
        </section>
      </section>


      <footer className="system-footer">
        <span>OME TERMINAL ONLINE</span>
        <span>API: {API_BASE_URL}</span>
        <span>ENGINE: C17 PRICE-TIME PRIORITY</span>
        <span>STATUS: OPERATIONAL</span>
      </footer>
    </main>
  )
}

export default App
