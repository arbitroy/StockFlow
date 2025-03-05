package com.stockflow.api.service;

import com.stockflow.api.dto.LocationDTO;
import com.stockflow.api.dto.LocationInventoryDTO;
import com.stockflow.api.dto.StockItemDTO;
import com.stockflow.api.enums.LocationType;
import com.stockflow.api.exception.ResourceNotFoundException;
import com.stockflow.api.model.Location;
import com.stockflow.api.model.StockLocation;
import com.stockflow.api.repository.LocationRepository;
import com.stockflow.api.repository.StockLocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class LocationService {
    private final LocationRepository locationRepository;
    private final StockLocationRepository stockLocationRepository;

    /**
     * Get all locations as DTOs
     */
    public List<LocationDTO> getAllLocations() {
        return locationRepository.findAll().stream()
                .map(this::toLocationDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a location by id
     */
    public LocationDTO getLocation(UUID id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + id));
        return toLocationDTO(location);
    }

    /**
     * Create a new location
     */
    public LocationDTO createLocation(LocationDTO locationDTO) {
        Location location = new Location();
        location.setName(locationDTO.getName());
        location.setType(LocationType.valueOf(locationDTO.getType().toString()));
        
        Location savedLocation = locationRepository.save(location);
        return toLocationDTO(savedLocation);
    }

    /**
     * Update a location
     */
    public LocationDTO updateLocation(UUID id, LocationDTO locationDTO) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + id));
        
        location.setName(locationDTO.getName());
        location.setType(LocationType.valueOf(locationDTO.getType().toString()));
        
        Location updatedLocation = locationRepository.save(location);
        return toLocationDTO(updatedLocation);
    }

    /**
     * Delete a location
     */
    public void deleteLocation(UUID id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + id));
        
        // Check if there's any stock at this location
        List<StockLocation> stockAtLocation = stockLocationRepository.findByLocationId(id);
        if (!stockAtLocation.isEmpty()) {
            throw new IllegalStateException("Cannot delete location with stock items. Transfer stock first.");
        }
        
        locationRepository.delete(location);
    }

    /**
     * Get inventory at a location
     */
    public List<LocationInventoryDTO> getLocationInventory(UUID locationId) {
        // First verify the location exists
        locationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + locationId));
        
        // Get stock items at this location
        List<StockLocation> stockLocations = stockLocationRepository.findByLocationId(locationId);
        
        // Convert to DTOs
        return stockLocations.stream()
                .map(sl -> {
                    StockItemDTO stockItemDTO = StockItemDTO.builder()
                            .id(sl.getStockItem().getId())
                            .name(sl.getStockItem().getName())
                            .sku(sl.getStockItem().getSku())
                            .price(sl.getStockItem().getPrice())
                            .quantity(sl.getStockItem().getQuantity())
                            .status(sl.getStockItem().getStatus())
                            .createdAt(sl.getStockItem().getCreatedAt())
                            .updatedAt(sl.getStockItem().getUpdatedAt())
                            .build();
                    
                    return LocationInventoryDTO.builder()
                            .stockItem(stockItemDTO)
                            .quantity(sl.getQuantity())
                            .locationId(locationId)
                            .build();
                })
                .collect(Collectors.toList());
    }
    
    // Helper method to convert Location entity to LocationDTO
    private LocationDTO toLocationDTO(Location location) {
        return LocationDTO.builder()
                .id(location.getId())
                .name(location.getName())
                .type(location.getType())
                .createdAt(location.getCreatedAt())
                .updatedAt(location.getUpdatedAt())
                .build();
    }
}