package com.example.finfam.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FamilyDTO {
    private Integer id;
    private String name;
    private Integer createdBy;
}
