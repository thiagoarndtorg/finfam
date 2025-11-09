package com.example.finfam.dto.request;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class OpenBankAuthRequest {
    public String clientId;
    public String clientSecret;
}
