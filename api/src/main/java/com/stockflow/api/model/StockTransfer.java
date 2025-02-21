package com.stockflow.api.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockTransfer {
    private StockMovement outMovement;
    private StockMovement inMovement;
}