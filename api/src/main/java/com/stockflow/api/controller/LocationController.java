package com.stockflow.api.controller;

import com.stockflow.api.dto.LocationDTO;
import com.stockflow.api.service.LocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {
    private final LocationService locationService;

    @GetMapping
    public ResponseEntity<List<LocationDTO>> getAllLocations() {
        return ResponseEntity.ok(locationService.getAllLocations());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocationDTO> getLocation(@PathVariable UUID id) {
        return ResponseEntity.ok(locationService.getLocation(id));
    }

    @PostMapping
    public ResponseEntity<LocationDTO> createLocation(@Valid @RequestBody LocationDTO locationDTO) {
        return ResponseEntity.ok(locationService.createLocation(locationDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LocationDTO> updateLocation(
            @PathVariable UUID id,
            @Valid @RequestBody LocationDTO locationDTO) {
        return ResponseEntity.ok(locationService.updateLocation(id, locationDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable UUID id) {
        locationService.deleteLocation(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/inventory")
    public ResponseEntity<List<Object>> getLocationInventory(@PathVariable UUID id) {
        return ResponseEntity.ok(locationService.getLocationInventory(id));
    }
}