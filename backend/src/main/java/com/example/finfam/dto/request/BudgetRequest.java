package com.example.finfam.dto.request;

import lombok.Data;

@Data
public class BudgetRequest {
    private Integer familyId;
    private Integer categoryId;
    private Integer userId;
    private String budgetType; // CATEGORY or MEMBER
    private Integer year;
    private Integer month;
    private Double amount;
}




