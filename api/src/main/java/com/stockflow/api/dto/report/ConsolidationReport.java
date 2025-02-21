package com.stockflow.api.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConsolidationReport {
    private LocalDate date;
    private Map<UUID, Map<UUID, StockSummary>> summaries;
}