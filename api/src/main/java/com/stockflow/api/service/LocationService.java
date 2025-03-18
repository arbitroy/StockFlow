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
        log.debug("Getting all locations");
        
        // First, try to get locations from locations table
        List<Location> explicitLocations = locationRepository.findAll();

        if (!explicitLocations.isEmpty()) {
            log.debug("Found {} explicit locations", explicitLocations.size());
            return explicitLocations.stream()
                    .map(this::toLocationDTO)
                    .collect(Collectors.toList());
        }

        log.info("No explicit locations found, creating default locations");
        // If no explicit locations, create default locations
        return createDefaultLocations();
    }

    /**
     * Create a set of default locations if absolutely no locations exist
     */
    private List<LocationDTO> createDefaultLocations() {
        log.info("Creating default locations");
        List<Location> defaults = Arrays.asList(
                createAndSaveLocation("Main Warehouse", LocationType.WAREHOUSE),
                createAndSaveLocation("Downtown Store", LocationType.STORE));

        return defaults.stream()
                .map(this::toLocationDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get a location by id
     */
    public LocationDTO getLocation(UUID id) {
        log.debug("Finding location with id: {}", id);
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Location not found with id: {}", id);
                    return new ResourceNotFoundException("Location not found with id: " + id);
                });
        
        return toLocationDTO(location);
    }

    /**
     * Helper method to create and save a location
     */
    private Location createAndSaveLocation(String name, LocationType type) {
        log.debug("Creating new location: {}, type: {}", name, type);
        Location location = new Location();
        location.setName(name);
        location.setType(type);
        return locationRepository.save(location);
    }

    /**
     * Create a new location
     */
    public LocationDTO createLocation(LocationDTO locationDTO) {
        log.debug("Creating new location from DTO: {}", locationDTO);
        Location location = new Location();
        location.setName(locationDTO.getName());
        location.setType(locationDTO.getType());

        Location savedLocation = locationRepository.save(location);
        return toLocationDTO(savedLocation);
    }

    /**
     * Update a location
     */
    public LocationDTO updateLocation(UUID id, LocationDTO locationDTO) {
        log.debug("Updating location with id: {}", id);
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Location not found with id: {}", id);
                    return new ResourceNotFoundException("Location not found with id: " + id);
                });

        location.setName(locationDTO.getName());
        location.setType(locationDTO.getType());

        Location updatedLocation = locationRepository.save(location);
        return toLocationDTO(updatedLocation);
    }

    /**
     * Delete a location
     */
    public void deleteLocation(UUID id) {
        log.debug("Deleting location with id: {}", id);
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("Location not found with id: {}", id);
                    return new ResourceNotFoundException("Location not found with id: " + id);
                });

        // Check if there's any stock at this location
        List<StockLocation> stockAtLocation = stockLocationRepository.findByLocationId(id);
        if (!stockAtLocation.isEmpty()) {
            log.warn("Attempted to delete location with id: {} that has stock items", id);
            throw new IllegalStateException("Cannot delete location with stock items. Transfer stock first.");
        }

        locationRepository.delete(location);
        log.info("Deleted location with id: {}", id);
    }

    /**
     * Get inventory at a location
     */
    public List<LocationInventoryDTO> getLocationInventory(UUID locationId) {
        log.debug("Getting inventory for location with id: {}", locationId);
        
        // First verify the location exists
        locationRepository.findById(locationId)
                .orElseThrow(() -> {
                    log.error("Location not found with id: {}", locationId);
                    return new ResourceNotFoundException("Location not found with id: " + locationId);
                });

        // Get stock items at this location
        List<StockLocation> stockLocations = stockLocationRepository.findByLocationId(locationId);
        log.debug("Found {} stock items at location with id: {}", stockLocations.size(), locationId);

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