package com.example.finfam.repository;

import com.example.finfam.model.Bank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BankRepository extends JpaRepository<Bank, Integer> {
    Optional<Bank> findByBankCode(String bankCode);
    Bank findById(int id);
}