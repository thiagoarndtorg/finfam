package com.example.finfam.dto.request;

import lombok.Data;

@Data
public class MLTrainRequest {
    private Integer userId;
    private String transactionName;
    private String category;
}

