#include <stdio.h>

#include "matching.h"
#include "order_book.h"
#include "trade.h"

int main(void) {
	OrderBook book;
	Order buy_order_1 = createOrder(1, 'B', 101.25, 100);
	Order buy_order_2 = createOrder(3, 'B', 100.50, 200);
	Order buy_order_3 = createOrder(5, 'B', 105.00, 50);
	Order sell_order_1 = createOrder(2, 'S', 102.75, 150);
	Order sell_order_2 = createOrder(4, 'S', 103.10, 175);
	Order sell_order_3 = createOrder(6, 'S', 101.90, 60);

	initOrderBook(&book);
	initializeTradeHistory();

	printf("BUY order 1 valid: %s\n", isValidOrder(buy_order_1.side, buy_order_1.price, buy_order_1.quantity) ? "yes" : "no");
	printf("BUY order 2 valid: %s\n", isValidOrder(buy_order_2.side, buy_order_2.price, buy_order_2.quantity) ? "yes" : "no");
	printf("BUY order 3 valid: %s\n", isValidOrder(buy_order_3.side, buy_order_3.price, buy_order_3.quantity) ? "yes" : "no");
	printf("SELL order 1 valid: %s\n", isValidOrder(sell_order_1.side, sell_order_1.price, sell_order_1.quantity) ? "yes" : "no");
	printf("SELL order 2 valid: %s\n", isValidOrder(sell_order_2.side, sell_order_2.price, sell_order_2.quantity) ? "yes" : "no");
	printf("SELL order 3 valid: %s\n", isValidOrder(sell_order_3.side, sell_order_3.price, sell_order_3.quantity) ? "yes" : "no");

	addOrder(&book, buy_order_1);
	addOrder(&book, buy_order_2);
	addOrder(&book, buy_order_3);
	addOrder(&book, sell_order_1);
	addOrder(&book, sell_order_2);
	addOrder(&book, sell_order_3);

	printf("\nBEFORE MATCHING\n");
	printOrderBook(&book);

	printf("\nMATCHES\n");
	processMatches(&book);

	printf("\nAFTER MATCHING\n");
	printOrderBook(&book);

	printf("\n");
	printTradeHistory();

	return 0;
}
