package com.example.finfam.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CategoryResponse {
    private Integer id;
    private Integer familyId;
    private String name;
    private String icon;
    private String color;
    private Boolean isIncome;
    private Boolean isSystem;
}



