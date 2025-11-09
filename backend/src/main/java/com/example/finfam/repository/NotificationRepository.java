package com.example.finfam.repository;

import com.example.finfam.model.Notification;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByFamilyIdOrderByCreatedAtDesc(Integer familyId);

    List<Notification> findByFamilyIdAndNotificationType(Integer familyId, Notification.NotificationType type);

    Optional<Notification> findByBudgetIdAndCreatedAtAfter(Integer budgetId, LocalDateTime after);

    List<Notification> findByFamilyIdAndCategoryIdOrderByCreatedAtDesc(Integer familyId, Integer categoryId);

    List<Notification> findByFamilyIdAndUserIdOrderByCreatedAtDesc(Integer familyId, Integer userId);
}

