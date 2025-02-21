package com.stockflow.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailySalesSummary {
    private LocalDate date;
    private Long totalSales;
    private BigDecimal totalAmount;
}