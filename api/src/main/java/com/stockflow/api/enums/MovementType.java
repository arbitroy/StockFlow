package com.stockflow.api.enums;

public enum MovementType {
    IN,     // Stock coming in from warehouse
    OUT,    // Stock going out (sales)
    ADJUST  // Manual adjustments (stock count corrections)
}