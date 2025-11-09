package com.example.finfam.service;

import com.example.finfam.dto.request.BudgetBulkRequest;
import com.example.finfam.dto.request.BudgetRequest;
import com.example.finfam.dto.request.NotificationRequest;
import com.example.finfam.dto.response.BudgetResponse;
import com.example.finfam.model.Budget;
import com.example.finfam.model.Category;
import com.example.finfam.model.User;
import com.example.finfam.repository.BudgetRepository;
import com.example.finfam.repository.CategoryRepository;
import com.example.finfam.repository.FamilyMemberRepository;
import com.example.finfam.repository.NotificationRepository;
import com.example.finfam.repository.TransactionRepository;
import com.example.finfam.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final NotificationService notificationService;
    private final TransactionRepository transactionRepository;
    private final NotificationRepository notificationRepository;

    public BudgetResponse create(BudgetRequest request) {
        if (request.getFamilyId() == null) {
            throw new IllegalArgumentException("familyId is required");
        }
        if (request.getBudgetType() == null) {
            throw new IllegalArgumentException("budgetType is required");
        }

        String type = request.getBudgetType();
        if (!"CATEGORY".equals(type) && !"MEMBER".equals(type)) {
            throw new IllegalArgumentException("budgetType must be CATEGORY or MEMBER");
        }

        Integer familyId = request.getFamilyId();
        Integer year = request.getYear();
        Integer month = request.getMonth();
        if (year == null || month == null) {
            throw new IllegalArgumentException("year and month are required");
        }

        Budget budget;
        if ("CATEGORY".equals(type)) {
            if (request.getCategoryId() == null) {
                throw new IllegalArgumentException("categoryId is required for CATEGORY budgets");
            }

            // Validate category belongs to family
            Category category = categoryRepository.findByIdAndFamilyId(request.getCategoryId(), familyId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found for this family"));

            Optional<Budget> existing = budgetRepository.findByFamilyIdAndCategoryIdAndYearAndMonth(
                familyId, category.getId(), year, month
            );

            budget = existing.orElseGet(Budget::new);
            budget.setFamilyId(familyId);
            budget.setCategoryId(category.getId());
            budget.setUserId(null);
            budget.setBudgetType(Budget.BudgetType.CATEGORY);
        } else {
            if (request.getUserId() == null) {
                throw new IllegalArgumentException("userId is required for MEMBER budgets");
            }

            // Validate user belongs to family
            boolean belongs = familyMemberRepository.existsByUserIdAndFamilyId(request.getUserId(), familyId);
            if (!belongs) {
                throw new IllegalArgumentException("User does not belong to this family");
            }

            Optional<Budget> existing = budgetRepository.findByFamilyIdAndUserIdAndYearAndMonth(
                familyId, request.getUserId(), year, month
            );

            budget = existing.orElseGet(Budget::new);
            budget.setFamilyId(familyId);
            budget.setUserId(request.getUserId());
            budget.setCategoryId(null);
            budget.setBudgetType(Budget.BudgetType.MEMBER);
        }

        budget.setYear(year);
        budget.setMonth(month);
        budget.setAmount(BigDecimal.valueOf(request.getAmount() != null ? request.getAmount() : 0.0));

        Budget saved = budgetRepository.save(budget);
        checkAndNotifyBudgetExceeded(saved);
        return toResponse(saved);
    }

    @Transactional
    public List<BudgetResponse> bulkUpsert(BudgetBulkRequest request) {
        if (request.getFamilyId() == null || request.getYear() == null || request.getMonth() == null) {
            throw new IllegalArgumentException("familyId, year and month are required");
        }
        Integer familyId = request.getFamilyId();
        Integer year = request.getYear();
        Integer month = request.getMonth();

        return request.getBudgets().stream().map(b -> {
            b.setFamilyId(familyId);
            b.setYear(year);
            b.setMonth(month);
            return create(b);
        }).collect(Collectors.toList());
    }

    public List<BudgetResponse> list(Integer familyId, Integer year, Integer month) {
        return budgetRepository.findByFamilyIdAndYearAndMonth(familyId, year, month)
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public void delete(Integer id, Integer familyId) {
        Budget budget = budgetRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Budget not found"));
        if (!budget.getFamilyId().equals(familyId)) {
            throw new IllegalArgumentException("Budget does not belong to this family");
        }
        budgetRepository.delete(budget);
    }

    private BudgetResponse toResponse(Budget budget) {
        BudgetResponse.BudgetResponseBuilder builder = BudgetResponse.builder()
            .id(budget.getId())
            .familyId(budget.getFamilyId())
            .categoryId(budget.getCategoryId())
            .userId(budget.getUserId())
            .budgetType(budget.getBudgetType() != null ? budget.getBudgetType().name() : null)
            .year(budget.getYear())
            .month(budget.getMonth())
            .amount(budget.getAmount() != null ? budget.getAmount().doubleValue() : null);

        if (budget.getCategoryId() != null) {
            String categoryName = null;
            if (budget.getCategory() != null) {
                categoryName = budget.getCategory().getName();
            } else {
                categoryName = categoryRepository.findById(budget.getCategoryId()).map(Category::getName).orElse(null);
            }
            builder.categoryName(categoryName);
        }

        if (budget.getUserId() != null) {
            String userName = null;
            if (budget.getUser() != null) {
                userName = budget.getUser().getUsername();
            } else {
                userName = userRepository.findById(budget.getUserId()).map(User::getUsername).orElse(null);
            }
            builder.userName(userName);
        }

        return builder.build();
    }

    void checkAndNotifyBudgetExceeded(Budget budget) {
        Integer year = budget.getYear();
        Integer month = budget.getMonth();
        Integer familyId = budget.getFamilyId();
        BigDecimal currentSpending;

        if (budget.getBudgetType() == Budget.BudgetType.CATEGORY) {
            if (budget.getCategoryId() == null) {
                return;
            }
            currentSpending = transactionRepository.sumExpensesByCategoryAndMonth(
                familyId, budget.getCategoryId(), year, month
            );
        } else {
            if (budget.getUserId() == null) {
                return;
            }
            currentSpending = transactionRepository.sumExpensesByUserAndMonth(
                familyId, budget.getUserId(), year, month
            );
        }

        if (currentSpending != null && currentSpending.compareTo(budget.getAmount()) > 0) {
            if (shouldCreateNotification(budget.getId(), currentSpending, year, month)) {
                createBudgetExceededNotification(budget, currentSpending);
            }
        }
    }

    private boolean shouldCreateNotification(Integer budgetId, BigDecimal currentSpending, Integer year, Integer month) {
        LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0);
        Optional<com.example.finfam.model.Notification> lastNotification = 
            notificationRepository.findByBudgetIdAndCreatedAtAfter(budgetId, startOfMonth);

        if (lastNotification.isEmpty()) {
            return true;
        }

        Map<String, Object> metadata = lastNotification.get().getMetadata();
        if (metadata == null || !metadata.containsKey("currentSpending")) {
            return true;
        }

        Object storedSpendingObj = metadata.get("currentSpending");
        if (!(storedSpendingObj instanceof Number)) {
            return true;
        }

        BigDecimal storedSpending = BigDecimal.valueOf(((Number) storedSpendingObj).doubleValue());
        return currentSpending.compareTo(storedSpending) > 0;
    }

    private void createBudgetExceededNotification(Budget budget, BigDecimal currentSpending) {
        NotificationRequest request = new NotificationRequest();
        request.setFamilyId(budget.getFamilyId());
        request.setUserId(budget.getUserId());
        request.setCategoryId(budget.getCategoryId());
        request.setBudgetId(budget.getId());
        request.setNotificationType("BUDGET_EXCEEDED");

        String categoryName = null;
        String userName = null;
        String title;
        BigDecimal exceededBy = currentSpending.subtract(budget.getAmount());

        if (budget.getBudgetType() == Budget.BudgetType.CATEGORY) {
            if (budget.getCategory() != null) {
                categoryName = budget.getCategory().getName();
            } else if (budget.getCategoryId() != null) {
                categoryName = categoryRepository.findById(budget.getCategoryId())
                    .map(Category::getName)
                    .orElse(null);
            }
            title = "Orçamento de " + (categoryName != null ? categoryName : "categoria") + " excedido";
        } else {
            if (budget.getUser() != null) {
                userName = budget.getUser().getUsername();
            } else if (budget.getUserId() != null) {
                userName = userRepository.findById(budget.getUserId())
                    .map(User::getUsername)
                    .orElse(null);
            }
            title = "Orçamento de " + (userName != null ? userName : "membro") + " excedido";
        }

        request.setTitle(title);
        request.setMessage(String.format(
            "Você gastou R$ %.2f de R$ %.2f este mês (%d/%d). Excedeu em R$ %.2f.",
            currentSpending.doubleValue(),
            budget.getAmount().doubleValue(),
            budget.getMonth(),
            budget.getYear(),
            exceededBy.doubleValue()
        ));

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("budgetAmount", budget.getAmount().doubleValue());
        metadata.put("currentSpending", currentSpending.doubleValue());
        metadata.put("exceededBy", exceededBy.doubleValue());
        metadata.put("month", budget.getMonth());
        metadata.put("year", budget.getYear());
        if (categoryName != null) {
            metadata.put("categoryName", categoryName);
        }
        if (userName != null) {
            metadata.put("userName", userName);
        }
        request.setMetadata(metadata);

        notificationService.create(request);
    }
}



