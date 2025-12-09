package com.example.finfam.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TransactionCreateRequest {
    private String pluggyId; 
    private Integer accountId;
    private Integer userId;
    private Integer familyId;
    private Integer categoryId; // optional
    private Double amount;
    private String description;
    private LocalDate transactionDate;
    private String transactionType; // income | expense
}



