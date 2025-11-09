package com.example.finfam.utils;

import com.example.finfam.utils.TransactionType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.math.BigDecimal;

@Converter(autoApply = true)
public class TransactionTypeConverter implements AttributeConverter<TransactionType, String> {

    @Override
    public String convertToDatabaseColumn(TransactionType attribute) {
        return attribute == null ? null : attribute.name().toUpperCase();
    }

    @Override
    public TransactionType convertToEntityAttribute(String dbData) {
        return dbData == null ? null : TransactionType.valueOf(dbData.toUpperCase());
    }

    public static TransactionType resolve(BigDecimal amount) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        return amount.compareTo(BigDecimal.ZERO) >= 0
                ? TransactionType.INCOME
                : TransactionType.EXPENSE;
    }

    public static String resolveAsString(BigDecimal amount) {
        return resolve(amount).name();
    }


}