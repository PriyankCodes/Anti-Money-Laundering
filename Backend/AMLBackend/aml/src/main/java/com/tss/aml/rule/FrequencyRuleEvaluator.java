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
public class FrequencyRuleEvaluator implements RuleEvaluator {

    private static final Logger logger = LoggerFactory.getLogger(FrequencyRuleEvaluator.class);

    @Autowired
    private TransactionRepository transactionRepository;

    @Override
    public boolean supports(String ruleType) {
        return "FREQUENCY".equalsIgnoreCase(ruleType);
    }

    @Override
    public boolean evaluate(Transaction tx, Rule rule) {
        try {
            if (tx == null || tx.getCustomer() == null) {
                return false;
            }

            Map<String, Object> cond = ObjectMapperHolder.readMap(rule.getConditions());
            Integer maxCount = RuleUtils.getInt(cond, "maxTransactions");
            Integer windowMinutes = RuleUtils.getInt(cond, "timeWindowMinutes");

            // Check for per-currency overrides
            Object perCurrencyObj = cond.get("perCurrencyOverrides");
            if (perCurrencyObj instanceof Map && tx.getCurrency() != null) {
                Map<String, Object> perCurrencyOverrides = (Map<String, Object>) perCurrencyObj;
                if (perCurrencyOverrides.containsKey(tx.getCurrency())) {
                    Map<String, Object> currencyOverride = (Map<String, Object>) perCurrencyOverrides.get(tx.getCurrency());
                    if (currencyOverride.containsKey("maxTransactions")) {
                        maxCount = Integer.parseInt(currencyOverride.get("maxTransactions").toString());
                        logger.info("📊 Using per-currency override for {}: maxTransactions={}", tx.getCurrency(), maxCount);
                    }
                    if (currencyOverride.containsKey("timeWindowMinutes")) {
                        windowMinutes = Integer.parseInt(currencyOverride.get("timeWindowMinutes").toString());
                        logger.info("📊 Using per-currency override for {}: timeWindowMinutes={}", tx.getCurrency(), windowMinutes);
                    }
                }
            }

            if (maxCount == null || windowMinutes == null) {
                logger.warn("Skipping FREQUENCY rule '{}' due to missing conditions", rule.getName());
                return false;
            }

            LocalDateTime cutoff = tx.getTimestamp().minusMinutes(windowMinutes);
            
            // Check for channel filter (e.g., CASH deposits)
            String channel = RuleUtils.getString(cond, "channel");
            if (channel != null && !channel.isEmpty()) {
                // Note: Requires 'channel' field in Transaction entity
                // For now, log and skip this filter
                logger.debug("📊 Channel filter: {} (check skipped - field not available)", channel);
            }
            
            // Check for multi-currency minDepositAmount
            BigDecimal minDepositAmount = null;
            Object minDepositObj = cond.get("minDepositAmount");
            if (minDepositObj instanceof Map) {
                Map<String, Object> currencyAmounts = (Map<String, Object>) minDepositObj;
                String txCurrency = tx.getCurrency();
                if (txCurrency != null && currencyAmounts.containsKey(txCurrency)) {
                    minDepositAmount = new BigDecimal(currencyAmounts.get(txCurrency).toString());
                    logger.info("📊 Multi-currency minDepositAmount for {}: {}", txCurrency, minDepositAmount);
                }
            } else if (minDepositObj != null) {
                minDepositAmount = RuleUtils.getBigDecimal(cond, "minDepositAmount");
            }
            
            // If minDepositAmount is specified, check if current transaction meets it
            if (minDepositAmount != null && tx.getAmount() != null) {
                if (tx.getAmount().compareTo(minDepositAmount) < 0) {
                    logger.debug("✅ FREQUENCY PASSED: {} | Amount {} below minimum {}", 
                        rule.getName(), tx.getAmount(), minDepositAmount);
                    return false;
                }
            }

            // count previous transactions AFTER cutoff (not including current tx) then add 1
            long previousCount = transactionRepository.countByCustomerUserIdAndTimestampAfter(
                tx.getCustomer().getUserId(), cutoff);
            long count = previousCount + 1L; // include current tx
            
            // Check for near-threshold structuring (nearThresholdPct)
            BigDecimal nearThresholdPct = RuleUtils.getBigDecimal(cond, "nearThresholdPct");
            if (nearThresholdPct != null) {
                // Get reporting threshold for currency (e.g., 10000 for most currencies)
                BigDecimal reportingThreshold = getReportingThreshold(tx.getCurrency());
                BigDecimal nearThreshold = reportingThreshold.multiply(nearThresholdPct);
                
                if (tx.getAmount().compareTo(nearThreshold) >= 0 && 
                    tx.getAmount().compareTo(reportingThreshold) < 0) {
                    logger.warn("⚠️ FREQUENCY TRIGGERED (STRUCTURING): {} | Amount {} is {}% of reporting threshold {}",
                        rule.getName(), tx.getAmount(), nearThresholdPct.multiply(BigDecimal.valueOf(100)), reportingThreshold);
                    return true;
                }
            }
            
            boolean triggered = count >= maxCount;

            if (triggered) {
                logger.warn("⚠️ FREQUENCY TRIGGERED: {} | count={} >= {}", rule.getName(), count, maxCount);
            } else {
                logger.debug("✅ FREQUENCY PASSED: {} | count={}", rule.getName(), count);
            }

            // ====================== NEW ADDITION: dormant spike detection ======================
            if (cond != null && cond.containsKey("dormantDays") && cond.containsKey("minAmount")) {
                Integer dormantDays = RuleUtils.getInt(cond, "dormantDays");
                BigDecimal minAmount = RuleUtils.getBigDecimal(cond, "minAmount");
                boolean requireFirstLarge = RuleUtils.getBoolean(cond, "requireFirstLargeAfterDormancy", false);

                if (dormantDays != null && minAmount != null) {
                    LocalDateTime lastTx = transactionRepository.findLastTransactionTime(tx.getCustomer().getUserId());
                    if (lastTx != null) {
                        long gap = java.time.temporal.ChronoUnit.DAYS.between(lastTx, tx.getTimestamp());
                        if (gap >= dormantDays && tx.getAmount() != null && tx.getAmount().compareTo(minAmount) >= 0) {
                            // If requireFirstLarge is true, only trigger on the FIRST large transaction after dormancy
                            if (requireFirstLarge) {
                                // Check if there are any other large transactions since lastTx
                                LocalDateTime dormancyCutoff = lastTx.plusSeconds(1);
                                long largeTransactionsSinceDormancy = transactionRepository
                                    .countByCustomerUserIdAndTimestampAfterAndTransactionTypeAndAmountGreaterThanEqual(
                                        tx.getCustomer().getUserId(),
                                        dormancyCutoff,
                                        tx.getTransactionType(),
                                        minAmount);
                                
                                if (largeTransactionsSinceDormancy > 1) {
                                    // Not the first large transaction, skip
                                    logger.debug("✅ FREQUENCY PASSED (DORMANT): {} | Not first large transaction after dormancy", 
                                        rule.getName());
                                    return false;
                                }
                            }
                            
                            logger.warn("⚠️ FREQUENCY TRIGGERED (DORMANT): {} | Account dormant {} days → txn {}",
                                    rule.getName(), gap, tx.getAmount());
                            return true;
                        }
                    }
                }
            }
            // ====================== END ADDITION ======================

            return triggered;

        } catch (Exception e) {
            logger.error("❌ Error evaluating frequency rule {}: {}", rule != null ? rule.getName() : "unknown", e.getMessage(), e);
            return false;
        }
    }

    @Override
    public int getRiskScoreImpact(Transaction tx, Rule rule) {
        try {
            Map<String, Object> cond = ObjectMapperHolder.readMap(rule.getConditions());
            Integer maxCount = RuleUtils.getInt(cond, "maxTransactions");
            Integer windowMinutes = RuleUtils.getInt(cond, "timeWindowMinutes");

            if (maxCount == null || windowMinutes == null || tx.getCustomer() == null) {
                return rule.getRiskScoreImpact();
            }

            LocalDateTime cutoff = tx.getTimestamp().minusMinutes(windowMinutes);
            // count previous txs (do NOT include current) then add 1 to represent current
            long previousCount = transactionRepository.countByCustomerUserIdAndTimestampAfter(
                tx.getCustomer().getUserId(), cutoff);
            long count = previousCount + 1L;

            int baseImpact = rule.getRiskScoreImpact();
            // multiplier scales linearly with excess transactions
            double multiplier = 1.0 + (Math.max(0, count - maxCount) * 0.1);
            int scaled = (int) Math.round(baseImpact * multiplier);
            return Math.min(100, scaled);
        } catch (Exception e) {
            logger.error("Error calculating risk impact for rule {}: {}", rule != null ? rule.getName() : "unknown", e.getMessage(), e);
            return rule.getRiskScoreImpact();
        }
    }

    // 👇 NEW METHOD: calculate scaled risk based on actual count
    public int calculateScaledRiskScore(Rule rule, long actualCount) {
        if (rule == null || actualCount <= 0) {
            return 0;
        }

        Map<String, Object> cond = null;
        try {
            cond = ObjectMapperHolder.readMap(rule.getConditions());
        } catch (Exception e) {
            logger.warn("Unable to parse conditions for rule {}: {}", rule.getName(), e.getMessage());
        }
        Integer maxCount = RuleUtils.getInt(cond, "maxTransactions");
        int baseImpact = rule.getRiskScoreImpact();

        if (maxCount == null || maxCount <= 0) {
            return baseImpact; // fallback
        }

        // Scale: at maxCount → baseImpact, each extra tx increases multiplier by 0.1 (10%)
        double multiplier = 1.0 + (Math.max(0, actualCount - maxCount) * 0.1);
        int scaled = (int) Math.round(baseImpact * multiplier);
        return Math.min(100, scaled);
    }
    
    /**
     * Get reporting threshold by currency for structuring detection
     */
    private BigDecimal getReportingThreshold(String currency) {
        if (currency == null) return new BigDecimal("10000");
        
        switch (currency.toUpperCase()) {
            case "USD": return new BigDecimal("10000");
            case "INR": return new BigDecimal("1000000");
            case "EUR": return new BigDecimal("10000");
            case "GBP": return new BigDecimal("10000");
            default: return new BigDecimal("10000");
        }
    }
}
