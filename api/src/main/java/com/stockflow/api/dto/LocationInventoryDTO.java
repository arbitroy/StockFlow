package com.stockflow.api.dto;

import com.stockflow.api.enums.StockStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for representing inventory items at a specific location
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationInventoryDTO {
    private StockItemDTO stockItem;
    private Integer quantity;
    private UUID locationId;
}