package com.example.finfam.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class MLClassifyRequest {
    private Integer userId;
    private List<TransactionItem> transactions;

    @Data
    public static class TransactionItem {
        private Integer id;
        private String name;
    }
}

