package com.example.finfam.repository;

import com.example.finfam.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Integer> {
    List<Account> findByUserIdAndFamilyId(int userId, int familyId);
    Optional<Account> findByItemId(String itemId);
    boolean existsByItemId(String itemId);

    boolean existsByUserIdAndBankId(Integer userId, Integer bankId);

    List<Account> findByFamilyId(Integer familyId);

    List<Account> findByUserIdAndFamilyIdAndIsActive(Integer userId, Integer familyId, Boolean isActive);

  
    @Query("SELECT COUNT(a) > 0 FROM Account a WHERE a.itemId = :itemId AND a.familyId = :familyId AND (a.isActive = true OR a.isActive IS NULL)")
    boolean existsByItemIdAndFamilyId(@Param("itemId") String itemId, @Param("familyId") Integer familyId);

   
    @Query("SELECT COUNT(a) > 0 FROM Account a WHERE a.userId = :userId AND a.familyId = :familyId AND a.bankId = :bankId AND COALESCE(a.isActive, true) = true")
    boolean existsByUserIdAndFamilyIdAndBankId(@Param("userId") Integer userId, @Param("familyId") Integer familyId, @Param("bankId") Integer bankId);

}