#include <stdio.h>

#include "trade.h"

#define MAX_TRADES 1000

static Trade trade_history[MAX_TRADES];
static int trade_count = 0;
static const char *TRADE_CSV_PATH = "engine/data/trades.csv";

static void writeTradeCsvHeader(void) {
    FILE *file = fopen(TRADE_CSV_PATH, "w");

    if (file == NULL) {
        return;
    }

    fputs("trade_id,buy_order_id,sell_order_id,price,quantity\n", file);
    fclose(file);
}

void initializeTradeHistory() {
    trade_count = 0;
    writeTradeCsvHeader();
}

void addTrade(int buy_order_id, int sell_order_id, double trade_price, int quantity) {
    FILE *file;
    Trade trade;

    if (trade_count >= MAX_TRADES) {
        return;
    }

    trade.trade_id = trade_count + 1;
    trade.buy_order_id = buy_order_id;
    trade.sell_order_id = sell_order_id;
    trade.trade_price = trade_price;
    trade.quantity = quantity;

    trade_history[trade_count] = trade;
    ++trade_count;

    file = fopen(TRADE_CSV_PATH, "a");
    if (file == NULL) {
        return;
    }

    fprintf(file, "%d,%d,%d,%.2f,%d\n",
            trade.trade_id,
            trade.buy_order_id,
            trade.sell_order_id,
            trade.trade_price,
            trade.quantity);

    fclose(file);
}

void printTradeHistory() {
    int index;

    printf("TRADE HISTORY\n\n");
    printf("ID | BUY | SELL | PRICE | QTY\n");

    for (index = 0; index < trade_count; ++index) {
        printf("%d | %d | %d | %.2f | %d\n",
               trade_history[index].trade_id,
               trade_history[index].buy_order_id,
               trade_history[index].sell_order_id,
               trade_history[index].trade_price,
               trade_history[index].quantity);
    }
}