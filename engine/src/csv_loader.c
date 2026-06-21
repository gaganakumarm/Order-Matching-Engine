#include <stdio.h>

#include "csv_loader.h"

int loadOrdersFromCSV(const char *filename, OrderBook *book) {
    FILE *file;
    char line[256];
    int orders_loaded = 0;

    if (filename == NULL || book == NULL) {
        return 0;
    }

    file = fopen(filename, "r");
    if (file == NULL) {
        printf("Could not open CSV file: %s\n", filename);
        return 0;
    }

    if (fgets(line, sizeof(line), file) == NULL) {
        fclose(file);
        return 0;
    }

    while (fgets(line, sizeof(line), file) != NULL) {
        int order_id;
        char side;
        double price;
        int quantity;
        int parsed_fields;
        Order order;

        parsed_fields = sscanf(line, "%d,%c,%lf,%d", &order_id, &side, &price, &quantity);
        if (parsed_fields != 4) {
            printf("Skipping malformed row: %s", line);
            continue;
        }

        order = createOrder(order_id, side, price, quantity);
        if (!isValidOrder(order.side, order.price, order.quantity)) {
            printf("Skipping invalid order: %s", line);
            continue;
        }

        if (addOrder(book, order)) {
            ++orders_loaded;
        }
    }

    fclose(file);
    return orders_loaded;
}