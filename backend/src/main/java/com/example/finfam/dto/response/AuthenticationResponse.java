package com.example.finfam.dto.response;
import lombok.*;

@Data
@Builder
public class AuthenticationResponse {
    private String token;
    private String username;
    private String avatar_url;
    private String email;
}
