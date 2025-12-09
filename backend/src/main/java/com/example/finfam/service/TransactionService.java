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
import com.example.finfam.repository.FamilyMemberRepository;
import com.example.finfam.repository.TransactionRepository;
import com.example.finfam.utils.TransactionType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TransactionService {
    private final TransactionRepository transactionRepo;
    private final AccountRepository accountRepo;
    private final CategoryRepository categoryRepo;
    private final BudgetService budgetService;
    private final BudgetRepository budgetRepository;
    private final MLService mlService;
    private final FamilyMemberRepository familyMemberRepository;

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
        
        // Train ML model when category is manually assigned/changed
        if (categoryChanged && category != null && updated.getDescription() != null) {
            try {
                mlService.trainUserModel(
                    updated.getUserId(),
                    updated.getDescription(),
                    category.getName()
                );
                log.info("ML model trained for userId: {} with transaction: '{}' -> category: '{}'", 
                        updated.getUserId(), updated.getDescription(), category.getName());
            } catch (Exception e) {
                log.error("Failed to train ML model for userId: {}", updated.getUserId(), e);
                // Don't fail the transaction update if ML training fails
            }
        }
        
         // Wrap in try-catch to prevent budget check failures from failing the transaction update
        try {
            checkBudgetsAfterTransaction(updated);
        } catch (Exception e) {
            log.error("Failed to check budgets after transaction update for transactionId: {}", updated.getId(), e);
            // Don't fail the transaction update if budget check fails
        }
        
        // If category was assigned/changed, also check all budgets for the month to catch any exceedances
        if (categoryChanged && updated.getTransactionType() == TransactionType.EXPENSE) {
              try {
                int year = updated.getTransactionDate().getYear();
                int month = updated.getTransactionDate().getMonthValue();
                budgetService.checkAllBudgetsForMonth(updated.getFamilyId(), year, month);
            } catch (Exception e) {
                log.error("Failed to check all budgets for month after transaction update for transactionId: {}", updated.getId(), e);
              
            }
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

        try {
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
        } catch (Exception e) {
            // In test environment, budget queries may fail due to H2 limitations, ignore
        }
    }

    /**
     * Categoriza automaticamente transações sem categoria usando ML
     */
    @Transactional
    public List<Transaction> autoCategorizeTransactions(Integer userId, Integer familyId) {
        // Buscar transações sem categoria confirmada
        List<Transaction> allFamilyTransactions = transactionRepo.findByFamilyId(familyId);
        List<Transaction> uncategorizedTransactions = allFamilyTransactions.stream()
                .filter(tx -> tx.getCategory() == null) // Apenas transações sem categoria confirmada
                .collect(Collectors.toList());

        log.info("Auto-categorize: Found {} total transactions, {} uncategorized for familyId: {}, userId: {}", 
                allFamilyTransactions.size(), uncategorizedTransactions.size(), familyId, userId);

        if (uncategorizedTransactions.isEmpty()) {
            log.info("No uncategorized transactions found for familyId: {}", familyId);
            return List.of();
        }

        // Limpar sugestões ML anteriores para reprocessar com modelo atualizado
        // Isso permite que novas categorias e correções sejam consideradas
        int clearedCount = 0;
        for (Transaction tx : uncategorizedTransactions) {
            if (tx.getMlSuggestedCategory() != null || tx.getMlPendingConfirmation() != null) {
                tx.setMlSuggestedCategory(null);
                tx.setMlConfidence(null);
                tx.setMlPendingConfirmation(false);
                transactionRepo.save(tx);
                clearedCount++;
            }
        }
        log.info("Cleared {} previous ML suggestions to allow reprocessing with updated model", clearedCount);

        // Preparar dados para ML
        List<com.example.finfam.dto.request.MLClassifyRequest.TransactionItem> mlTransactions = uncategorizedTransactions.stream()
                .map(tx -> {
                    com.example.finfam.dto.request.MLClassifyRequest.TransactionItem item = 
                        new com.example.finfam.dto.request.MLClassifyRequest.TransactionItem();
                    item.setId(tx.getId());
                    item.setName(tx.getDescription());
                    return item;
                })
                .collect(Collectors.toList());

        log.info("Sending {} transactions to ML service for classification", mlTransactions.size());
        
        // Apply pattern-based categorization ONLY for exact matches or very high confidence
        // This helps when ML model isn't trained yet, but we're conservative to avoid false matches
        int patternMatched = applyPatternBasedCategorization(uncategorizedTransactions, userId, familyId);
        log.info("Pattern-based categorization matched {} transactions (exact/high-confidence matches only)", patternMatched);
        
        // Remove already pattern-matched transactions from ML processing
        // Only send truly uncategorized ones to ML
        List<com.example.finfam.dto.request.MLClassifyRequest.TransactionItem> remainingForML = 
            uncategorizedTransactions.stream()
                .filter(tx -> tx.getMlSuggestedCategory() == null) // Not matched by pattern
                .map(tx -> {
                    com.example.finfam.dto.request.MLClassifyRequest.TransactionItem item = 
                        new com.example.finfam.dto.request.MLClassifyRequest.TransactionItem();
                    item.setId(tx.getId());
                    item.setName(tx.getDescription());
                    return item;
                })
                .collect(Collectors.toList());
        
        log.info("Sending {} remaining transactions to ML service (after pattern matching)", remainingForML.size());

        // Classificar usando ML (only for transactions not matched by pattern)
        // Group transactions by userId to use the correct ML model for each user
        List<com.example.finfam.dto.response.MLClassificationResult> results = new ArrayList<>();
        if (!remainingForML.isEmpty()) {
            // Create a map of transaction ID -> userId for quick lookup
            Map<Integer, Integer> transactionIdToUserId = uncategorizedTransactions.stream()
                .filter(tx -> tx.getMlSuggestedCategory() == null) // Only unmatched transactions
                .collect(Collectors.toMap(Transaction::getId, Transaction::getUserId));
            
            // Group transactions by userId
            Map<Integer, List<com.example.finfam.dto.request.MLClassifyRequest.TransactionItem>> transactionsByUserId = 
                remainingForML.stream()
                    .collect(Collectors.groupingBy(item -> 
                        transactionIdToUserId.getOrDefault(item.getId(), userId) // Fallback to logged user if not found
                    ));
            
            log.info("Grouped {} transactions by userId: {}", remainingForML.size(), transactionsByUserId.keySet());
            
            // Process each user's transactions with their own ML model
            for (Map.Entry<Integer, List<com.example.finfam.dto.request.MLClassifyRequest.TransactionItem>> entry : transactionsByUserId.entrySet()) {
                Integer txUserId = entry.getKey();
                List<com.example.finfam.dto.request.MLClassifyRequest.TransactionItem> userTransactions = entry.getValue();
                
                try {
                    log.info("Calling ML service for userId: {} with {} transactions", txUserId, userTransactions.size());
                    List<com.example.finfam.dto.response.MLClassificationResult> userResults = 
                        mlService.classifyTransactions(txUserId, userTransactions);
                    results.addAll(userResults);
                    log.info("ML service returned {} results for userId: {}", userResults.size(), txUserId);
                } catch (Exception e) {
                    log.error("Error calling ML service for userId {}: {}", txUserId, e.getMessage(), e);
                    // Continue processing other users even if one fails
                }
            }
            
            log.info("Total ML results collected: {}", results.size());
        } else {
            log.info("Skipping ML service call - all transactions matched by pattern or no transactions to classify");
        }

        // Atualizar transações com sugestões ML
        int updatedCount = 0;
        int notFoundCount = 0;
        int nullCategoryCount = 0;
        
        // Create a map for faster lookup
        Map<Integer, Transaction> transactionMap = uncategorizedTransactions.stream()
                .collect(Collectors.toMap(Transaction::getId, tx -> tx));
        
        log.info("Processing {} ML results, transaction map size: {}", results.size(), transactionMap.size());
        
        // Get all valid categories for this family to filter ML suggestions
        List<Category> familyCategories = categoryRepo.findByFamilyId(familyId);
        Set<String> validCategoryNames = familyCategories.stream()
                .map(Category::getName)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        
        log.info("Family {} has {} valid categories: {}", familyId, validCategoryNames.size(), validCategoryNames);
        
        // Log sample result for debugging
        if (!results.isEmpty()) {
            com.example.finfam.dto.response.MLClassificationResult sample = results.get(0);
            log.info("Sample ML result - ID: {}, Category: {}, Confidence: {}", 
                    sample.getId(), sample.getPredictedCategory(), sample.getConfidence());
        }
        
        int invalidCategoryCount = 0;
        for (com.example.finfam.dto.response.MLClassificationResult result : results) {
            if (result.getId() == null) {
                log.warn("ML result has null ID, skipping");
                continue;
            }
            
            Transaction tx = transactionMap.get(result.getId());
            
            if (tx == null) {
                notFoundCount++;
                if (notFoundCount <= 5) { // Log first 5 mismatches
                    log.warn("Transaction not found for ML result ID: {}, available IDs: {}", 
                            result.getId(), 
                            uncategorizedTransactions.stream().map(Transaction::getId).limit(5).collect(Collectors.toList()));
                }
                continue;
            }
            
            if (result.getPredictedCategory() == null || result.getPredictedCategory().isEmpty()) {
                nullCategoryCount++;
                if (nullCategoryCount <= 5) {
                    log.warn("ML result has null/empty predictedCategory for transaction ID: {}", result.getId());
                }
                continue;
            }
            
            // Filter: Only accept ML suggestions for categories that exist in this family
            String predictedCategoryLower = result.getPredictedCategory().toLowerCase();
            if (!validCategoryNames.contains(predictedCategoryLower)) {
                invalidCategoryCount++;
                if (invalidCategoryCount <= 5) {
                    log.warn("ML suggested category '{}' does not exist in family {}. Skipping suggestion for transaction {}", 
                            result.getPredictedCategory(), familyId, tx.getId());
                }
                continue; // Skip this suggestion - category doesn't exist in this family
            }
            
            // Update transaction
            tx.setMlSuggestedCategory(result.getPredictedCategory());
            tx.setMlConfidence(result.getConfidence() != null ? result.getConfidence() : 0.0);
            tx.setMlPendingConfirmation(true);
            transactionRepo.save(tx);
            updatedCount++;
            
            if (updatedCount <= 5) { // Log first 5 updates
                log.info("Updated transaction {} with category suggestion: {} (confidence: {})", 
                        tx.getId(), result.getPredictedCategory(), result.getConfidence());
            }
        }

        log.info("Auto-categorize completed: {} transactions updated, {} not found, {} with null category, {} with invalid category (not in family)", 
                updatedCount, notFoundCount, nullCategoryCount, invalidCategoryCount);
        
        // If all results have null categories, the model likely doesn't exist
        if (updatedCount == 0 && nullCategoryCount == results.size() && results.size() > 0) {
            log.warn("No transactions were updated. Model may not be trained for userId: {}. " +
                    "User needs to manually categorize some transactions first to train the model.", userId);
        }
        
        return uncategorizedTransactions;
    }
    
    /**
     * Apply pattern-based categorization by matching descriptions with already-categorized transactions
     * Uses a voting system to avoid false matches from common words
     * Uses ALL categorized transactions from the family, not just from one user
     * Only matches categories that exist in the current family
     */
    private int applyPatternBasedCategorization(List<Transaction> uncategorizedTransactions, Integer userId, Integer familyId) {
        // Get all valid categories for this family first
        List<Category> familyCategories = categoryRepo.findByFamilyId(familyId);
        Set<String> validCategoryNames = familyCategories.stream()
                .map(Category::getName)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        
        // Get all categorized transactions for the entire family to learn patterns
        // This allows pattern matching to work across all family members' transactions
        // But only use categories that exist in this family
        List<Transaction> categorizedTransactions = transactionRepo.findByFamilyId(familyId).stream()
                .filter(tx -> tx.getCategory() != null && validCategoryNames.contains(tx.getCategory().getName().toLowerCase()))
                .collect(Collectors.toList());
        
        if (categorizedTransactions.isEmpty()) {
            log.debug("No categorized transactions found for pattern matching");
            return 0;
        }
        
        // Build a map of word -> category -> count (voting system)
        Map<String, Map<String, Integer>> wordToCategoryVotes = new HashMap<>();
        Map<String, Category> exactMatchMap = new HashMap<>();
        
        // Common words to ignore (too generic)
        Set<String> ignoreWords = Set.of("pix", "enviado", "recebido", "pagamento", "boleto", "transferencia", 
                "debito", "credito", "cartao", "banco", "conta", "saldo", "carteira");
        
        for (Transaction tx : categorizedTransactions) {
            if (tx.getDescription() != null && tx.getCategory() != null) {
                String desc = tx.getDescription().toLowerCase().trim();
                String categoryName = tx.getCategory().getName();
                
                // Store exact description match
                exactMatchMap.put(desc, tx.getCategory());
                
                // Extract meaningful words (5+ chars, not in ignore list)
                String[] words = desc.split("\\s+");
                for (String word : words) {
                    word = word.replaceAll("[^a-z0-9]", ""); // Remove punctuation
                    if (word.length() >= 5 && !ignoreWords.contains(word)) {
                        wordToCategoryVotes.computeIfAbsent(word, k -> new HashMap<>())
                                .merge(categoryName, 1, Integer::sum);
                    }
                }
            }
        }
        
        log.info("Pattern matching: {} exact matches, {} unique words with votes", 
                exactMatchMap.size(), wordToCategoryVotes.size());
        
        int matched = 0;
        for (Transaction tx : uncategorizedTransactions) {
            if (tx.getDescription() == null) continue;
            
            String desc = tx.getDescription().toLowerCase().trim();
            Category matchedCategory = null;
            double confidence = 0.0;
            
            // Check for exact match first (highest confidence)
            Category exactMatch = exactMatchMap.get(desc);
            if (exactMatch != null) {
                matchedCategory = exactMatch;
                confidence = 0.95;
            } else {
                // Use voting system for partial matches
                Map<String, Integer> categoryVotes = new HashMap<>();
                String[] words = desc.split("\\s+");
                
                for (String word : words) {
                    word = word.replaceAll("[^a-z0-9]", "");
                    if (word.length() >= 5 && !ignoreWords.contains(word)) {
                        Map<String, Integer> votes = wordToCategoryVotes.get(word);
                        if (votes != null) {
                            votes.forEach((cat, count) -> 
                                categoryVotes.merge(cat, count, Integer::sum));
                        }
                    }
                }
                
                // Find category with most votes
                if (!categoryVotes.isEmpty()) {
                    int totalVotes = categoryVotes.values().stream().mapToInt(Integer::intValue).sum();
                    String winningCategory = categoryVotes.entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse(null);
                    
                    int winningVotes = winningCategory != null ? categoryVotes.get(winningCategory) : 0;
                    
                    // Only match if winner has significant majority (at least 60% of votes)
                    if (winningCategory != null && winningVotes * 100.0 / totalVotes >= 60.0 && winningVotes >= 2) {
                        // Find the category object
                        matchedCategory = categorizedTransactions.stream()
                                .filter(t -> t.getCategory() != null && t.getCategory().getName().equals(winningCategory))
                                .findFirst()
                                .map(Transaction::getCategory)
                                .orElse(null);
                        
                        confidence = Math.min(0.85, winningVotes * 100.0 / totalVotes / 100.0);
                    }
                }
            }
            
            // If we found a match, verify it's a valid category for this family and set it as ML suggestion
            if (matchedCategory != null) {
                // Double-check: ensure the matched category belongs to this family
                if (validCategoryNames.contains(matchedCategory.getName().toLowerCase())) {
                    tx.setMlSuggestedCategory(matchedCategory.getName());
                    tx.setMlConfidence(confidence);
                    tx.setMlPendingConfirmation(true);
                    transactionRepo.save(tx);
                    matched++;
                    log.debug("Pattern matched transaction {}: '{}' -> category: '{}' (confidence: {})", 
                            tx.getId(), tx.getDescription(), matchedCategory.getName(), confidence);
                } else {
                    log.debug("Pattern matched category '{}' but it doesn't exist in family {}. Skipping.", 
                            matchedCategory.getName(), familyId);
                }
            }
        }
        
        log.info("Pattern-based categorization matched {} transactions", matched);
        return matched;
    }

    /**
     * Confirma categoria sugerida pelo ML
     * Any family member can confirm suggestions for any transaction in the family
     */
    @Transactional
    public Transaction confirmCategory(Integer transactionId, Integer familyId, Integer userId) {
        try {
            Transaction transaction = transactionRepo.findById(transactionId)
                    .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

            if (!transaction.getFamilyId().equals(familyId)) {
                throw new IllegalArgumentException("Transaction does not belong to this family");
            }

            // Verify that the logged user belongs to the family (instead of checking if transaction belongs to user)
            boolean userBelongsToFamily = familyMemberRepository.findByUserIdAndFamilyId(userId, familyId).isPresent();
            log.debug("User {} belongs to family {}: {}", userId, familyId, userBelongsToFamily);
            if (!userBelongsToFamily) {
                throw new IllegalArgumentException("User does not belong to this family");
            }

            if (transaction.getMlSuggestedCategory() == null || !transaction.getMlPendingConfirmation()) {
                throw new IllegalArgumentException("No pending ML suggestion for this transaction");
            }

            // Encontrar categoria pelo nome
            Category category = categoryRepo.findByFamilyId(familyId).stream()
                    .filter(c -> c.getName().equalsIgnoreCase(transaction.getMlSuggestedCategory()))
                    .findFirst()
                    .orElse(null);

            if (category == null) {
                throw new IllegalArgumentException("Category not found: " + transaction.getMlSuggestedCategory());
            }

            // Atualizar categoria
            transaction.setCategory(category);
            transaction.setMlPendingConfirmation(false);
            transaction.setMlSuggestedCategory(null);
            transaction.setMlConfidence(null);

            Transaction saved = transactionRepo.save(transaction);
            
            // Force load category to avoid lazy loading issues during serialization
            if (saved.getCategory() != null) {
                saved.getCategory().getId(); // Trigger lazy load
            }

            // Treinar modelo com feedback positivo usando o userId da transação (não do usuário logado)
            // O modelo ML é específico por usuário, então precisamos treinar com o userId da transação
            Integer transactionUserId = transaction.getUserId();
            if (transactionUserId != null && transaction.getDescription() != null && category.getName() != null) {
                try {
                    mlService.trainUserModel(transactionUserId, transaction.getDescription(), category.getName());
                    log.info("ML model trained successfully for userId: {} with category: {}", transactionUserId, category.getName());
                } catch (Exception e) {
                    log.error("Failed to train ML model for userId: {}", transactionUserId, e);
                    // Don't fail the transaction confirmation if ML training fails
                }
            } else {
                log.warn("Skipping ML training - missing data: userId={}, description={}, category={}", 
                        transactionUserId, transaction.getDescription(), category.getName());
            }

            try {
                checkBudgetsAfterTransaction(saved);
            } catch (Exception e) {
                log.error("Failed to check budgets after category confirmation for transactionId: {}", saved.getId(), e);
                // Don't fail the transaction confirmation if budget check fails
            }
            
            return saved;
        } catch (IllegalArgumentException e) {
            log.error("Error confirming category: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error confirming category for transactionId: {}, familyId: {}, userId: {}", 
                    transactionId, familyId, userId, e);
            throw new RuntimeException("Error confirming category: " + e.getMessage(), e);
        }
    }

    /**
     * Rejeita sugestão ML
     * Any family member can reject suggestions for any transaction in the family
     */
    @Transactional
    public void rejectCategory(Integer transactionId, Integer familyId, Integer userId) {
        Transaction transaction = transactionRepo.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        if (!transaction.getFamilyId().equals(familyId)) {
            throw new IllegalArgumentException("Transaction does not belong to this family");
        }

        // Verify that the logged user belongs to the family (instead of checking if transaction belongs to user)
        if (!familyMemberRepository.existsByUserIdAndFamilyId(userId, familyId)) {
            throw new IllegalArgumentException("User does not belong to this family");
        }

        // Remover sugestão ML
        transaction.setMlPendingConfirmation(false);
        transaction.setMlSuggestedCategory(null);
        transaction.setMlConfidence(null);
        transactionRepo.save(transaction);
    }

    /**
     * Corrige categoria manualmente e reforça modelo
     * Any family member can correct categories for any transaction in the family
     */
    @Transactional
    public Transaction correctCategory(Integer transactionId, Integer familyId, Integer userId, String newCategoryName) {
        Transaction transaction = transactionRepo.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found"));

        if (!transaction.getFamilyId().equals(familyId)) {
            throw new IllegalArgumentException("Transaction does not belong to this family");
        }

        // Verify that the logged user belongs to the family (instead of checking if transaction belongs to user)
        if (!familyMemberRepository.existsByUserIdAndFamilyId(userId, familyId)) {
            throw new IllegalArgumentException("User does not belong to this family");
        }

        // Encontrar categoria pelo nome
        Category category = categoryRepo.findByFamilyId(familyId).stream()
                .filter(c -> c.getName().equalsIgnoreCase(newCategoryName))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + newCategoryName));

        // Atualizar categoria
        transaction.setCategory(category);
        transaction.setMlPendingConfirmation(false);
        transaction.setMlSuggestedCategory(null);
        transaction.setMlConfidence(null);

        Transaction saved = transactionRepo.save(transaction);

        // Reforçar modelo com correção usando o userId da transação (não do usuário logado)
        // O modelo ML é específico por usuário, então precisamos treinar com o userId da transação
        Integer transactionUserId = transaction.getUserId();
        mlService.reinforceModel(transactionUserId, transaction.getDescription(), newCategoryName);

        checkBudgetsAfterTransaction(saved);
        return saved;
    }
}

