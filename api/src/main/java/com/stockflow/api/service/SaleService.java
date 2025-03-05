package com.stockflow.api.service;

import com.stockflow.api.dto.CreateSaleRequest;
import com.stockflow.api.dto.SaleItemRequest;
import com.stockflow.api.dto.StockMovementRequest;
import com.stockflow.api.enums.MovementType;
import com.stockflow.api.enums.SaleStatus;
import com.stockflow.api.exception.InsufficientStockException;
import com.stockflow.api.exception.ResourceNotFoundException;
import com.stockflow.api.model.Location;
import com.stockflow.api.model.Sale;
import com.stockflow.api.model.SaleItem;
import com.stockflow.api.model.StockItem;
import com.stockflow.api.model.StockLocation;
import com.stockflow.api.repository.SaleRepository;
import com.stockflow.api.repository.StockItemRepository;
import com.stockflow.api.repository.StockLocationRepository;
import com.stockflow.api.repository.LocationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
@Slf4j
public class SaleService {
    private final SaleRepository saleRepository;
    private final StockItemRepository stockItemRepository;
    private final StockLocationRepository stockLocationRepository;
    private final LocationRepository locationRepository;
    private final StockService stockService;
    
    public SaleService(
        SaleRepository saleRepository,
        StockItemRepository stockItemRepository,
        StockLocationRepository stockLocationRepository,
        LocationRepository locationRepository,
        StockService stockService
    ) {
        this.saleRepository = saleRepository;
        this.stockItemRepository = stockItemRepository;
        this.stockLocationRepository = stockLocationRepository;
        this.locationRepository = locationRepository;
        this.stockService = stockService;
    }
    
    @Transactional
    public Sale createSale(CreateSaleRequest request) {
        // Get the location for the sale
        Location location = null;
        if (request.getLocationId() != null) {
            location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));
        }
        
        // Create new sale
        Sale sale = new Sale();
        sale.setCustomerName(request.getCustomerName());
        sale.setCustomerPhone(request.getCustomerPhone());
        sale.setReference(generateReference());
        sale.setStatus(SaleStatus.PENDING);
        sale.setLocation(location); // Set the location for the sale
        
        // Process each item in the sale
        List<SaleItem> saleItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        
        for (SaleItemRequest itemRequest : request.getItems()) {
            StockItem stockItem = stockItemRepository.findByIdWithLock(itemRequest.getStockItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));
            
            // Check if we need to use location-specific stock
            if (location != null) {
                // Get stock at this location
                Optional<StockLocation> stockLocationOpt = 
                    stockLocationRepository.findByStockItemAndLocationWithLock(
                        itemRequest.getStockItemId(), 
                        location.getId()
                    );
                
                // If item exists at this location, check its quantity
                if (stockLocationOpt.isPresent()) {
                    StockLocation stockLocation = stockLocationOpt.get();
                    if (stockLocation.getQuantity() < itemRequest.getQuantity()) {
                        throw new InsufficientStockException(
                            "Insufficient stock for item: " + stockItem.getName() +
                            " at location: " + location.getName() +
                            ". Available: " + stockLocation.getQuantity()
                        );
                    }
                    
                    // Update location stock
                    stockLocation.setQuantity(stockLocation.getQuantity() - itemRequest.getQuantity());
                    stockLocationRepository.save(stockLocation);
                } else {
                    throw new InsufficientStockException(
                        "Item: " + stockItem.getName() + " is not available at location: " + location.getName()
                    );
                }
                
                // Record stock movement for this location
                stockService.recordMovement(
                    StockMovementRequest.builder()
                        .stockItemId(stockItem.getId())
                        .quantity(itemRequest.getQuantity())
                        .type(MovementType.OUT)
                        .reference(sale.getReference())
                        .locationId(location.getId())
                        .build()
                );
            } else {
                // Use global stock (backward compatibility)
                if (stockItem.getQuantity() < itemRequest.getQuantity()) {
                    throw new InsufficientStockException(
                        "Insufficient stock for item: " + stockItem.getName() +
                        ". Available: " + stockItem.getQuantity()
                    );
                }
                
                // Record global stock movement
                stockService.recordMovement(
                    StockMovementRequest.builder()
                        .stockItemId(stockItem.getId())
                        .quantity(itemRequest.getQuantity())
                        .type(MovementType.OUT)
                        .reference(sale.getReference())
                        .build()
                );
            }
                
            // Create sale item
            SaleItem saleItem = new SaleItem();
            saleItem.setSale(sale);
            saleItem.setStockItem(stockItem);
            saleItem.setQuantity(itemRequest.getQuantity());
            saleItem.setPrice(stockItem.getPrice());
            saleItem.setTotal(stockItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity())));
            
            saleItems.add(saleItem);
            total = total.add(saleItem.getTotal());
        }
        
        sale.setItems(saleItems);
        sale.setTotal(total);
        
        return saleRepository.save(sale);
    }
    
    @Transactional
    public Sale cancelSale(UUID saleId) {
        Sale sale = saleRepository.findById(saleId)
            .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
            
        if (sale.getStatus() != SaleStatus.PENDING) {
            throw new IllegalStateException("Sale is not in PENDING status");
        }
        
        Location location = sale.getLocation();
        
        // Reverse stock movements
        for (SaleItem item : sale.getItems()) {
            if (location != null) {
                // If location-specific, update location stock
                Optional<StockLocation> stockLocationOpt = 
                    stockLocationRepository.findByStockItemAndLocationWithLock(
                        item.getStockItem().getId(), 
                        location.getId()
                    );
                
                if (stockLocationOpt.isPresent()) {
                    StockLocation stockLocation = stockLocationOpt.get();
                    stockLocation.setQuantity(stockLocation.getQuantity() + item.getQuantity());
                    stockLocationRepository.save(stockLocation);
                }
                
                // Record location-specific reversal movement
                stockService.recordMovement(
                    StockMovementRequest.builder()
                        .stockItemId(item.getStockItem().getId())
                        .quantity(item.getQuantity())
                        .type(MovementType.IN)
                        .reference("CANCEL-" + sale.getReference())
                        .notes("Sale cancellation")
                        .locationId(location.getId())
                        .build()
                );
            } else {
                // Record global stock reversal
                stockService.recordMovement(
                    StockMovementRequest.builder()
                        .stockItemId(item.getStockItem().getId())
                        .quantity(item.getQuantity())
                        .type(MovementType.IN)
                        .reference("CANCEL-" + sale.getReference())
                        .notes("Sale cancellation")
                        .build()
                );
            }
        }
        
        sale.setStatus(SaleStatus.CANCELLED);
        return saleRepository.save(sale);
    }
    
    // Helper method to generate a unique reference for a sale
    private String generateReference() {
        return "SALE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}