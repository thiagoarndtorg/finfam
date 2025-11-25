package com.example.finfam.utils;

public enum BankEnum {
    INTER("077"),
    ITAU("341"),
    BRADESCO("237"),
    SANTANDER("033"),
    CAIXA("104"),
    PICPAY("380"),
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



    public static String getBankColor(BankEnum bank) {
        if (bank == PICPAY) {
            return "#56d695";
        }
        if (bank == INTER) {
            return "#ffad42";
        }
        else{
            return "#808080";
        }
    }
}