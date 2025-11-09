package com.example.finfam.dto.request;

import lombok.Data;

@Data
public class CategoryRequest {
    private Integer familyId;
    private String name;
    private String icon;
    private String color;
    private Boolean isIncome;
}



