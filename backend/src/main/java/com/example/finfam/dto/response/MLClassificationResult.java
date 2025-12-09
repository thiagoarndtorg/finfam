package com.example.finfam.dto.response;

import lombok.Data;

@Data
public class MLClassificationResult {
    private Integer id;
    private String predictedCategory;
    private Double confidence;
}

