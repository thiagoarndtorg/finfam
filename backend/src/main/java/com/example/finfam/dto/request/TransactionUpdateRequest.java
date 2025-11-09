package com.example.finfam.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TransactionUpdateRequest {
    private String pluggyId;
    private Integer categoryId;
    private Double amount;
    private String description;
    private LocalDate transactionDate;
    private String transactionType; // income | expense
}



