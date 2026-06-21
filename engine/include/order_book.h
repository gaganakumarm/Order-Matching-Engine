#ifndef ORDER_BOOK_H
#define ORDER_BOOK_H

#include "order.h"

#define MAX_ORDERS_PER_SIDE 1000

typedef struct OrderBook {
    Order buy_orders[MAX_ORDERS_PER_SIDE];
    Order sell_orders[MAX_ORDERS_PER_SIDE];
    int buy_count;
    int sell_count;
} OrderBook;

void initOrderBook(OrderBook *book);
int addOrder(OrderBook *book, Order order);
void sortBuyOrders(OrderBook *book);
void sortSellOrders(OrderBook *book);
void printOrderBook(OrderBook *book);

#endif /* ORDER_BOOK_H */