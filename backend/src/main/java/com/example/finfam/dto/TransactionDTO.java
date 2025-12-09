package com.example.finfam.dto;

import com.example.finfam.dto.request.TransactionCreateRequest;
import com.example.finfam.dto.response.OpenBankTransactionResponse;
import com.example.finfam.exception.CustomException;
import com.example.finfam.model.Transaction;
import lombok.Builder;
import lombok.Data;
import com.example.finfam.utils.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

import static com.example.finfam.utils.TransactionTypeConverter.resolveAsString;

@Data
@Builder
public class TransactionDTO {
    private String pluggyId;
    private int accountId;
    private String accountName;
    private int userId;
    private int familyId;
    private double amount;
    private String description;
    private LocalDate transactionDate;
    private String transactionType;


    public static List<TransactionDTO> convertToTransactionDTOs(List<OpenBankTransactionResponse> pluggyTransactions,
                                                                int accountId, String accountName, int userId, int familyId) {

        return pluggyTransactions.stream().map(tx -> {
            try {
          
                ZonedDateTime zonedDateTime = ZonedDateTime.parse(tx.getDate(), DateTimeFormatter.ISO_DATE_TIME);
                LocalDate transactionDate = zonedDateTime.toLocalDate();

          
                String transactionType = resolveAsString(BigDecimal.valueOf(tx.getAmount()));

                return TransactionDTO.builder()
                        .pluggyId(tx.getId()) 
                        .accountId(accountId)
                        .accountName(accountName)
                        .userId(userId)
                        .familyId(familyId)
                        .amount(tx.getAmount())
                        .description(tx.getDescription())
                        .transactionDate(transactionDate)
                        .transactionType(transactionType)
                        .build();
            } catch (DateTimeParseException e) {
                throw new CustomException("Invalid date format in transaction: " + tx.getDate());
            }
        }).collect(Collectors.toList());
    }

   
    public static Transaction toEntity(TransactionCreateRequest dto) {
        return Transaction.builder()
                .pluggyId(dto.getPluggyId())
                .accountId(dto.getAccountId())
                .userId(dto.getUserId())
                .familyId(dto.getFamilyId())
                .amount(BigDecimal.valueOf(dto.getAmount()))
                .description(dto.getDescription())
                .transactionDate(dto.getTransactionDate())
                .transactionType(TransactionType.fromString(dto.getTransactionType()))
                .build();
    }
}
