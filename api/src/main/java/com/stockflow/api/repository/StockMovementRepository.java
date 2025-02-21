package com.stockflow.api.repository;

import com.stockflow.api.dto.report.StockMovementReport;
import com.stockflow.api.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {
    List<StockMovement> findByStockItemId(UUID stockItemId);
    
    @Query("SELECT m FROM StockMovement m WHERE m.createdAt BETWEEN :startDate AND :endDate")
    List<StockMovement> findByDateBetween(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("""
        SELECT NEW com.stockflow.api.dto.report.StockMovementReport(
            s.name,
            s.sku,
            m.type,
            m.quantity,
            m.createdAt,
            m.reference
        )
        FROM StockMovement m
        JOIN m.stockItem s
        WHERE m.createdAt BETWEEN :startDate AND :endDate
        ORDER BY m.createdAt DESC
    """)
    List<StockMovementReport> findMovementsInPeriod(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}