package com.tss.aml.entity.enums;

public enum Currency {
	INR, USD, EUR;
	
    public static boolean isValidCurrency(String value) {
        if (value == null) return false;
        try {
            Currency.valueOf(value.toUpperCase());
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

}
