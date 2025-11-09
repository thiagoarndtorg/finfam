package com.example.finfam.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BudgetResponse {
    private Integer id;
    private Integer familyId;
    private Integer categoryId;
    private Integer userId;
    private String budgetType;
    private Integer year;
    private Integer month;
    private Double amount;
    private String categoryName;
    private String userName;
}




