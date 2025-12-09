package com.example.finfam.service;

import com.example.finfam.exception.CustomException;
import com.example.finfam.model.Account;
import com.example.finfam.model.Bank;
import com.example.finfam.repository.AccountRepository;
import com.example.finfam.repository.BankRepository;
import com.example.finfam.service.FamilyMemberService;
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
    private final FamilyMemberService familyMemberService;

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


    public boolean existsByItemIdAndFamilyId(String itemId, Integer familyId) {
        return accountRepo.existsByItemIdAndFamilyId(itemId, familyId);
    }


    public boolean existsByUserIdAndFamilyIdAndBankCode(Integer userId, Integer familyId, String bankCode) {
        Bank bank = bankRepository.findByBankCode(bankCode).orElse(null);
        if (bank == null) {
            System.out.println("DEBUG AccountService - Bank not found for bankCode: " + bankCode);
            return false;
        }
        
     
        List<Account> allUserAccounts = accountRepo.findByUserIdAndFamilyId(userId, familyId);
        System.out.println("DEBUG AccountService - ALL user accounts in family " + familyId + ": " + allUserAccounts.size());
        for (Account acc : allUserAccounts) {
            System.out.println("  Account ID: " + acc.getId() + ", BankId: " + acc.getBankId() + 
                             ", IsActive: " + acc.getIsActive() + ", ItemId: " + acc.getItemId() + 
                             ", UserId: " + acc.getUserId() + ", FamilyId: " + acc.getFamilyId());
        }
        
       
        List<Account> matchingAccounts = allUserAccounts.stream()
            .filter(acc -> acc.getBankId().equals(bank.getId()) && 
                           Boolean.TRUE.equals(acc.getIsActive()))
            .toList();
        System.out.println("DEBUG AccountService - Matching active accounts: " + matchingAccounts.size());
        
        boolean exists = accountRepo.existsByUserIdAndFamilyIdAndBankId(userId, familyId, bank.getId());
        System.out.println("DEBUG AccountService - Query result: userId=" + userId + 
                          ", familyId=" + familyId + ", bankCode=" + bankCode + ", bankId=" + bank.getId() + 
                          ", exists=" + exists);
        
        return exists;
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

        if (!account.getFamilyId().equals(familyId)) {
            throw new CustomException("Account does not belong to family", HttpStatus.FORBIDDEN);
        }

       
        boolean isAdmin = familyMemberService.isAdmin(userId, familyId);
        boolean isAccountOwner = account.getUserId().equals(userId);
        
        if (!isAdmin && !isAccountOwner) {
            throw new CustomException("Apenas administradores podem desconectar contas de outros usuários", HttpStatus.FORBIDDEN);
        }

        account.setIsActive(false);
        accountRepo.save(account);
    }

    public int disconnectAllUserAccounts(Integer userId, Integer familyId) {
      
        boolean isAdmin = familyMemberService.isAdmin(userId, familyId);
        if (!isAdmin) {
            throw new CustomException("Apenas administradores podem desconectar todas as contas", HttpStatus.FORBIDDEN);
        }
        
        
        List<Account> accounts = accountRepo.findByFamilyId(familyId).stream()
                .filter(account -> Boolean.TRUE.equals(account.getIsActive()))
                .toList();
        
        accounts.forEach(account -> account.setIsActive(false));
        accountRepo.saveAll(accounts);
        return accounts.size();
    }
}