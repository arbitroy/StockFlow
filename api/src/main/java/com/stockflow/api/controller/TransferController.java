package com.stockflow.api.controller;

import com.stockflow.api.dto.TransferRequest;
import com.stockflow.api.model.StockTransfer;
import com.stockflow.api.service.StockTransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {
    private final StockTransferService transferService;

    @PostMapping
    public ResponseEntity<StockTransfer> transferStock(@Valid @RequestBody TransferRequest request) {
        StockTransfer transfer = transferService.transferStock(request);
        return ResponseEntity.ok(transfer);
    }
}