package com.stockflow.api.service;

import com.stockflow.api.dto.CreateSaleRequest;
import com.stockflow.api.dto.SaleItemRequest;
import com.stockflow.api.dto.StockMovementRequest;
import com.stockflow.api.enums.MovementType;
import com.stockflow.api.enums.SaleStatus;
import com.stockflow.api.exception.InsufficientStockException;
import com.stockflow.api.exception.ResourceNotFoundException;
import com.stockflow.api.model.Sale;
import com.stockflow.api.model.SaleItem;
import com.stockflow.api.model.StockItem;
import com.stockflow.api.repository.SaleRepository;
import com.stockflow.api.repository.StockItemRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@Slf4j
public class SaleService {
    private final SaleRepository saleRepository;
    private final StockItemRepository stockItemRepository;
    private final StockService stockService;
    
    public SaleService(
        SaleRepository saleRepository,
        StockItemRepository stockItemRepository,
        StockService stockService
    ) {
        this.saleRepository = saleRepository;
        this.stockItemRepository = stockItemRepository;
        this.stockService = stockService;
    }
    
    @Transactional
    public Sale createSale(CreateSaleRequest request) {
        // Create new sale
        Sale sale = new Sale();
        sale.setCustomerName(request.getCustomerName());
        sale.setCustomerPhone(request.getCustomerPhone());
        sale.setReference(generateReference());
        sale.setStatus(SaleStatus.PENDING);
        
        // Process each item in the sale
        List<SaleItem> saleItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        
        for (SaleItemRequest itemRequest : request.getItems()) {
            StockItem stockItem = stockItemRepository.findByIdWithLock(itemRequest.getStockItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Stock item not found"));
                
            // Validate and update stock
            if (stockItem.getQuantity() < itemRequest.getQuantity()) {
                throw new InsufficientStockException(
                    "Insufficient stock for item: " + stockItem.getName() +
                    ". Available: " + stockItem.getQuantity()
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
            
            // Record stock movement
            stockService.recordMovement(
                StockMovementRequest.builder()
                    .stockItemId(stockItem.getId())
                    .quantity(itemRequest.getQuantity())
                    .type(MovementType.OUT)
                    .reference(sale.getReference())
                    .build()
            );
        }
        
        sale.setItems(saleItems);
        sale.setTotal(total);
        
        return saleRepository.save(sale);
    }
    
    @Transactional
    public Sale completeSale(UUID saleId) {
        Sale sale = saleRepository.findById(saleId)
            .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
            
        if (sale.getStatus() != SaleStatus.PENDING) {
            throw new IllegalStateException("Sale is not in PENDING status");
        }
        
        sale.setStatus(SaleStatus.COMPLETED);
        return saleRepository.save(sale);
    }
    
    @Transactional
    public Sale cancelSale(UUID saleId) {
        Sale sale = saleRepository.findById(saleId)
            .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));
            
        if (sale.getStatus() != SaleStatus.PENDING) {
            throw new IllegalStateException("Sale is not in PENDING status");
        }
        
        // Reverse stock movements
        for (SaleItem item : sale.getItems()) {
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
        
        sale.setStatus(SaleStatus.CANCELLED);
        return saleRepository.save(sale);
    }
    
    private String generateReference() {
        return "SALE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}