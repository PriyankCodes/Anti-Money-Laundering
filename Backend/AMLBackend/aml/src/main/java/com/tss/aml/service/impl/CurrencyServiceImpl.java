package com.tss.aml.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.response.CurrencyConversionResult;
import com.tss.aml.entity.CurrencyExchange;
import com.tss.aml.entity.enums.RateSource;
import com.tss.aml.exception.UserApiException;
import com.tss.aml.repository.CurrencyExchangeRepository;
import com.tss.aml.service.CurrencyService;

@Service
public class CurrencyServiceImpl implements CurrencyService {
    
    private static final Logger logger = LoggerFactory.getLogger(CurrencyServiceImpl.class);
    
    @Autowired
    private CurrencyExchangeRepository currencyExchangeRepository;
    
    @Override
    public CurrencyConversionResult convertCurrency(String fromCurrency, String toCurrency, BigDecimal amount) {
        logger.info("💱 Converting {} {} to {}", amount, fromCurrency, toCurrency);
        
        // Check if same currency
        if (fromCurrency.equals(toCurrency)) {
            CurrencyConversionResult sameResult = new CurrencyConversionResult(
                fromCurrency, 
                toCurrency, 
                amount, 
                amount, 
                BigDecimal.ONE, 
                BigDecimal.ZERO
            );
            sameResult.setConversionId(UUID.randomUUID().toString());
            sameResult.setRateSource("SAME_CURRENCY");
            // No currency exchange entity needed for same currency
            return sameResult;
        }
        
        // Get exchange rate
        CurrencyExchange exchangeRate = getExchangeRate(fromCurrency, toCurrency);
        
        // Calculate converted amount
        BigDecimal convertedAmount = amount.multiply(exchangeRate.getConversionRate())
                                          .setScale(2, RoundingMode.HALF_UP);
        
        // Calculate conversion fee
        BigDecimal conversionFee = calculateConversionFee(fromCurrency, toCurrency, convertedAmount);
        
        CurrencyConversionResult result = new CurrencyConversionResult(
            fromCurrency,
            toCurrency,
            amount,
            convertedAmount,
            exchangeRate.getConversionRate(),
            conversionFee
        );
        
        result.setConversionId(UUID.randomUUID().toString());
        result.setRateSource(exchangeRate.getRateSource().name());
        result.setCurrencyExchange(exchangeRate); // Set the currency exchange entity reference
        
        logger.info("✅ Conversion complete: {} {} = {} {} (Fee: {} {})", 
                   amount, fromCurrency, 
                   result.getNetAmount(), toCurrency,
                   conversionFee, toCurrency);
        
        return result;
    }
    
    @Override
    public CurrencyExchange getExchangeRate(String fromCurrency, String toCurrency) {
        Optional<CurrencyExchange> exchangeRate = currencyExchangeRepository
                .findByFromCurrencyAndToCurrencyAndIsActiveTrue(fromCurrency, toCurrency);
        
        if (exchangeRate.isPresent()) {
            return exchangeRate.get();
        }
        
        // Try reverse rate (e.g., if USD/INR not found, try INR/USD and calculate inverse)
        Optional<CurrencyExchange> reverseRate = currencyExchangeRepository
                .findByFromCurrencyAndToCurrencyAndIsActiveTrue(toCurrency, fromCurrency);
        
        if (reverseRate.isPresent()) {
            CurrencyExchange reverse = reverseRate.get();
            CurrencyExchange calculated = new CurrencyExchange();
            calculated.setFromCurrency(fromCurrency);
            calculated.setToCurrency(toCurrency);
            calculated.setConversionRate(BigDecimal.ONE.divide(reverse.getConversionRate(), 6, RoundingMode.HALF_UP));
            calculated.setConversionFeePercent(reverse.getConversionFeePercent());
            calculated.setMinimumFee(reverse.getMinimumFee());
            calculated.setMaximumFee(reverse.getMaximumFee());
            calculated.setRateSource(RateSource.MANUAL);
            return calculated;
        }
        
        throw new UserApiException("Exchange rate not available for " + fromCurrency + " to " + toCurrency);
    }
    
    @Override
    public boolean isConversionSupported(String fromCurrency, String toCurrency) {
        if (fromCurrency.equals(toCurrency)) {
            return true;
        }
        
        return currencyExchangeRepository
                .findByFromCurrencyAndToCurrencyAndIsActiveTrue(fromCurrency, toCurrency)
                .isPresent() ||
               currencyExchangeRepository
                .findByFromCurrencyAndToCurrencyAndIsActiveTrue(toCurrency, fromCurrency)
                .isPresent();
    }
    
    @Override
    public List<String> getSupportedCurrencies() {
        List<String> fromCurrencies = currencyExchangeRepository.findAllSupportedFromCurrencies();
        List<String> toCurrencies = currencyExchangeRepository.findAllSupportedToCurrencies();

        // Merge and remove duplicates
        return Stream.concat(fromCurrencies.stream(), toCurrencies.stream())
                     .distinct()
                     .collect(Collectors.toList());
    }

    
    @Override
    public BigDecimal calculateConversionFee(String fromCurrency, String toCurrency, BigDecimal convertedAmount) {
        if (fromCurrency.equals(toCurrency)) {
            return BigDecimal.ZERO;
        }
        
        CurrencyExchange exchangeRate = getExchangeRate(fromCurrency, toCurrency);
        
        // Calculate percentage-based fee
        BigDecimal percentageFee = convertedAmount
                .multiply(exchangeRate.getConversionFeePercent())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        
        // Apply minimum and maximum fee limits
        BigDecimal finalFee = percentageFee;
        
        if (finalFee.compareTo(exchangeRate.getMinimumFee()) < 0) {
            finalFee = exchangeRate.getMinimumFee();
        }
        
        if (finalFee.compareTo(exchangeRate.getMaximumFee()) > 0) {
            finalFee = exchangeRate.getMaximumFee();
        }
        
        return finalFee;
    }
    
    @Override
    public List<CurrencyExchange> getAllActiveExchangeRates() {
        return currencyExchangeRepository.findAllActiveExchangeRates();
    }
    
    @Override
    public CurrencyExchange updateExchangeRate(String fromCurrency, String toCurrency, BigDecimal newRate) {
        Optional<CurrencyExchange> existingRate = currencyExchangeRepository
                .findByFromCurrencyAndToCurrencyAndIsActiveTrue(fromCurrency, toCurrency);
        
        if (existingRate.isPresent()) {
            CurrencyExchange rate = existingRate.get();
            rate.setConversionRate(newRate);
            rate.setLastUpdated(LocalDateTime.now());
            return currencyExchangeRepository.save(rate);
        }
        
        throw new UserApiException("Exchange rate not found for " + fromCurrency + " to " + toCurrency);
    }

	@Override
	public List<CurrencyExchange> getConversionHistory(String fromCurrency, String toCurrency, int page, int size) {
		// TODO Auto-generated method stub
		return null;
	}
}
