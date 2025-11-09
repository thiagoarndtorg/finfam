package com.example.finfam.dto.response;


import com.example.finfam.utils.BankEnum;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OpenBankStatementResponse {
        private String itemId;
        private BankEnum bankEnum;
        private BigDecimal balance;
        private List<OpenBankTransactionResponse> transactions;
}
