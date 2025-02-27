package com.stockflow.api.dto;

import com.stockflow.api.enums.LocationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class LocationDTO {
    private UUID id;
    private String name;
    private LocationType type;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}