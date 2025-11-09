package com.example.finfam.dto.response;

import java.time.LocalDateTime;
import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationResponse {
    private Integer id;
    private Integer familyId;
    private Integer userId;
    private Integer categoryId;
    private Integer budgetId;
    private String notificationType;
    private String title;
    private String message;
    private LocalDateTime createdAt;
    private Map<String, Object> metadata;
    private String userName;
    private String categoryName;
}

