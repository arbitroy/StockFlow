package com.stockflow.api.dto.report;

import com.stockflow.api.enums.MovementType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockMovementReport {
    private String itemName;
    private String sku;
    private MovementType type;
    private Integer quantity;
    private LocalDateTime date;
    private String reference;
}