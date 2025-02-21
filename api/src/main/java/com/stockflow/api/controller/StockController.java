package com.stockflow.api.controller;

import com.stockflow.api.dto.StockItemDTO;
import com.stockflow.api.dto.StockMovementRequest;
import com.stockflow.api.service.StockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/stock")
@RequiredArgsConstructor
public class StockController {
    private final StockService stockService;

    @GetMapping
    public ResponseEntity<List<StockItemDTO>> getAllStock() {
        return ResponseEntity.ok(stockService.getAllStockItems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<StockItemDTO> getStockItem(@PathVariable UUID id) {
        return ResponseEntity.ok(stockService.getStockItem(id));
    }

    @PostMapping
    public ResponseEntity<StockItemDTO> createStockItem(@Valid @RequestBody StockItemDTO request) {
        return ResponseEntity.ok(stockService.createStockItem(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StockItemDTO> updateStockItem(
        @PathVariable UUID id,
        @Valid @RequestBody StockItemDTO request
    ) {
        return ResponseEntity.ok(stockService.updateStockItem(id, request));
    }

    @PostMapping("/movement")
    public ResponseEntity<Void> recordMovement(@Valid @RequestBody StockMovementRequest request) {
        stockService.recordMovement(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<StockItemDTO>> getLowStockItems() {
        return ResponseEntity.ok(stockService.getLowStockItems());
    }
}