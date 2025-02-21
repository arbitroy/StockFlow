package com.stockflow.api.service;

import com.stockflow.api.dto.report.ConsolidationReport;
import com.stockflow.api.dto.report.StockSummary;
import com.stockflow.api.enums.MovementType;
import com.stockflow.api.model.StockMovement;
import com.stockflow.api.repository.StockLocationRepository;
import com.stockflow.api.repository.StockMovementRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ConsolidationService {
    private final StockLocationRepository stockLocationRepository;
    private final StockMovementRepository movementRepository;

    public ConsolidationService(
        StockLocationRepository stockLocationRepository,
        StockMovementRepository movementRepository
    ) {
        this.stockLocationRepository = stockLocationRepository;
        this.movementRepository = movementRepository;
    }
    
    public ConsolidationReport generateReport(LocalDate date) {
        // Get opening stock for all locations
        Map<UUID, Map<UUID, Integer>> openingStock = stockLocationRepository
            .findOpeningStockForDate(date);

        // Get all movements for the day
        List<StockMovement> movements = movementRepository
            .findByDateBetween(
                date.atStartOfDay(),
                date.plusDays(1).atStartOfDay()
            );

        // Calculate current stock and movement totals
        Map<UUID, Map<UUID, StockSummary>> summaries = calculateStockSummaries(
            openingStock, 
            movements
        );

        return new ConsolidationReport(date, summaries);
    }

    private Map<UUID, Map<UUID, StockSummary>> calculateStockSummaries(
        Map<UUID, Map<UUID, Integer>> openingStock,
        List<StockMovement> movements
    ) {
        Map<UUID, Map<UUID, StockSummary>> summaries = new HashMap<>();

        // Initialize summaries with opening stock
        openingStock.forEach((locationId, stockItems) -> {
            stockItems.forEach((itemId, quantity) -> {
                summaries.computeIfAbsent(locationId, k -> new HashMap<>())
                    .put(itemId, new StockSummary(quantity, 0, 0, quantity));
            });
        });

        // Process movements
        movements.forEach(movement -> {
            StockSummary summary = summaries
                .get(movement.getLocation().getId())
                .get(movement.getStockItem().getId());

            if (movement.getType() == MovementType.IN) {
                summary.incoming += movement.getQuantity();
            } else {
                summary.outgoing += movement.getQuantity();
            }
            
            summary.remainder = summary.openingStock + summary.incoming - summary.outgoing;
        });

        return summaries;
    }
}