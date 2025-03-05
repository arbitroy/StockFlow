package com.stockflow.api.dto;

import com.stockflow.api.enums.MovementType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class StockMovementRequest {
    @NotNull
    private UUID stockItemId;
    
    @NotNull
    @Min(1)
    private Integer quantity;
    
    @NotNull
    private MovementType type;
    
    private String reference;
    private String notes;
    
    // Add location ID field
    private UUID locationId;
}