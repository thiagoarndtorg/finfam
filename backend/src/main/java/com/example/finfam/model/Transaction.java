package com.example.finfam.model;

import com.example.finfam.utils.TransactionType;
import com.example.finfam.utils.TransactionTypeConverter;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "transactions", schema = "fin_fam_db")
@Data
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "pluggy_id", unique = true, nullable = false)
    private String pluggyId;

    @Column(name = "account_id")
    private Integer accountId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "family_id")
    private Integer familyId;


    @ManyToOne
    @JoinColumn(name = "category_id", referencedColumnName = "id")
    private Category category;

    private BigDecimal amount;

    private String description;

    @Column(name = "transaction_date")
    private LocalDate transactionDate;


    @Convert(converter = TransactionTypeConverter.class)
    @Column(name = "transaction_type")
    private TransactionType transactionType;
}