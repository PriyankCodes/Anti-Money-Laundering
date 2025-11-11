package com.tss.aml.entity.enums;

public enum AccountType {
    CURRENT, SAVING, SALARY;
    
    public static boolean isValid(String value) {
        if (value == null) return false;
        try {
            AccountType.valueOf(value.toUpperCase());
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
