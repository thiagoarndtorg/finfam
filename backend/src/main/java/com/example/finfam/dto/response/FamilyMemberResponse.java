package com.example.finfam.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FamilyMemberResponse {
    private Integer id;
    private Integer userId;
    private String username;
    private String email;
    private String avatarUrl;
    private String role;
    private String status;
}




