package com.stockflow.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class TransferRequest {
    @NotNull
    private UUID stockItemId;
    
    @NotNull
    private UUID sourceLocationId;
    
    @NotNull
    private UUID targetLocationId;
    
    @NotNull
    @Min(1)
    private Integer quantity;
    
    private String reference;
    private String notes;
}