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
import java.util.Arrays;
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
        // First, try to get locations from locations table
        List<LocationDTO> explicitLocations = locationRepository.findAll().stream()
                .map(this::toLocationDTO)
                .collect(Collectors.toList());

        if (!explicitLocations.isEmpty()) {
            return explicitLocations;
        }

        // If no explicit locations, derive from stock locations
        List<UUID> distinctLocationIds = stockLocationRepository.findDistinctLocationIds();

        List<LocationDTO> derivedLocations = distinctLocationIds.stream()
                .map(locationId -> {
                    // Fetch location details or create a default
                    Location location = locationRepository.findById(locationId)
                            .orElseGet(() -> createDefaultLocation(locationId));
                    return toLocationDTO(location);
                })
                .collect(Collectors.toList());

        // If no locations found at all, create some defaults
        return derivedLocations.isEmpty()
                ? createDefaultLocations()
                : derivedLocations;
    }

    /**
     * Create a set of default locations if absolutely no locations exist
     */
    private List<LocationDTO> createDefaultLocations() {
        List<Location> defaults = Arrays.asList(
                createAndSaveLocation("Main Warehouse", LocationType.WAREHOUSE),
                createAndSaveLocation("Downtown Store", LocationType.STORE));

        return defaults.stream()
                .map(this::toLocationDTO)
                .collect(Collectors.toList());
    }

    /**
     * Generate a default location name based on ID
     */
    private String generateLocationName(UUID locationId) {
        return "Location-" + locationId.toString().substring(0, 8);
    }

    /**
     * Get a location by id
     */
    public LocationDTO getLocation(UUID id) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + id));
        return toLocationDTO(location);
    }

    private Location createDefaultLocation(UUID locationId) {
        String name = generateLocationName(locationId);
        LocationType type = determineLocationType(locationId);
    
        Location location = new Location();
        location.setId(locationId);
        location.setName(name);
        location.setType(type);
    
        return locationRepository.save(location);
    }
    /**
     * Determine location type based on stock items
     */
    private LocationType determineLocationType(UUID locationId) {
        // Logic to determine if it's a warehouse or store based on stock
        // characteristics
        List<StockLocation> stockAtLocation = stockLocationRepository.findByLocationId(locationId);

        // Simple heuristic: if more than 100 items, consider it a warehouse
        return stockAtLocation.size() > 100
                ? LocationType.WAREHOUSE
                : LocationType.STORE;
    }

    /**
     * Helper method to create and save a location
     */
    private Location createAndSaveLocation(String name, LocationType type) {
        Location location = new Location();
        location.setName(name);
        location.setType(type);
        return locationRepository.save(location);
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