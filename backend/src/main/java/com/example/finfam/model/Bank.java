package com.example.finfam.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "banks")
@Data
public class Bank {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private String bankCode;
    private String name;
}
