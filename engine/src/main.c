#include <stdio.h>

#include "csv_loader.h"
#include "matching.h"
#include "order_book.h"
#include "trade.h"

int main(void) {
	OrderBook book;
	int orders_loaded;

	initOrderBook(&book);
	initializeTradeHistory();
	orders_loaded = loadOrdersFromCSV("data/orders.csv", &book);

	printf("Orders Loaded: %d\n", orders_loaded);
	printf("\nBEFORE MATCHING\n");
	printOrderBook(&book);

	processMatches(&book);

	printf("\nTrades Executed\n");
	printTradeHistory();

	printf("\nAFTER MATCHING\n");
	printOrderBook(&book);

	return 0;
}
