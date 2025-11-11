package com.tss.aml.rule;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.tss.aml.entity.Rule;
import com.tss.aml.entity.Transaction;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.util.ObjectMapperHolder;
import com.tss.aml.util.RuleUtils;

@Component
public class ThresholdRuleEvaluator implements RuleEvaluator {
	@Autowired
	private TransactionRepository transactionRepository;


	private static final Logger logger = LoggerFactory.getLogger(ThresholdRuleEvaluator.class);

	@Override
	public boolean supports(String ruleType) {
		return "THRESHOLD".equalsIgnoreCase(ruleType);
	}

	@Override
	public boolean evaluate(Transaction tx, Rule rule) {
		try {
			logger.info("💰 THRESHOLD RULE EVALUATION - Rule: {}", rule.getName());
			
			// Debug rule conditions
			Map<String, Object> cond = ObjectMapperHolder.readMap(rule.getConditions());
			logger.info("💰 Rule conditions: {}", cond);
			
			// Handle multi-currency thresholds (e.g., {"USD":10000,"INR":830000})
			BigDecimal threshold = null;
			BigDecimal minAmount = null;
			BigDecimal maxAmount = null;
			
			Object amountThresholdObj = cond.get("amountThreshold");
			if (amountThresholdObj instanceof Map) {
				// Multi-currency threshold: {"USD":10000,"INR":830000}
				Map<String, Object> currencyThresholds = (Map<String, Object>) amountThresholdObj;
				String txCurrency = tx.getCurrency();
				if (txCurrency != null && currencyThresholds.containsKey(txCurrency)) {
					threshold = new BigDecimal(currencyThresholds.get(txCurrency).toString());
					logger.info("💰 Multi-currency threshold for {}: {}", txCurrency, threshold);
				}
			} else if (amountThresholdObj != null) {
				// Single threshold value
				threshold = RuleUtils.getBigDecimal(cond, "amountThreshold");
			}
			
			// Handle ranges (for structuring detection)
			Object rangesObj = cond.get("ranges");
			if (rangesObj instanceof Map) {
				Map<String, Object> currencyRanges = (Map<String, Object>) rangesObj;
				String txCurrency = tx.getCurrency();
				if (txCurrency != null && currencyRanges.containsKey(txCurrency)) {
					Map<String, Object> range = (Map<String, Object>) currencyRanges.get(txCurrency);
					minAmount = new BigDecimal(range.get("min").toString());
					maxAmount = new BigDecimal(range.get("max").toString());
					logger.info("💰 Multi-currency range for {}: {} - {}", txCurrency, minAmount, maxAmount);
				}
			} else {
				// Single currency ranges
				minAmount = RuleUtils.getBigDecimal(cond, "minAmount");
				maxAmount = RuleUtils.getBigDecimal(cond, "maxAmount");
			}
			
			// For range-based rules (like structuring), use minAmount as threshold
			if (threshold == null && minAmount != null) {
				threshold = minAmount;
			}
			if (threshold == null && maxAmount != null) {
				threshold = maxAmount;
			}
			
			// Currency is optional - if not specified, apply to all currencies
			String currency = RuleUtils.getString(cond, "currency");
			if (currency == null || currency.trim().isEmpty()) {
				currency = "ANY"; // Apply to any currency
			}
			
			// Check transaction type filter
			String expectedTxType = RuleUtils.getString(cond, "transactionType");
			if (expectedTxType != null && !expectedTxType.isEmpty()) {
			    if (tx.getTransactionType() == null || 
			        !tx.getTransactionType().name().equalsIgnoreCase(expectedTxType)) {
			        logger.debug("✅ THRESHOLD PASSED: {} | Transaction type mismatch", rule.getName());
			        return false;
			    }
			}
			
			// Check applyTo direction filter (outbound/inbound)
			String applyTo = RuleUtils.getString(cond, "applyTo");
			if (applyTo != null && !applyTo.isEmpty()) {
			    boolean isOutbound = tx.getTransactionType() != null && 
			                        (tx.getTransactionType().name().equals("DEBIT") || 
			                         tx.getTransactionType().name().equals("TRANSFER"));
			    boolean isInbound = tx.getTransactionType() != null && 
			                       tx.getTransactionType().name().equals("CREDIT");
			    
			    if ("outbound".equalsIgnoreCase(applyTo) && !isOutbound) {
			        logger.debug("✅ THRESHOLD PASSED: {} | Not an outbound transaction", rule.getName());
			        return false;
			    } else if ("inbound".equalsIgnoreCase(applyTo) && !isInbound) {
			        logger.debug("✅ THRESHOLD PASSED: {} | Not an inbound transaction", rule.getName());
			        return false;
			    }
			}
			
			// Check cross-border filter (for International Transfer rules)
			Object isCrossBorderObj = cond.get("isCrossBorder");
			if (isCrossBorderObj != null && Boolean.TRUE.equals(isCrossBorderObj)) {
				// Check if transaction is cross-border (different country codes)
				String senderCountry = tx.getCountryCode();
				String receiverCountry = tx.getCounterpartyCountryCode();
				if (senderCountry == null || receiverCountry == null || senderCountry.equals(receiverCountry)) {
					logger.debug("✅ THRESHOLD PASSED: {} | Not a cross-border transaction", rule.getName());
					return false;
				}
			}
			
			// Check account segment filter (for Corporate Payment rules)
			String expectedSegment = RuleUtils.getString(cond, "accountSegment");
			if (expectedSegment != null && !expectedSegment.isEmpty()) {
				// Try to get account type from sender account
				// Note: This assumes you have account type info available
				// If not available in Transaction, this check will be skipped
				logger.debug("💰 Account segment filter: {} (check skipped - field not available)", expectedSegment);
				// Skip this check for now since accountSegment field doesn't exist in Transaction
			}
			
			logger.info("💰 Parsed threshold: {} {}", threshold, currency);
			
			// Debug transaction fields
			logger.info("💰 Transaction amount: {} {}", tx.getAmount(), tx.getCurrency());
			
			if (tx.getAmount() == null || tx.getCurrency() == null) {
				logger.warn("💰 Transaction missing required fields - amount: {}, currency: {}", 
						tx.getAmount(), tx.getCurrency());
				return false;
			}

			// Check threshold - handle both simple threshold and range-based rules
			boolean currencyMatches = "ANY".equals(currency) || tx.getCurrency().equalsIgnoreCase(currency);
			boolean triggered = false;
			
			if (threshold != null && currencyMatches) {
				if (minAmount != null && maxAmount != null) {
					// Range-based rule (e.g., structuring detection)
					triggered = tx.getAmount().compareTo(minAmount) >= 0 && tx.getAmount().compareTo(maxAmount) <= 0;
					if (triggered) {
						logger.warn("⚠️ THRESHOLD RULE TRIGGERED: {} | {} {} is between {} and {} (currency: {})", 
								rule.getName(), tx.getAmount(), tx.getCurrency(), minAmount, maxAmount, currency);
					} else {
						logger.info("✅ THRESHOLD RULE PASSED: {} | {} {} not in range [{}, {}]", 
								rule.getName(), tx.getAmount(), tx.getCurrency(), minAmount, maxAmount);
					}
				} else {
					// Simple threshold rule
					triggered = tx.getAmount().compareTo(threshold) >= 0;
					if (triggered) {
						logger.warn("⚠️ THRESHOLD RULE TRIGGERED: {} | {} {} >= {} (currency: {})", 
								rule.getName(), tx.getAmount(), tx.getCurrency(), threshold, currency);
					} else {
						logger.info("✅ THRESHOLD RULE PASSED: {} | {} {} < {}", 
								rule.getName(), tx.getAmount(), tx.getCurrency(), threshold);
					}
				}
			} else {
				logger.info("✅ THRESHOLD RULE PASSED: {} | Currency mismatch - tx: {}, rule: {}", 
						rule.getName(), tx.getCurrency(), currency);
			}
			// ====================== NEW ADDITIONS ======================

			// (A) High Amount-to-Balance Ratio Check
			BigDecimal balance = transactionRepository.findCurrentBalance(tx.getCustomer().getUserId());

			if (cond.containsKey("amountToBalanceRatio")) {
			    BigDecimal ratio = RuleUtils.getBigDecimal(cond, "amountToBalanceRatio");
			    if (ratio != null && balance != null) {
			        BigDecimal ratioLimit = balance.multiply(ratio);
			        if (tx.getAmount().compareTo(ratioLimit) > 0) {
			            logger.warn("⚠️ THRESHOLD TRIGGERED: {} | Tx amount {} exceeds {}% of balance ({})",
			                    rule.getName(),
			                    tx.getAmount(),
			                    ratio.multiply(BigDecimal.valueOf(100)),
			                    balance);
			            return true;
			        }
			    }
			}

			// (B) Deviation from Past Behavior
			if (cond.containsKey("historicalDays") && cond.containsKey("deviationFactor")) {
			    int days = RuleUtils.getInt(cond, "historicalDays");
			    BigDecimal factor = RuleUtils.getBigDecimal(cond, "deviationFactor");

			    // Fetch average amount for last N days
			    BigDecimal avg = transactionRepository.findAverageAmount(
			        tx.getCustomer().getUserId(),
			        LocalDateTime.now().minusDays(days));

			    if (avg != null && factor != null) {
			        BigDecimal limit = avg.multiply(factor);
			        if (tx.getAmount().compareTo(limit) > 0) {
			            logger.warn("⚠️ THRESHOLD TRIGGERED: {} | Tx amount {} > {}x avg ({} over {} days)",
			                    rule.getName(), tx.getAmount(), factor, avg, days);
			            return true;
			        }
			    }
			}
			// ====================== END ADDITIONS ======================

			return triggered;
		} catch (Exception e) {
			logger.error("❌ Error evaluating threshold rule {}: {}", rule.getName(), e.getMessage(), e);
			return false;
		}
	}

	@Override
	public int getRiskScoreImpact(Rule rule) {
		return Optional.ofNullable(rule).map(Rule::getRiskScoreImpact).orElse(50);
	}
}