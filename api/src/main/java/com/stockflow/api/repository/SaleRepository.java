package com.stockflow.api.repository;

import com.stockflow.api.dto.DailySalesSummary;
import com.stockflow.api.enums.SaleStatus;
import com.stockflow.api.model.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SaleRepository extends JpaRepository<Sale, UUID> {
    Optional<Sale> findByReference(String reference);
    
    // Finds sales within a date range with a specific status
    List<Sale> findByStatusAndCreatedAtBetween(
        SaleStatus status, 
        LocalDateTime startDate, 
        LocalDateTime endDate
    );
    
    // Gets daily sales summary - modified to properly handle DATE function
    @Query("""
        SELECT NEW com.stockflow.api.dto.DailySalesSummary(
            CAST(FUNCTION('DATE', s.createdAt) AS java.time.LocalDate),
            COUNT(s),
            SUM(s.total)
        )
        FROM Sale s
        WHERE s.status = :status
        AND s.createdAt BETWEEN :startDate AND :endDate
        GROUP BY FUNCTION('DATE', s.createdAt)
        ORDER BY FUNCTION('DATE', s.createdAt)
    """)
    List<DailySalesSummary> getDailySalesSummary(
        @Param("status") SaleStatus status,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
}