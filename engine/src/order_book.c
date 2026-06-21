#include <stdio.h>

#include "order_book.h"

void sortBuyOrders(OrderBook *book) {
    int current_index;

    if (book == NULL || book->buy_count < 2) {
        return;
    }

    for (current_index = 1; current_index < book->buy_count; ++current_index) {
        Order current_order = book->buy_orders[current_index];
        int insert_index = current_index - 1;

        while (insert_index >= 0 && book->buy_orders[insert_index].price < current_order.price) {
            book->buy_orders[insert_index + 1] = book->buy_orders[insert_index];
            --insert_index;
        }

        book->buy_orders[insert_index + 1] = current_order;
    }
}

void sortSellOrders(OrderBook *book) {
    int current_index;

    if (book == NULL || book->sell_count < 2) {
        return;
    }

    for (current_index = 1; current_index < book->sell_count; ++current_index) {
        Order current_order = book->sell_orders[current_index];
        int insert_index = current_index - 1;

        while (insert_index >= 0 && book->sell_orders[insert_index].price > current_order.price) {
            book->sell_orders[insert_index + 1] = book->sell_orders[insert_index];
            --insert_index;
        }

        book->sell_orders[insert_index + 1] = current_order;
    }
}

void initOrderBook(OrderBook *book) {
    if (book == NULL) {
        return;
    }

    book->buy_count = 0;
    book->sell_count = 0;
}

int addOrder(OrderBook *book, Order order) {
    if (book == NULL || !isValidOrder(order.side, order.price, order.quantity)) {
        return 0;
    }

    if (order.side == 'B') {
        if (book->buy_count >= MAX_ORDERS_PER_SIDE) {
            return 0;
        }

        book->buy_orders[book->buy_count++] = order;
        sortBuyOrders(book);
        return 1;
    }

    if (order.side == 'S') {
        if (book->sell_count >= MAX_ORDERS_PER_SIDE) {
            return 0;
        }

        book->sell_orders[book->sell_count++] = order;
        sortSellOrders(book);
        return 1;
    }

    return 0;
}

void printOrderBook(OrderBook *book) {
    int index;

    if (book == NULL) {
        return;
    }

    printf("BUY ORDERS\n");
    printf("ID | PRICE | QTY\n");
    for (index = 0; index < book->buy_count; ++index) {
        printf("%d | %.2f | %d\n",
               book->buy_orders[index].order_id,
               book->buy_orders[index].price,
               book->buy_orders[index].quantity);
    }

    printf("\nSELL ORDERS\n");
    printf("ID | PRICE | QTY\n");
    for (index = 0; index < book->sell_count; ++index) {
        printf("%d | %.2f | %d\n",
               book->sell_orders[index].order_id,
               book->sell_orders[index].price,
               book->sell_orders[index].quantity);
    }
}