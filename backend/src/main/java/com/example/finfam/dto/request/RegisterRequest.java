package com.example.finfam.dto.request;

import lombok.*;


@Data
@Builder
public class RegisterRequest {
    private String username;
    private String avatar_url;
    private String email;
    private String password;
}
