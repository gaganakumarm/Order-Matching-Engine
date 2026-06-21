#include <stdio.h>

#include "order_book.h"

int main(void) {
	OrderBook book;
	Order buy_order_1 = createOrder(1, 'B', 101.25, 100);
	Order buy_order_2 = createOrder(3, 'B', 100.50, 200);
	Order buy_order_3 = createOrder(5, 'B', 105.00, 50);
	Order sell_order_1 = createOrder(2, 'S', 102.75, 150);
	Order sell_order_2 = createOrder(4, 'S', 103.10, 175);
	Order sell_order_3 = createOrder(6, 'S', 101.90, 60);

	initOrderBook(&book);

	addOrder(&book, buy_order_1);
	addOrder(&book, buy_order_2);
	addOrder(&book, buy_order_3);
	addOrder(&book, sell_order_1);
	addOrder(&book, sell_order_2);
	addOrder(&book, sell_order_3);

	printf("BEFORE CANCELLATION\n");
	printOrderBook(&book);

	if (cancelOrder(&book, 3)) {
		printf("Order 3 cancelled successfully.\n");
	} else {
		printf("Order 3 not found.\n");
	}

	if (cancelOrder(&book, 4)) {
		printf("Order 4 cancelled successfully.\n");
	} else {
		printf("Order 4 not found.\n");
	}

	if (cancelOrder(&book, 999)) {
		printf("Order 999 cancelled successfully.\n");
	} else {
		printf("Order 999 not found.\n");
	}

	printf("\nAFTER CANCELLATION\n");
	printOrderBook(&book);

	return 0;
}
