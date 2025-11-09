package com.example.finfam.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UpdateMemberRoleRequest {
    private String role;
}



