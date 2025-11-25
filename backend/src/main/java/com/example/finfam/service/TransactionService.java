package com.example.finfam.service;

import com.example.finfam.dto.TransactionDTO;
import com.example.finfam.dto.request.TransactionCreateRequest;
import com.example.finfam.dto.request.TransactionUpdateRequest;
import com.example.finfam.model.Account;
import com.example.finfam.model.Budget;
import com.example.finfam.model.Category;
import com.example.finfam.model.Transaction;
import com.example.finfam.repository.AccountRepository;
import com.example.finfam.repository.BudgetRepository;
import com.example.finfam.repository.CategoryRepository;
import com.example.finfam.repository.TransactionRepository;
import com.example.finfam.utils.TransactionType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final TransactionRepository transactionRepo;
    private final AccountRepository accountRepo;
    private final CategoryRepository categoryRepo;
    private final BudgetService budgetService;
    private final BudgetRepository budgetRepository;

    // Cria ou retorna transação existente pelo pluggyId
    public Transaction create(TransactionCreateRequest request) {
        Account account = accountRepo.findById(request.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found: " + request.getAccountId()));

        Category category = request.getCategoryId() != null
                ? categoryRepo.findById(request.getCategoryId()).orElse(null)
                : null;

        Transaction existing = transactionRepo.findByPluggyId(request.getPluggyId()).orElse(null);
        if (existing != null) return existing;

        Transaction transaction = Transaction.builder()
                .accountId(account.getId())
                .userId(request.getUserId())
                .familyId(request.getFamilyId())
                .category(category)
                .amount(BigDecimal.valueOf(request.getAmount()))
                .description(request.getDescription())
                .transactionDate(request.getTransactionDate())
                .transactionType(TransactionType.fromString(request.getTransactionType()))
                .pluggyId(request.getPluggyId()) // ✅ Set pluggyId
                .build();

        Transaction saved = transactionRepo.save(transaction);
        checkBudgetsAfterTransaction(saved);
        return saved;
    }

    // Cria batch de transações a partir de TransactionCreateRequest e pluggyId
    public List<Transaction> createBatch(List<TransactionCreateRequest> requests) {
        return requests.stream()
                .map(this::create)
                .collect(Collectors.toList());
    }

    // Salva lista de TransactionDTO (converte para TransactionCreateRequest + pluggyId)
    @Transactional
    public List<Transaction> saveTransactions(List<TransactionDTO> requests) {
        return requests.stream()
                .map(r -> {
                    TransactionCreateRequest c = new TransactionCreateRequest();
                    c.setAccountId(r.getAccountId());
                    c.setUserId(r.getUserId());
                    c.setFamilyId(r.getFamilyId());
                    c.setCategoryId(null);
                    c.setAmount(r.getAmount());
                    c.setDescription(r.getDescription());
                    c.setTransactionDate(r.getTransactionDate());
                    c.setTransactionType(r.getTransactionType());
                    c.setPluggyId(r.getPluggyId()); // ✅ Passando pluggyId
                    return create(c);
                })
                .collect(Collectors.toList());
    }

    // Atualizações, deleções e consultas permanecem iguais
    public Transaction update(Integer id, Integer familyId, TransactionUpdateRequest request) {
        Transaction existing = transactionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
        if (!existing.getFamilyId().equals(familyId)) {
            throw new IllegalArgumentException("Transaction does not belong to this family");
        }
        Category category = categoryRepo.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));

        boolean categoryChanged = request.getCategoryId() != null && 
            (existing.getCategory() == null || !existing.getCategory().getId().equals(request.getCategoryId()));
        
        if (request.getCategoryId() != null) existing.setCategory(category);
        if (request.getAmount() != null) existing.setAmount(BigDecimal.valueOf(request.getAmount()));
        if (request.getDescription() != null) existing.setDescription(request.getDescription());
        if (request.getTransactionDate() != null) existing.setTransactionDate(request.getTransactionDate());
        if (request.getTransactionType() != null)
            existing.setTransactionType(TransactionType.valueOf(request.getTransactionType().toUpperCase()));
        Transaction updated = transactionRepo.save(existing);
        
        // Check budgets for this specific transaction
        checkBudgetsAfterTransaction(updated);
        
        // If category was assigned/changed, also check all budgets for the month to catch any exceedances
        if (categoryChanged && updated.getTransactionType() == TransactionType.EXPENSE) {
            int year = updated.getTransactionDate().getYear();
            int month = updated.getTransactionDate().getMonthValue();
            budgetService.checkAllBudgetsForMonth(updated.getFamilyId(), year, month);
        }
        
        return updated;
    }

    public void delete(Integer id, Integer familyId) {
        Transaction existing = transactionRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));
        if (!existing.getFamilyId().equals(familyId)) {
            throw new IllegalArgumentException("Transaction does not belong to this family");
        }
        transactionRepo.delete(existing);
    }

    public List<Transaction> getTransactionsByAccount(int accountId) {
        return transactionRepo.findByAccountId(accountId);
    }

    public List<Transaction> getTransactionsByUserAndFamily(int userId, int familyId) {
        return transactionRepo.findByUserIdAndFamilyId(userId, familyId);
    }

    public List<Transaction> getTransactionsByDateRange(LocalDate startDate, LocalDate endDate) {
        return transactionRepo.findByTransactionDateBetween(startDate, endDate);
    }

    public List<Transaction> getTransactionsByFamily(Integer familyId) {
        return transactionRepo.findByFamilyId(familyId);
    }

    private void checkBudgetsAfterTransaction(Transaction transaction) {
        if (transaction.getTransactionType() != TransactionType.EXPENSE) {
            return;
        }

        int year = transaction.getTransactionDate().getYear();
        int month = transaction.getTransactionDate().getMonthValue();
        Integer familyId = transaction.getFamilyId();

        if (transaction.getCategory() != null && transaction.getCategory().getId() != null) {
            Optional<Budget> categoryBudget = budgetRepository.findByFamilyIdAndCategoryIdAndYearAndMonth(
                familyId, transaction.getCategory().getId(), year, month
            );
            categoryBudget.ifPresent(budgetService::checkAndNotifyBudgetExceeded);
        }

        Optional<Budget> memberBudget = budgetRepository.findByFamilyIdAndUserIdAndYearAndMonth(
            familyId, transaction.getUserId(), year, month
        );
        memberBudget.ifPresent(budgetService::checkAndNotifyBudgetExceeded);
    }
}
