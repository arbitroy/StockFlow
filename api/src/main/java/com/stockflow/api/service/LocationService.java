package com.stockflow.api.service;

import com.stockflow.api.dto.LocationDTO;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    public List<Object> getLocationInventory(UUID locationId) {
        // First verify the location exists
        locationRepository.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + locationId));
        
        // Get stock items at this location
        List<StockLocation> stockLocations = stockLocationRepository.findByLocationId(locationId);
        
        // Convert to map structure expected by frontend
        return stockLocations.stream()
                .map(sl -> {
                    Map<String, Object> item = new HashMap<>();
                    Map<String, Object> stockItemMap = new HashMap<>();
                    
                    stockItemMap.put("id", sl.getStockItem().getId());
                    stockItemMap.put("name", sl.getStockItem().getName());
                    stockItemMap.put("sku", sl.getStockItem().getSku());
                    stockItemMap.put("price", sl.getStockItem().getPrice());
                    stockItemMap.put("quantity", sl.getStockItem().getQuantity());
                    stockItemMap.put("status", sl.getStockItem().getStatus());
                    stockItemMap.put("createdAt", sl.getStockItem().getCreatedAt());
                    stockItemMap.put("updatedAt", sl.getStockItem().getUpdatedAt());
                    
                    item.put("stockItem", stockItemMap);
                    item.put("quantity", sl.getQuantity());
                    item.put("locationId", locationId);
                    
                    return item;
                }).collect(Collectors.toList());
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