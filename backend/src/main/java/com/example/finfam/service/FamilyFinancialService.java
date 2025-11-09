package com.example.finfam.service;


import com.example.finfam.dto.FamilyDTO;
import com.example.finfam.dto.response.FamilyFinancialResponse;
import com.example.finfam.exception.CustomException;
import com.example.finfam.model.Account;
import com.example.finfam.model.Family;
import com.example.finfam.model.Transaction;
import com.example.finfam.repository.FamilyMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FamilyFinancialService {
    private final FamilyMemberRepository familyMemberRepository;
    private final AccountService accountService;
    private final TransactionService transactionService;

    private final JwtService jwtService;

    public FamilyFinancialResponse getFamilyFinancials(Integer familyId, String token) {
        String jwtToken = token.substring(7);
        Integer userId = jwtService.extractUserId(jwtToken);

        // Verify user belongs to the family
        boolean belongsToFamily = familyMemberRepository.existsByUserIdAndFamilyId(userId, familyId);
        if (!belongsToFamily) {
            throw new CustomException("Usuário não pertence à família especificada: " + familyId);
        }

        // Fetch all accounts and transactions for the family
        List<Account> accounts = accountService.getAccountsByFamily(familyId);
        List<Transaction> transactions = transactionService.getTransactionsByFamily(familyId);

        return new FamilyFinancialResponse(accounts);
    }

    @Transactional(readOnly = true)
    public List<FamilyDTO> getUserFamilies(String token) {
        String jwtToken = token.substring(7);
        Integer userId = jwtService.extractUserId(jwtToken);

        if (userId == null) {
            throw new CustomException("Usuário não especificado");
        }

        List<Family> families = familyMemberRepository.findFamiliesByUserId(userId);
        if (families.isEmpty()) {
            throw new CustomException("Usuário não pertence a nenhuma família");
        }

        return families.stream()
                .map(family -> FamilyDTO.builder()
                        .id(family.getId())
                        .name(family.getName())
                        .createdBy(family.getCreatedBy().getId())
                        .build())
                .collect(Collectors.toList());
    }
}
