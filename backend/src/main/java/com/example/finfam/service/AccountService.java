package com.example.finfam.service;

import com.example.finfam.exception.CustomException;
import com.example.finfam.model.Account;
import com.example.finfam.model.Bank;
import com.example.finfam.repository.AccountRepository;
import com.example.finfam.repository.BankRepository;
import com.example.finfam.utils.BankEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {
    private final AccountRepository accountRepo;
    private final BankRepository bankRepository;

    public Account saveAccount(int userId, int familyId, int bankId, String itemId, String name, double balance) {
        Bank bank = bankRepository.findById(bankId);
        String color = BankEnum.getBankColor(BankEnum.fromTransferNumber(bank.getBankCode()));
        Account account = new Account();
        account.setUserId(userId);
        account.setFamilyId(familyId);
        account.setBankId(bankId);
        account.setItemId(itemId);
        account.setName(name);
        account.setBalance(new BigDecimal(balance));
        account.setCurrency("BRL");
        account.setColor(color);
        account.setIsActive(true);
        return accountRepo.save(account);
    }

    public List<Account> getAccountsByUserAndFamily(int userId, int familyId) {
        return accountRepo.findByUserIdAndFamilyId(userId, familyId);
    }

    public Account getAccountByItemId(String itemId) {
        return accountRepo.findByItemId(itemId).orElse(null);
    }

    public boolean existsByItemId(String itemId) {
        return accountRepo.existsByItemId(itemId);
    }

    public boolean existsByUserIdAndBankCode(Integer userId, String bankCode) {
        Bank bank = bankRepository.findByBankCode(bankCode).orElse(null);
        if (bank == null) return false;
        return accountRepo.existsByUserIdAndBankId(userId, bank.getId());
    }

    public List<Account> getAccountsByFamily(int familyId) {
        return accountRepo.findByFamilyId(familyId);
    }

    public Account updateAccount(Account account) {
        return accountRepo.save(account);
    }

    public void disconnectAccount(Integer accountId, Integer userId, Integer familyId) {
        Account account = accountRepo.findById(accountId)
                .orElseThrow(() -> new CustomException("Account not found", HttpStatus.NOT_FOUND));

        if (!account.getUserId().equals(userId) || !account.getFamilyId().equals(familyId)) {
            throw new CustomException("Account does not belong to user/family", HttpStatus.FORBIDDEN);
        }

        account.setIsActive(false);
        accountRepo.save(account);
    }

    public int disconnectAllUserAccounts(Integer userId, Integer familyId) {
        List<Account> accounts = accountRepo.findByUserIdAndFamilyIdAndIsActive(userId, familyId, true);
        accounts.forEach(account -> account.setIsActive(false));
        accountRepo.saveAll(accounts);
        return accounts.size();
    }
}