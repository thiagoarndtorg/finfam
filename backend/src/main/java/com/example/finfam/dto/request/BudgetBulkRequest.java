package com.example.finfam.dto.request;

import java.util.List;
import lombok.Data;

@Data
public class BudgetBulkRequest {
    private Integer familyId;
    private Integer year;
    private Integer month;
    private List<BudgetRequest> budgets;
}




