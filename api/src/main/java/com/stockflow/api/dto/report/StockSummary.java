package com.stockflow.api.dto.report;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StockSummary {
    public int openingStock;
    public int incoming;
    public int outgoing;
    public int remainder;
}
