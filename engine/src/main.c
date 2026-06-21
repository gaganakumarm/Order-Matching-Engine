#include <stdio.h>

#include "csv_loader.h"
#include "order_book.h"

int main(void) {
	OrderBook book;
	int orders_loaded;

	initOrderBook(&book);
	orders_loaded = loadOrdersFromCSV("data/orders.csv", &book);
	if (orders_loaded == 0) {
		orders_loaded = loadOrdersFromCSV("engine/data/orders.csv", &book);
	}

	printf("Orders Loaded: %d\n", orders_loaded);
	printf("\n");
	printOrderBook(&book);

	return 0;
}
