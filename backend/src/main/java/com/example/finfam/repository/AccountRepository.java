package com.example.finfam.repository;

import com.example.finfam.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Integer> {
    List<Account> findByUserIdAndFamilyId(int userId, int familyId);
    Optional<Account> findByItemId(String itemId);
    boolean existsByItemId(String itemId);

    boolean existsByUserIdAndBankId(Integer userId, Integer bankId);

    List<Account> findByFamilyId(Integer familyId);

}