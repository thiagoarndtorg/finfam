package com.example.finfam.dto.request;

import java.util.Map;
import lombok.Data;

@Data
public class NotificationRequest {
    private Integer familyId;
    private Integer userId;
    private Integer categoryId;
    private Integer budgetId;
    private String notificationType;
    private String title;
    private String message;
    private Map<String, Object> metadata;
}

