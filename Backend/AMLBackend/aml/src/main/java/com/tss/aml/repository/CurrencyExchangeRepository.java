package com.tss.aml.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.tss.aml.entity.CurrencyExchange;

public interface CurrencyExchangeRepository extends JpaRepository<CurrencyExchange, Long> {
    
    Optional<CurrencyExchange> findByFromCurrencyAndToCurrencyAndIsActiveTrue(String fromCurrency, String toCurrency);
    
    List<CurrencyExchange> findByFromCurrencyAndIsActiveTrue(String fromCurrency);
    
    List<CurrencyExchange> findByToCurrencyAndIsActiveTrue(String toCurrency);
    
    @Query("SELECT ce FROM CurrencyExchange ce WHERE ce.isActive = true ORDER BY ce.lastUpdated DESC")
    List<CurrencyExchange> findAllActiveExchangeRates();
    
    @Query("SELECT DISTINCT ce.fromCurrency FROM CurrencyExchange ce WHERE ce.isActive = true")
    List<String> findAllSupportedFromCurrencies();
    
    @Query("SELECT DISTINCT ce.toCurrency FROM CurrencyExchange ce WHERE ce.isActive = true")
    List<String> findAllSupportedToCurrencies();
}
