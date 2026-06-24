#ifndef ORDER_BOOK_H
#define ORDER_BOOK_H

#include "order.h"

#define MAX_ORDERS 100000
#define MAX_ORDERS_PER_SIDE MAX_ORDERS

typedef struct OrderBook {
    Order buy_orders[MAX_ORDERS_PER_SIDE];
    Order sell_orders[MAX_ORDERS_PER_SIDE];
    int buy_count;
    int sell_count;
} OrderBook;

void initOrderBook(OrderBook *book);
int addOrder(OrderBook *book, Order order);
int cancelOrder(OrderBook *book, int order_id);
void sortBuyOrders(OrderBook *book);
void sortSellOrders(OrderBook *book);
void printOrderBook(OrderBook *book);
void saveOrderBookSnapshot(OrderBook *book);

#endif /* ORDER_BOOK_H */
