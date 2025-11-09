package com.example.finfam.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "categories")
@Data
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Integer familyId;
    private String name;
    private String icon;
    private String color;
    private Boolean isIncome;
    private Boolean isSystem;
}
