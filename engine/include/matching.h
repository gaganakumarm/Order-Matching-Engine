#ifndef MATCHING_H
#define MATCHING_H

#include "order_book.h"

typedef struct Trade {
    int buy_order_id;
    int sell_order_id;
    double trade_price;
    int quantity;
} Trade;

int matchOrders(OrderBook *book);
void processMatches(OrderBook *book);

#endif /* MATCHING_H */