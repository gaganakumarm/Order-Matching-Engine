import csv
import random
import sys
from pathlib import Path

DEFAULT_ORDER_COUNT = 10000
OUTPUT_RELATIVE_PATH = Path("data") / "orders_large.csv"


def parse_order_count(argv):
    if len(argv) < 2:
        return DEFAULT_ORDER_COUNT

    try:
        order_count = int(argv[1])
    except ValueError:
        return DEFAULT_ORDER_COUNT

    return order_count if order_count > 0 else DEFAULT_ORDER_COUNT


def generate_orders(order_count):
    orders = []

    for order_id in range(1, order_count + 1):
        side = random.choice(["B", "S"])
        price = round(random.uniform(90.0, 110.0), 2)
        quantity = random.randint(1, 1000)
        orders.append([order_id, side, f"{price:.2f}", quantity])

    return orders


def main():
    order_count = parse_order_count(sys.argv)
    script_dir = Path(__file__).resolve().parent
    output_path = (script_dir.parent / OUTPUT_RELATIVE_PATH).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with output_path.open("w", newline="", encoding="utf-8") as file_handle:
        writer = csv.writer(file_handle)
        writer.writerow(["order_id", "side", "price", "quantity"])
        writer.writerows(generate_orders(order_count))

    print(f"Generated {order_count} orders to data/orders_large.csv")


if __name__ == "__main__":
    main()
