package com.stockflow.api.service;

import com.stockflow.api.dto.StockItemDTO;
import com.stockflow.api.dto.StockMovementRequest;
import com.stockflow.api.enums.MovementType;
import com.stockflow.api.enums.StockStatus;
import com.stockflow.api.exception.InsufficientStockException;
import com.stockflow.api.exception.ResourceNotFoundException;
import com.stockflow.api.model.StockItem;
import com.stockflow.api.model.StockMovement;
import com.stockflow.api.repository.StockItemRepository;
import com.stockflow.api.repository.StockMovementRepository;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@Slf4j
public class StockService {
    private final StockItemRepository stockItemRepository;
    private final StockMovementRepository stockMovementRepository;

    public StockService(
            StockItemRepository stockItemRepository,
            StockMovementRepository stockMovementRepository) {
        this.stockItemRepository = stockItemRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    @Transactional
    public StockMovement recordMovement(StockMovementRequest request) {
        StockItem item = stockItemRepository.findByIdWithLock(request.getStockItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));

        // Validate stock levels for outgoing movements
        if (request.getType() == MovementType.OUT) {
            if (item.getQuantity() < request.getQuantity()) {
                throw new InsufficientStockException(
                        "Insufficient stock. Available: " + item.getQuantity());
            }
        }

        // Update stock quantity
        int quantityChange = request.getType() == MovementType.IN ? request.getQuantity() : -request.getQuantity();
        item.setQuantity(item.getQuantity() + quantityChange);

        // Update stock status based on new quantity
        updateStockStatus(item);

        // Create movement record
        StockMovement movement = new StockMovement();
        movement.setStockItem(item);
        movement.setQuantity(request.getQuantity());
        movement.setType(request.getType());
        movement.setReference(request.getReference());
        movement.setNotes(request.getNotes());

        stockItemRepository.save(item);
        return stockMovementRepository.save(movement);
    }

    public List<StockItemDTO> getAllStockItems() {
        return stockItemRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public StockItemDTO getStockItem(UUID id) {
        StockItem item = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));
        return mapToDTO(item);
    }

    public StockItemDTO createStockItem(StockItemDTO dto) {
        // Check for duplicate SKU
        stockItemRepository.findBySku(dto.getSku())
                .ifPresent(item -> {
                    throw new IllegalArgumentException("Item with SKU " + dto.getSku() + " already exists");
                });

        StockItem newItem = new StockItem();
        newItem.setName(dto.getName());
        newItem.setSku(dto.getSku());
        newItem.setPrice(dto.getPrice());
        newItem.setQuantity(dto.getQuantity() != null ? dto.getQuantity() : 0);
        newItem.setStatus(dto.getStatus() != null ? dto.getStatus() : StockStatus.ACTIVE);

        StockItem savedItem = stockItemRepository.save(newItem);
        return mapToDTO(savedItem);
    }

    public StockItemDTO updateStockItem(UUID id, StockItemDTO dto) {
        StockItem existingItem = stockItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));

        // Check if SKU is being changed and if it would conflict
        if (!existingItem.getSku().equals(dto.getSku())) {
            stockItemRepository.findBySku(dto.getSku())
                    .ifPresent(item -> {
                        throw new IllegalArgumentException("Item with SKU " + dto.getSku() + " already exists");
                    });
        }

        existingItem.setName(dto.getName());
        existingItem.setSku(dto.getSku());
        existingItem.setPrice(dto.getPrice());

        // Only update quantity through stock movements to maintain audit trail
        // existingItem.setQuantity(dto.getQuantity());

        if (dto.getStatus() != null) {
            existingItem.setStatus(dto.getStatus());
        }

        StockItem savedItem = stockItemRepository.save(existingItem);
        return mapToDTO(savedItem);
    }

    public List<StockItemDTO> getLowStockItems() {
        return stockItemRepository.findByStatus(StockStatus.LOW_STOCK).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private StockItemDTO mapToDTO(StockItem item) {
        return StockItemDTO.builder()
                .id(item.getId())
                .name(item.getName())
                .sku(item.getSku())
                .price(item.getPrice())
                .quantity(item.getQuantity())
                .status(item.getStatus())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private void updateStockStatus(StockItem item) {
        if (item.getQuantity() <= 0) {
            item.setStatus(StockStatus.OUT_STOCK);
        } else if (item.getQuantity() <= 10) { // Threshold could be configurable
            item.setStatus(StockStatus.LOW_STOCK);
        } else {
            item.setStatus(StockStatus.ACTIVE);
        }
    }
}
