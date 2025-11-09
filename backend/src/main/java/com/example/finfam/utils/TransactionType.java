package com.example.finfam.utils;

import java.util.Locale;

public enum TransactionType {
    INCOME,
    EXPENSE;

    public static TransactionType fromString(String value) {
        if (value == null) return null;
        return switch (value.trim().toUpperCase(Locale.ROOT)) {
            case "INCOME" -> INCOME;
            case "EXPENSE" -> EXPENSE;
            default -> throw new IllegalArgumentException("Invalid transaction type: " + value);
        };
    }

    @Override
    public String toString() {
        return this.name();
    }
}