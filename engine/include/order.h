#ifndef ORDER_H
#define ORDER_H

typedef struct Order {
	int order_id;
	char side;
	double price;
	int quantity;
} Order;

int isValidOrder(char side, double price, int quantity);
Order createOrder(int order_id, char side, double price, int quantity);
void printOrder(Order order);

#endif /* ORDER_H */
