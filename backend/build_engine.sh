#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENGINE_DIR="${PROJECT_ROOT}/engine"

cd "${ENGINE_DIR}"

gcc -std=c17 \
  src/main.c \
  src/order.c \
  src/order_book.c \
  src/matching.c \
  src/trade.c \
  src/csv_loader.c \
  src/benchmark.c \
  -Iinclude \
  -o order_matching_engine

chmod +x order_matching_engine

echo "Compiled Linux engine binary: ${ENGINE_DIR}/order_matching_engine"
