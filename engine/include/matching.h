#ifndef MATCHING_H
#define MATCHING_H

#include "order_book.h"

int matchOrders(OrderBook *book);
void processMatches(OrderBook *book);

#endif /* MATCHING_H */