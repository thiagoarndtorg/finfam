package com.example.finfam.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "accounts")
@Data
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "family_id")
    private Integer familyId;

    @Column(name = "bank_id")
    private Integer bankId;

    @Column(name = "item_id")
    private String itemId;

    private String name;

    private BigDecimal balance;

    private String currency;

    private String color;

    @Column(name = "is_active")
    private Boolean isActive;

    @OneToMany(mappedBy = "accountId")
    private List<Transaction> transactions;
}