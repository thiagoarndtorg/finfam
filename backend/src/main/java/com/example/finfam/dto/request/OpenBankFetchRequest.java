package com.example.finfam.dto.request;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OpenBankFetchRequest {
    String itemId;
    Integer familyId;
}
