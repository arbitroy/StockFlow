package com.stockflow.api.model;

import com.stockflow.api.enums.StockStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "stock_items")
@Getter @Setter
public class StockItem extends BaseEntity {
    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String sku;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StockStatus status = StockStatus.ACTIVE;

    @Version
    private Long version;
}