package com.stockflow.api.dto.report;

import com.stockflow.api.enums.StockStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockReport {
    private String sku;
    private String name;
    private Integer quantity;
    private StockStatus status;
    private BigDecimal value;
    private Integer movementsCount;
    private Integer salesCount;
    
    // Constructor that matches the JPQL query parameter types
    public StockReport(
        String sku,
        String name,
        Integer quantity, 
        StockStatus status,
        BigDecimal value,
        Long movementsCount,
        Long salesCount
    ) {
        this.sku = sku;
        this.name = name;
        this.quantity = quantity;
        this.status = status;
        this.value = value;
        this.movementsCount = movementsCount != null ? movementsCount.intValue() : 0;
        this.salesCount = salesCount != null ? salesCount.intValue() : 0;
    }
}