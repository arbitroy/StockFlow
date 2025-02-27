package com.stockflow.api.util;

import com.stockflow.api.dto.LocationDTO;
import com.stockflow.api.model.Location;

/**
 * Utility class for mapping entities to DTOs and vice versa
 */
public class ModelMapper {
    
    // Location mappings
    public static LocationDTO toLocationDTO(Location location) {
        if (location == null) {
            return null;
        }
        
        return LocationDTO.builder()
                .id(location.getId())
                .name(location.getName())
                .type(location.getType())
                .createdAt(location.getCreatedAt())
                .updatedAt(location.getUpdatedAt())
                .build();
    }
    
    public static Location toLocation(LocationDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Location location = new Location();
        location.setId(dto.getId());
        location.setName(dto.getName());
        location.setType(dto.getType());
        
        return location;
    }
}