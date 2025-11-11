package com.tss.aml.service;

import java.math.BigDecimal;
import java.util.List;

import com.tss.aml.dto.response.CurrencyConversionResult;
import com.tss.aml.entity.CurrencyExchange;

public interface CurrencyService {
    
    /**
     * Convert amount from one currency to another
     */
    CurrencyConversionResult convertCurrency(String fromCurrency, String toCurrency, BigDecimal amount);
    
    /**
     * Get exchange rate between two currencies
     */
    CurrencyExchange getExchangeRate(String fromCurrency, String toCurrency);
    
    /**
     * Check if currency conversion is supported
     */
    boolean isConversionSupported(String fromCurrency, String toCurrency);
    
    /**
     * Get all supported currencies
     */
    List<String> getSupportedCurrencies();
    
    /**
     * Calculate conversion fee for a given amount
     */
    BigDecimal calculateConversionFee(String fromCurrency, String toCurrency, BigDecimal amount);
    
    /**
     * Get all active exchange rates
     */
    List<CurrencyExchange> getAllActiveExchangeRates();
    
    /**
     * Update exchange rate
     */
    CurrencyExchange updateExchangeRate(String fromCurrency, String toCurrency, BigDecimal newRate);
    
    /**
     * Get conversion history for audit purposes
     */
    List<CurrencyExchange> getConversionHistory(String fromCurrency, String toCurrency, int page, int size);
}
