package com.example.finfam.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.finfam.model.Transaction;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Integer> {
    List<Transaction> findByAccountId(int accountId);
    List<Transaction> findByUserIdAndFamilyId(int userId, int familyId);
    List<Transaction> findByTransactionDateBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT t.pluggyId FROM Transaction t")
    List<String> findAllPluggyIds();
    // Buscar transação pelo pluggyId
    Optional<Transaction> findByPluggyId(String pluggyId);


    @Query("SELECT t FROM Transaction t WHERE t.familyId = :familyId")
    List<Transaction> findByFamilyId(@Param("familyId") Integer familyId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.familyId = :familyId AND t.category.id = :categoryId AND YEAR(t.transactionDate) = :year AND MONTH(t.transactionDate) = :month AND t.transactionType = 'EXPENSE'")
    BigDecimal sumExpensesByCategoryAndMonth(@Param("familyId") Integer familyId, @Param("categoryId") Integer categoryId, @Param("year") Integer year, @Param("month") Integer month);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.familyId = :familyId AND t.userId = :userId AND YEAR(t.transactionDate) = :year AND MONTH(t.transactionDate) = :month AND t.transactionType = 'EXPENSE'")
    BigDecimal sumExpensesByUserAndMonth(@Param("familyId") Integer familyId, @Param("userId") Integer userId, @Param("year") Integer year, @Param("month") Integer month);
}
