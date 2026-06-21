#include <stdio.h>

#include "order.h"

int isValidOrder(char side, double price, int quantity) {
	return (side == 'B' || side == 'S') && price > 0.0 && quantity > 0;
}

Order createOrder(int order_id, char side, double price, int quantity) {
	Order order;

	order.order_id = order_id;
	order.side = side;
	order.price = price;
	order.quantity = quantity;

	return order;
}

void printOrder(Order order) {
	const char *side_text = (order.side == 'B') ? "BUY" : "SELL";

	printf("Order ID: %d\n", order.order_id);
	printf("Side: %s (%c)\n", side_text, order.side);
	printf("Price: %.2f\n", order.price);
	printf("Quantity: %d\n", order.quantity);
}
