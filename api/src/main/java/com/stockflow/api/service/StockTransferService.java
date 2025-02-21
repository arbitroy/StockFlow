package com.stockflow.api.service;

import com.stockflow.api.dto.TransferRequest;
import com.stockflow.api.enums.MovementType;
import com.stockflow.api.exception.InsufficientStockException;
import com.stockflow.api.exception.ResourceNotFoundException;
import com.stockflow.api.model.Location;
import com.stockflow.api.model.StockItem;
import com.stockflow.api.model.StockLocation;
import com.stockflow.api.model.StockMovement;
import com.stockflow.api.model.StockTransfer;
import com.stockflow.api.repository.LocationRepository;
import com.stockflow.api.repository.StockItemRepository;
import com.stockflow.api.repository.StockLocationRepository;
import com.stockflow.api.repository.StockMovementRepository;

import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@Slf4j
public class StockTransferService {
    private final StockLocationRepository stockLocationRepository;
    private final StockMovementRepository movementRepository;
    private final LocationRepository locationRepository;
    private final StockItemRepository stockItemRepository;

    public StockTransferService(
            StockLocationRepository stockLocationRepository,
            StockMovementRepository movementRepository,
            LocationRepository locationRepository,
            StockItemRepository stockItemRepository) {
        this.stockLocationRepository = stockLocationRepository;
        this.movementRepository = movementRepository;
        this.locationRepository = locationRepository;
        this.stockItemRepository = stockItemRepository;
    }

    public StockTransfer transferStock(TransferRequest request) {
        // Validate source has enough stock
        StockLocation sourceLocation = stockLocationRepository
                .findByStockItemAndLocationWithLock(request.getStockItemId(), request.getSourceLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Stock not found at source location"));

        if (sourceLocation.getQuantity() < request.getQuantity()) {
            throw new InsufficientStockException("Insufficient stock at source location");
        }

        // Update quantities
        sourceLocation.setQuantity(sourceLocation.getQuantity() - request.getQuantity());

        StockLocation targetLocation = stockLocationRepository
                .findByStockItemAndLocationWithLock(request.getStockItemId(), request.getTargetLocationId())
                .orElseGet(() -> createNewStockLocation(request));

        targetLocation.setQuantity(targetLocation.getQuantity() + request.getQuantity());

        // Record movements
        StockMovement outMovement = createMovement(
                sourceLocation.getStockItem(),
                request.getQuantity(),
                MovementType.OUT,
                sourceLocation.getLocation());

        StockMovement inMovement = createMovement(
                targetLocation.getStockItem(),
                request.getQuantity(),
                MovementType.IN,
                targetLocation.getLocation());

        return new StockTransfer(outMovement, inMovement);
    }

    private StockLocation createNewStockLocation(TransferRequest request) {
        StockItem stockItem = stockItemRepository.findById(request.getStockItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));

        Location targetLocation = locationRepository.findById(request.getTargetLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Target location not found"));

        StockLocation newStockLocation = new StockLocation();
        newStockLocation.setStockItem(stockItem);
        newStockLocation.setLocation(targetLocation);
        newStockLocation.setQuantity(0);
        newStockLocation.setOpeningQuantity(0);

        return stockLocationRepository.save(newStockLocation);
    }

    private StockMovement createMovement(StockItem stockItem, Integer quantity,
            MovementType type, Location location) {
        StockMovement movement = new StockMovement();
        movement.setStockItem(stockItem);
        movement.setQuantity(quantity);
        movement.setType(type);
        movement.setLocation(location);

        // Generate reference based on type
        String prefix = type == MovementType.IN ? "IN-" : "OUT-";
        movement.setReference(prefix + UUID.randomUUID().toString().substring(0, 8));

        return movementRepository.save(movement);
    }

    @Scheduled(cron = "0 0 0 * * *") // Run at midnight
    @Transactional
    public void updateOpeningStock() {
        stockLocationRepository.updateAllOpeningQuantities();
    }
}