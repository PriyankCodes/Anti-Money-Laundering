package com.tss.aml.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.tss.aml.entity.CurrencyExchange;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurrencyConversionResult {
    
    private String fromCurrency;
    private String toCurrency;
    private BigDecimal originalAmount;
    private BigDecimal convertedAmount;
    private BigDecimal exchangeRate;
    private BigDecimal conversionFee;
    private BigDecimal netAmount; // convertedAmount - conversionFee
    private String conversionId;
    private LocalDateTime conversionTime;
    private String rateSource;
    private CurrencyExchange currencyExchange;
    
    public CurrencyConversionResult(String fromCurrency, String toCurrency, BigDecimal originalAmount, 
                                   BigDecimal convertedAmount, BigDecimal exchangeRate, BigDecimal conversionFee) {
        this.fromCurrency = fromCurrency;
        this.toCurrency = toCurrency;
        this.originalAmount = originalAmount;
        this.convertedAmount = convertedAmount;
        this.exchangeRate = exchangeRate;
        this.conversionFee = conversionFee;
        this.netAmount = convertedAmount.subtract(conversionFee);
        this.conversionTime = LocalDateTime.now();
    }
}
