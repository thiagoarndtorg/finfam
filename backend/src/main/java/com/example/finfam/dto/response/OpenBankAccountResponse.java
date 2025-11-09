package com.example.finfam.dto.response;

import com.example.finfam.utils.BankEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OpenBankAccountResponse {
        public String id;
        public String type;
        public double balance;
        private BankEnum bankName;
}
