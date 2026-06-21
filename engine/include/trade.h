#ifndef TRADE_H
#define TRADE_H

typedef struct
{
    int trade_id;
    int buy_order_id;
    int sell_order_id;
    double trade_price;
    int quantity;
} Trade;

void initializeTradeHistory();
void addTrade(int buy_order_id, int sell_order_id, double trade_price, int quantity);
void printTradeHistory();

#endif /* TRADE_H */