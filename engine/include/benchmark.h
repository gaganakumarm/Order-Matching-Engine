#ifndef BENCHMARK_H
#define BENCHMARK_H

#include "order_book.h"

typedef struct
{
    int orders_processed;
    double execution_time_ms;
    double throughput_ops_sec;
    double avg_latency_us;
} BenchmarkResult;

BenchmarkResult runBenchmark(OrderBook *book);

#endif /* BENCHMARK_H */