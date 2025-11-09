package com.example.finfam.dto.request;

import lombok.*;

@Data
@Builder
public class LoginRequest {

    String email;
    String password;
}
