package com.example.finfam.service;

import com.example.finfam.dto.request.NotificationRequest;
import com.example.finfam.dto.response.NotificationResponse;
import com.example.finfam.model.Category;
import com.example.finfam.model.Notification;
import com.example.finfam.model.User;
import com.example.finfam.repository.BudgetRepository;
import com.example.finfam.repository.CategoryRepository;
import com.example.finfam.repository.NotificationRepository;
import com.example.finfam.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final BudgetRepository budgetRepository;

    public NotificationResponse create(NotificationRequest request) {
        if (request.getFamilyId() == null) {
            throw new IllegalArgumentException("familyId is required");
        }
        if (request.getNotificationType() == null) {
            throw new IllegalArgumentException("notificationType is required");
        }
        if (request.getTitle() == null || request.getTitle().isEmpty()) {
            throw new IllegalArgumentException("title is required");
        }
        if (request.getMessage() == null || request.getMessage().isEmpty()) {
            throw new IllegalArgumentException("message is required");
        }

        Notification.NotificationType notificationTypeEnum;
        try {
            notificationTypeEnum = Notification.NotificationType.valueOf(request.getNotificationType());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid notificationType: " + request.getNotificationType());
        }

        Notification notification = new Notification();
        notification.setFamilyId(request.getFamilyId());
        notification.setUserId(request.getUserId());
        notification.setCategoryId(request.getCategoryId());
        notification.setBudgetId(request.getBudgetId());
        notification.setNotificationType(notificationTypeEnum);
        notification.setTitle(request.getTitle());
        notification.setMessage(request.getMessage());
        notification.setCreatedAt(LocalDateTime.now());
        notification.setMetadata(request.getMetadata() != null ? request.getMetadata() : new HashMap<>());

        Notification saved = notificationRepository.save(notification);
        return toResponse(saved);
    }

    public List<NotificationResponse> getByFamilyId(Integer familyId) {
        return notificationRepository.findByFamilyIdOrderByCreatedAtDesc(familyId)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<NotificationResponse> getByFamilyIdAndType(Integer familyId, String type) {
        Notification.NotificationType notificationTypeEnum;
        try {
            notificationTypeEnum = Notification.NotificationType.valueOf(type);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid notificationType: " + type);
        }

        return notificationRepository.findByFamilyIdAndNotificationType(familyId, notificationTypeEnum)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public void delete(Integer id, Integer familyId) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!notification.getFamilyId().equals(familyId)) {
            throw new IllegalArgumentException("Notification does not belong to this family");
        }
        notificationRepository.delete(notification);
    }

    private NotificationResponse toResponse(Notification notification) {
        NotificationResponse.NotificationResponseBuilder builder = NotificationResponse.builder()
            .id(notification.getId())
            .familyId(notification.getFamilyId())
            .userId(notification.getUserId())
            .categoryId(notification.getCategoryId())
            .budgetId(notification.getBudgetId())
            .notificationType(notification.getNotificationType() != null ? notification.getNotificationType().name() : null)
            .title(notification.getTitle())
            .message(notification.getMessage())
            .createdAt(notification.getCreatedAt())
            .metadata(notification.getMetadata() != null ? notification.getMetadata() : new HashMap<>());

        if (notification.getCategoryId() != null) {
            String categoryName = null;
            if (notification.getCategory() != null) {
                categoryName = notification.getCategory().getName();
            } else {
                categoryName = categoryRepository.findById(notification.getCategoryId())
                    .map(Category::getName)
                    .orElse(null);
            }
            builder.categoryName(categoryName);
        }

        if (notification.getUserId() != null) {
            String userName = null;
            if (notification.getUser() != null) {
                userName = notification.getUser().getUsername();
            } else {
                userName = userRepository.findById(notification.getUserId())
                    .map(User::getUsername)
                    .orElse(null);
            }
            builder.userName(userName);
        }

        return builder.build();
    }
}

