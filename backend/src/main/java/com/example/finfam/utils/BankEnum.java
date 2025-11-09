package com.example.finfam.utils;

public enum BankEnum {
    INTER("077"),
    ITAU("341"),
    BRADESCO("237"),
    SANTANDER("033"),
    CAIXA("104"),
    UNKNOWN("000");

    private final String bankCode;

    BankEnum(String bankCode) {
        this.bankCode = bankCode;
    }

    public String getBankCode() {
        return bankCode;
    }

    public static BankEnum fromTransferNumber(String transferNumber) {
        if (transferNumber == null || transferNumber.length() < 3) {
            return UNKNOWN;
        }

        String bankCode = transferNumber.substring(0, 3);
        for (BankEnum bank : values()) {
            if (bank.getBankCode().equals(bankCode)) {
                return bank;
            }
        }
        return UNKNOWN;
    }
}