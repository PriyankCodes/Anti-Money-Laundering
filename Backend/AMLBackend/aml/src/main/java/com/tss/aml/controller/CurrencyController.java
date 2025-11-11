package com.tss.aml.controller;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.response.CurrencyConversionResult;
import com.tss.aml.entity.CurrencyExchange;
import com.tss.aml.service.CurrencyService;

@RestController
@RequestMapping("/api/currency")
public class CurrencyController {
    
    @Autowired
    private CurrencyService currencyService;
    
    /**
     * Get all supported currencies
     */
    @GetMapping("/supported")
    public ResponseEntity<List<String>> getSupportedCurrencies() {
        List<String> currencies = currencyService.getSupportedCurrencies();
        return ResponseEntity.ok(currencies);
    }
    
    /**
     * Get all active exchange rates
     */
    @GetMapping("/rates")
    public ResponseEntity<List<CurrencyExchange>> getAllExchangeRates() {
        List<CurrencyExchange> rates = currencyService.getAllActiveExchangeRates();
        return ResponseEntity.ok(rates);
    }
    
    /**
     * Get exchange rate between two currencies
     */
    @GetMapping("/rate/{fromCurrency}/{toCurrency}")
    public ResponseEntity<CurrencyExchange> getExchangeRate(
            @PathVariable String fromCurrency,
            @PathVariable String toCurrency) {
        
        CurrencyExchange rate = currencyService.getExchangeRate(fromCurrency, toCurrency);
        return ResponseEntity.ok(rate);
    }
    
    /**
     * Convert currency amount
     */
    @PostMapping("/convert")
    public ResponseEntity<CurrencyConversionResult> convertCurrency(
            @RequestParam String fromCurrency,
            @RequestParam String toCurrency,
            @RequestParam BigDecimal amount) {
        
        CurrencyConversionResult result = currencyService.convertCurrency(fromCurrency, toCurrency, amount);
        return ResponseEntity.ok(result);
    }
    
    /**
     * Check if currency conversion is supported
     */
    @GetMapping("/supported/{fromCurrency}/{toCurrency}")
    public ResponseEntity<Boolean> isConversionSupported(
            @PathVariable String fromCurrency,
            @PathVariable String toCurrency) {
        
        boolean supported = currencyService.isConversionSupported(fromCurrency, toCurrency);
        return ResponseEntity.ok(supported);
    }
    
    /**
     * Calculate conversion fee for a given amount
     */
    @GetMapping("/fee/{fromCurrency}/{toCurrency}/{amount}")
    public ResponseEntity<BigDecimal> calculateConversionFee(
            @PathVariable String fromCurrency,
            @PathVariable String toCurrency,
            @RequestParam BigDecimal amount) {
        
        BigDecimal fee = currencyService.calculateConversionFee(fromCurrency, toCurrency, amount);
        return ResponseEntity.ok(fee);
    }
    

    /**
     * Get real-time exchange rate with timestamp
     */
    @GetMapping("/rate/realtime/{fromCurrency}/{toCurrency}")
    public ResponseEntity<Map<String, Object>> getRealTimeExchangeRate(
            @PathVariable String fromCurrency,
            @PathVariable String toCurrency) {
        
        CurrencyExchange rate = currencyService.getExchangeRate(fromCurrency, toCurrency);
        
        Map<String, Object> response = new HashMap<>();
        response.put("fromCurrency", fromCurrency);
        response.put("toCurrency", toCurrency);
        response.put("exchangeRate", rate.getConversionRate());
        response.put("timestamp", java.time.LocalDateTime.now());
        response.put("isActive", rate.getIsActive());
        response.put("lastUpdated", rate.getLastUpdated());
        
        return ResponseEntity.ok(response);
    }
}
