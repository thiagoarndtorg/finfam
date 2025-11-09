package com.example.finfam.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InviteFamilyMemberRequest {
    private String email;
    private String role;
}



