package com.example.finfam.dto;

import lombok.Builder;
import lombok.Data;


@Data
@Builder
public class UserDTO {
    private Integer userId;
    private String email;
    private String username;
}
