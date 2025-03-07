package com.stockflow.api.repository;

import com.stockflow.api.model.StockLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockLocationRepository extends JpaRepository<StockLocation, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT sl FROM StockLocation sl WHERE sl.stockItem.id = :itemId AND sl.location.id = :locationId")
    Optional<StockLocation> findByStockItemAndLocationWithLock(
            @Param("itemId") UUID itemId,
            @Param("locationId") UUID locationId);

    @Modifying
    @Query("UPDATE StockLocation sl SET sl.openingQuantity = sl.quantity")
    void updateAllOpeningQuantities();

    @Query("""
                SELECT
                    sl.location.id as locationId,
                    sl.stockItem.id as itemId,
                    sl.openingQuantity as quantity
                FROM StockLocation sl
                WHERE DATE(sl.updatedAt) <= :date
            """)
    Map<UUID, Map<UUID, Integer>> findOpeningStockForDate(@Param("date") LocalDate date);

    // Added methods for LocationService
    List<StockLocation> findByLocationId(UUID locationId);

    @Query("SELECT COUNT(sl) FROM StockLocation sl WHERE sl.location.id = :locationId")
    long countByLocationId(@Param("locationId") UUID locationId);

    @Query("SELECT DISTINCT sl.location.id FROM StockLocation sl")
    List<UUID> findDistinctLocationIds();
}