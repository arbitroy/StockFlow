package com.stockflow.api.enums;

public enum StockStatus {
    ACTIVE,     // Item is available for sale
    LOW_STOCK,  // Item quantity is below threshold
    OUT_STOCK,  // Item is completely out of stock
    INACTIVE    // Item is not available for sale
}