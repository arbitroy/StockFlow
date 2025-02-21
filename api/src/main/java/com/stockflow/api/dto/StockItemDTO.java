package com.stockflow.api.dto;

import com.stockflow.api.enums.StockStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class StockItemDTO {
    private UUID id;
    private String name;
    private String sku;
    private BigDecimal price;
    private Integer quantity;
    private StockStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}