package com.stockflow.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateSaleRequest {
    private String customerName;
    private String customerPhone;
    
    // Add location ID field
    @NotNull(message = "Location ID is required")
    private UUID locationId;
    
    @NotEmpty(message = "Sale must have at least one item")
    @Valid
    private List<SaleItemRequest> items;
}