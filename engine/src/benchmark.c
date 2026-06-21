#include <stdio.h>
#include <time.h>

#include "benchmark.h"
#include "matching.h"

#define BENCHMARK_CSV_PATH "benchmark/benchmark.csv"

static void writeBenchmarkResultCsv(BenchmarkResult result) {
    FILE *file = fopen(BENCHMARK_CSV_PATH, "w");

    if (file == NULL) {
        return;
    }

    fputs("orders_processed,execution_time_ms,throughput_ops_sec,avg_latency_us\n", file);
    fprintf(file, "%d,%.3f,%.3f,%.3f\n",
            result.orders_processed,
            result.execution_time_ms,
            result.throughput_ops_sec,
            result.avg_latency_us);

    fclose(file);
}

BenchmarkResult runBenchmark(OrderBook *book) {
    BenchmarkResult result;
    clock_t start_time;
    clock_t end_time;
    double elapsed_seconds;
    double safe_elapsed_seconds;

    result.orders_processed = 0;
    result.execution_time_ms = 0.0;
    result.throughput_ops_sec = 0.0;
    result.avg_latency_us = 0.0;

    if (book == NULL) {
        writeBenchmarkResultCsv(result);
        return result;
    }

    result.orders_processed = book->buy_count + book->sell_count;

    start_time = clock();
    processMatches(book);
    end_time = clock();

    elapsed_seconds = (double)(end_time - start_time) / CLOCKS_PER_SEC;
    result.execution_time_ms = elapsed_seconds * 1000.0;
    safe_elapsed_seconds = (elapsed_seconds > 0.0) ? elapsed_seconds : 0.0;

    if (safe_elapsed_seconds > 0.0) {
        result.throughput_ops_sec = (double)result.orders_processed / safe_elapsed_seconds;
    }

    if (result.orders_processed > 0 && result.execution_time_ms > 0.0) {
        result.avg_latency_us = (result.execution_time_ms * 1000.0) / (double)result.orders_processed;
    }

    writeBenchmarkResultCsv(result);
    return result;
}