package com.example.finfam.service;

import com.example.finfam.dto.request.TransactionCreateRequest;
import com.example.finfam.dto.request.TransactionUpdateRequest;
import com.example.finfam.model.Account;
import com.example.finfam.model.Category;
import com.example.finfam.model.Transaction;
import com.example.finfam.repository.AccountRepository;
import com.example.finfam.repository.BudgetRepository;
import com.example.finfam.repository.CategoryRepository;
import com.example.finfam.repository.TransactionRepository;
import com.example.finfam.utils.TransactionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private BudgetService budgetService;

    @Mock
    private BudgetRepository budgetRepository;

    @InjectMocks
    private TransactionService transactionService;

    private Account account;
    private Category category;
    private Transaction transaction;
    private TransactionCreateRequest createRequest;
    private TransactionUpdateRequest updateRequest;

    @BeforeEach
    void setUp() {
        account = new Account();
        account.setId(1);
        account.setName("Test Account");

        category = new Category();
        category.setId(1);
        category.setName("Food");

        transaction = Transaction.builder()
                .id(1)
                .accountId(1)
                .userId(1)
                .familyId(1)
                .category(category)
                .amount(BigDecimal.valueOf(100.0))
                .description("Test Transaction")
                .transactionDate(LocalDate.now())
                .transactionType(TransactionType.EXPENSE)
                .pluggyId("pluggy-123")
                .build();

        createRequest = new TransactionCreateRequest();
        createRequest.setAccountId(1);
        createRequest.setUserId(1);
        createRequest.setFamilyId(1);
        createRequest.setCategoryId(1);
        createRequest.setAmount(100.0);
        createRequest.setDescription("Test Transaction");
        createRequest.setTransactionDate(LocalDate.now());
        createRequest.setTransactionType("EXPENSE");
        createRequest.setPluggyId("pluggy-123");

        updateRequest = new TransactionUpdateRequest();
        updateRequest.setCategoryId(1);
        updateRequest.setAmount(150.0);
        updateRequest.setDescription("Updated Transaction");
    }

    @Test
    void testCreate_Success() {
        when(accountRepository.findById(1)).thenReturn(Optional.of(account));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(transactionRepository.findByPluggyId("pluggy-123")).thenReturn(Optional.empty());
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(budgetRepository.findByFamilyIdAndCategoryIdAndYearAndMonth(anyInt(), anyInt(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(budgetRepository.findByFamilyIdAndUserIdAndYearAndMonth(anyInt(), anyInt(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());

        Transaction result = transactionService.create(createRequest);

        assertNotNull(result);
        assertEquals(1, result.getId());
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void testCreate_AccountNotFound_ThrowsException() {
        when(accountRepository.findById(1)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            transactionService.create(createRequest);
        });

        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    void testCreate_DuplicatePluggyId_ReturnsExisting() {
        when(accountRepository.findById(1)).thenReturn(Optional.of(account));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(transactionRepository.findByPluggyId("pluggy-123")).thenReturn(Optional.of(transaction));

        Transaction result = transactionService.create(createRequest);

        assertNotNull(result);
        assertEquals(transaction, result);
        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    void testUpdate_Success() {
        when(transactionRepository.findById(1)).thenReturn(Optional.of(transaction));
        when(categoryRepository.findById(1)).thenReturn(Optional.of(category));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(transaction);
        when(budgetRepository.findByFamilyIdAndCategoryIdAndYearAndMonth(anyInt(), anyInt(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());
        when(budgetRepository.findByFamilyIdAndUserIdAndYearAndMonth(anyInt(), anyInt(), anyInt(), anyInt()))
                .thenReturn(Optional.empty());

        Transaction result = transactionService.update(1, 1, updateRequest);

        assertNotNull(result);
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void testUpdate_TransactionNotFound_ThrowsException() {
        when(transactionRepository.findById(1)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            transactionService.update(1, 1, updateRequest);
        });

        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    void testUpdate_WrongFamily_ThrowsException() {
        transaction.setFamilyId(2);
        when(transactionRepository.findById(1)).thenReturn(Optional.of(transaction));

        assertThrows(IllegalArgumentException.class, () -> {
            transactionService.update(1, 1, updateRequest);
        });

        verify(transactionRepository, never()).save(any(Transaction.class));
    }

    @Test
    void testDelete_Success() {
        when(transactionRepository.findById(1)).thenReturn(Optional.of(transaction));
        doNothing().when(transactionRepository).delete(any(Transaction.class));

        assertDoesNotThrow(() -> {
            transactionService.delete(1, 1);
        });

        verify(transactionRepository).delete(transaction);
    }

    @Test
    void testDelete_TransactionNotFound_ThrowsException() {
        when(transactionRepository.findById(1)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> {
            transactionService.delete(1, 1);
        });

        verify(transactionRepository, never()).delete(any(Transaction.class));
    }

    @Test
    void testGetTransactionsByFamily() {
        when(transactionRepository.findByFamilyId(1)).thenReturn(java.util.List.of(transaction));

        var result = transactionService.getTransactionsByFamily(1);

        assertNotNull(result);
        assertEquals(1, result.size());
        verify(transactionRepository).findByFamilyId(1);
    }
}

