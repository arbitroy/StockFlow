package com.stockflow.api.model;

import com.stockflow.api.enums.SaleStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales")
@Getter @Setter
public class Sale extends BaseEntity {
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleItem> items = new ArrayList<>();

    private String customerName;
    private String customerPhone;

    @Column(nullable = false)
    private BigDecimal total;

    @Column(nullable = false, unique = true)
    private String reference;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private SaleStatus status = SaleStatus.PENDING;
}