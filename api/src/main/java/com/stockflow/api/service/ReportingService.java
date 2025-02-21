package com.stockflow.api.service;

import com.stockflow.api.dto.report.*;
import com.stockflow.api.repository.SaleRepository;
import com.stockflow.api.repository.StockItemRepository;
import com.stockflow.api.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportingService {
    private final StockItemRepository stockItemRepository;
    private final StockMovementRepository movementRepository;
    private final SaleRepository saleRepository;

    public List<StockReport> generateStockReport(LocalDateTime startDate, LocalDateTime endDate) {
        return stockItemRepository.generateStockReport(startDate, endDate);
    }

    public List<StockMovementReport> generateMovementReport(LocalDateTime startDate, LocalDateTime endDate) {
        return movementRepository.findMovementsInPeriod(startDate, endDate);
    }
}