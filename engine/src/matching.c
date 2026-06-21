#include <stdio.h>

#include "matching.h"

static void removeTopBuyOrder(OrderBook *book) {
    int index;

    if (book == NULL || book->buy_count <= 0) {
        return;
    }

    for (index = 1; index < book->buy_count; ++index) {
        book->buy_orders[index - 1] = book->buy_orders[index];
    }

    --book->buy_count;
}

static void removeTopSellOrder(OrderBook *book) {
    int index;

    if (book == NULL || book->sell_count <= 0) {
        return;
    }

    for (index = 1; index < book->sell_count; ++index) {
        book->sell_orders[index - 1] = book->sell_orders[index];
    }

    --book->sell_count;
}

int matchOrders(OrderBook *book) {
    Trade trade;
    int trade_quantity;

    if (book == NULL || book->buy_count == 0 || book->sell_count == 0) {
        return 0;
    }

    if (book->buy_orders[0].price < book->sell_orders[0].price) {
        return 0;
    }

    trade_quantity = (book->buy_orders[0].quantity < book->sell_orders[0].quantity)
                         ? book->buy_orders[0].quantity
                         : book->sell_orders[0].quantity;

    trade.buy_order_id = book->buy_orders[0].order_id;
    trade.sell_order_id = book->sell_orders[0].order_id;
    trade.trade_price = book->sell_orders[0].price;
    trade.quantity = trade_quantity;

    book->buy_orders[0].quantity -= trade_quantity;
    book->sell_orders[0].quantity -= trade_quantity;

    printf("TRADE | BUY %d | SELL %d | PRICE %.2f | QTY %d\n",
           trade.buy_order_id,
           trade.sell_order_id,
           trade.trade_price,
           trade.quantity);

    if (book->buy_orders[0].quantity == 0) {
        removeTopBuyOrder(book);
    }

    if (book->sell_orders[0].quantity == 0) {
        removeTopSellOrder(book);
    }

    return 1;
}

void processMatches(OrderBook *book) {
    while (matchOrders(book)) {
    }
}