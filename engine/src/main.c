#include <stdio.h>

#include "benchmark.h"
#include "csv_loader.h"
#include "order_book.h"
#include "trade.h"

int main(void) {
	static OrderBook book;
	BenchmarkResult benchmark_result;
	int orders_loaded;

	initOrderBook(&book);
	initializeTradeHistory();
	orders_loaded = loadOrdersFromCSV("data/orders_large.csv", &book);

	printf("Orders Loaded: %d\n", orders_loaded);
	printf("\nBEFORE MATCHING\n");
	printOrderBook(&book);

	benchmark_result = runBenchmark(&book);
	saveOrderBookSnapshot(&book);

	printf("\nBENCHMARK RESULTS\n\n");
	printf("Orders Processed: %d\n", benchmark_result.orders_processed);
	printf("Execution Time (ms): %.3f\n", benchmark_result.execution_time_ms);
	printf("Throughput (ops/sec): %.3f\n", benchmark_result.throughput_ops_sec);
	printf("Average Latency (us): %.3f\n", benchmark_result.avg_latency_us);

	printf("\nTrades Executed\n");
	printTradeHistory();

	printf("\nFinal Order Book\n");
	printOrderBook(&book);

	return 0;
}
