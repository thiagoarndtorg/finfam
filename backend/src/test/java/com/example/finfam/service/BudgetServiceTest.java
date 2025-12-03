package com.example.finfam.service;

import com.example.finfam.dto.request.BudgetRequest;
import com.example.finfam.dto.response.BudgetResponse;
import com.example.finfam.exception.CustomException;
import com.example.finfam.model.Budget;
import com.example.finfam.model.Category;
import com.example.finfam.model.User;
import com.example.finfam.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetServiceTest {

    @Mock
    private BudgetRepository budgetRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FamilyMemberRepository familyMemberRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private FamilyMemberService familyMemberService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private BudgetService budgetService;

    private BudgetRequest budgetRequest;
    private Budget budget;
    private Category category;
    private String validToken;

    @BeforeEach
    void setUp() {
        validToken = "Bearer validToken";

        budgetRequest = new BudgetRequest();
        budgetRequest.setFamilyId(1);
        budgetRequest.setCategoryId(1);
        budgetRequest.setBudgetType("CATEGORY");
        budgetRequest.setYear(2024);
        budgetRequest.setMonth(11);
        budgetRequest.setAmount(1000.0);

        category = new Category();
        category.setId(1);
        category.setName("Food");
        category.setFamilyId(1);

        budget = new Budget();
        budget.setId(1);
        budget.setFamilyId(1);
        budget.setCategoryId(1);
        budget.setYear(2024);
        budget.setMonth(11);
        budget.setAmount(BigDecimal.valueOf(1000.0));
        budget.setBudgetType(Budget.BudgetType.CATEGORY);
    }

    @Test
    void testCreate_CategoryBudget_Success() {
        when(jwtService.extractUserId(anyString())).thenReturn(1);
        when(familyMemberService.isAdmin(1, 1)).thenReturn(true);
        when(categoryRepository.findByIdAndFamilyId(1, 1)).thenReturn(Optional.of(category));
        when(budgetRepository.findByFamilyIdAndCategoryIdAndYearAndMonth(1, 1, 2024, 11))
                .thenReturn(Optional.empty());
        when(budgetRepository.save(any(Budget.class))).thenReturn(budget);
        when(transactionRepository.sumExpensesByCategoryAndMonth(anyInt(), anyInt(), anyInt(), anyInt()))
                .thenReturn(BigDecimal.ZERO);

        BudgetResponse response = budgetService.create(budgetRequest, validToken);

        assertNotNull(response);
        assertEquals(1, response.getId());
        verify(budgetRepository).save(any(Budget.class));
    }

    @Test
    void testCreate_NotAdmin_ThrowsException() {
        when(jwtService.extractUserId(anyString())).thenReturn(2);
        when(familyMemberService.isAdmin(2, 1)).thenReturn(false);

        assertThrows(CustomException.class, () -> {
            budgetService.create(budgetRequest, validToken);
        });

        verify(budgetRepository, never()).save(any(Budget.class));
    }

    @Test
    void testCreate_MissingFamilyId_ThrowsException() {
        budgetRequest.setFamilyId(null);

        assertThrows(IllegalArgumentException.class, () -> {
            budgetService.create(budgetRequest, validToken);
        });

        verify(budgetRepository, never()).save(any(Budget.class));
    }

    @Test
    void testCreate_CategoryNotFound_ThrowsException() {
        when(jwtService.extractUserId(anyString())).thenReturn(1);
        when(familyMemberService.isAdmin(1, 1)).thenReturn(true);
        when(categoryRepository.findByIdAndFamilyId(1, 1)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            budgetService.create(budgetRequest, validToken);
        });

        verify(budgetRepository, never()).save(any(Budget.class));
    }

    @Test
    void testDelete_Success() {
        when(jwtService.extractUserId(anyString())).thenReturn(1);
        when(familyMemberService.isAdmin(1, 1)).thenReturn(true);
        when(budgetRepository.findById(1)).thenReturn(Optional.of(budget));
        doNothing().when(budgetRepository).delete(any(Budget.class));

        assertDoesNotThrow(() -> {
            budgetService.delete(1, 1, validToken);
        });

        verify(budgetRepository).delete(budget);
    }

    @Test
    void testDelete_NotAdmin_ThrowsException() {
        when(jwtService.extractUserId(anyString())).thenReturn(2);
        when(familyMemberService.isAdmin(2, 1)).thenReturn(false);

        assertThrows(CustomException.class, () -> {
            budgetService.delete(1, 1, validToken);
        });

        verify(budgetRepository, never()).delete(any(Budget.class));
    }
}

