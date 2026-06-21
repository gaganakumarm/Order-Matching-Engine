#ifndef CSV_LOADER_H
#define CSV_LOADER_H

#include "order_book.h"

int loadOrdersFromCSV(const char *filename, OrderBook *book);

#endif /* CSV_LOADER_H */