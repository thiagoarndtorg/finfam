package com.example.finfam.dto.response;


import com.example.finfam.utils.BankEnum;
import com.example.finfam.utils.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor

public class OpenBankTransactionResponse {
    public String id;
    public String date;
    public String description;
    public double amount;
    public TransactionType transactionType;
    public BankEnum bankName;
}
