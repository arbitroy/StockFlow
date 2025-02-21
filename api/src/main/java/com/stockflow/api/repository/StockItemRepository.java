package com.stockflow.api.repository;

import com.stockflow.api.dto.report.StockReport;
import com.stockflow.api.enums.StockStatus;
import com.stockflow.api.model.StockItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockItemRepository extends JpaRepository<StockItem, UUID> {
    Optional<StockItem> findBySku(String sku);

    List<StockItem> findByStatus(StockStatus status);

    List<StockItem> findByQuantityLessThanAndStatus(Integer threshold, StockStatus status);

    @Lock(LockModeType.OPTIMISTIC)
    @Query("SELECT s FROM StockItem s WHERE s.id = :id")
    Optional<StockItem> findByIdWithLock(@Param("id") UUID id);

    @Query("""
                SELECT NEW com.stockflow.api.dto.report.StockReport(
                    si.sku,
                    si.name,
                    si.quantity,
                    si.status,
                    si.price * si.quantity,
                    COUNT(DISTINCT sm.id),
                    COUNT(DISTINCT sal.id)
                )
                FROM StockItem si
                LEFT JOIN StockMovement sm ON sm.stockItem = si
                    AND sm.createdAt BETWEEN :startDate AND :endDate
                LEFT JOIN SaleItem sai ON sai.stockItem = si
                LEFT JOIN Sale sal ON sai.sale = sal
                    AND sal.createdAt BETWEEN :startDate AND :endDate
                GROUP BY si.id, si.sku, si.name, si.quantity, si.status, si.price
            """)
    List<StockReport> generateStockReport(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}