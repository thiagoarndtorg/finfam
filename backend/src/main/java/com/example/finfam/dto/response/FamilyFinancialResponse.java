package com.example.finfam.dto.response;

import com.example.finfam.model.Account;
import com.example.finfam.model.Transaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FamilyFinancialResponse {
    private  List<Account> accounts;
}