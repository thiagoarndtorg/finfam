package com.example.finfam.dto.request;

import lombok.Data;

@Data
public class GoogleAuthRequest {
    private String idToken;
    private String email;
    private String name;
    private String picture;
    private String googleId;
}

