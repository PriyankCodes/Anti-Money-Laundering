package com.tss.aml.rule;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.tss.aml.entity.Rule;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.TransactionType;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.util.ObjectMapperHolder;
import com.tss.aml.util.RuleUtils;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class VelocityRuleEvaluator implements RuleEvaluator {

    private static final Logger logger = LoggerFactory.getLogger(VelocityRuleEvaluator.class);

    private final TransactionRepository transactionRepository;

    @Override
    public boolean supports(String ruleType) {
        return "VELOCITY".equalsIgnoreCase(ruleType);
    }

    @Override
    public boolean evaluate(Transaction tx, Rule rule) {
        try {
            if (tx == null || tx.getCustomer() == null || tx.getAmount() == null) {
                return false;
            }

            Map<String, Object> cond = ObjectMapperHolder.readMap(rule.getConditions());
            
            // Check for multi-window rules array (e.g., Outbound Velocity with multiple time windows)
            Object rulesObj = cond.get("rules");
            if (rulesObj instanceof List) {
                List<Map<String, Object>> rulesArray = (List<Map<String, Object>>) rulesObj;
                for (Map<String, Object> subRule : rulesArray) {
                    if (evaluateSubRule(tx, subRule, rule.getName())) {
                        return true; // Triggered by any sub-rule
                    }
                }
                return false; // None of the sub-rules triggered
            }
            
            // Handle multi-currency minAmount
            BigDecimal minAmount = null;
            Object minAmountObj = cond.get("minAmount");
            if (minAmountObj instanceof Map) {
                Map<String, Object> currencyAmounts = (Map<String, Object>) minAmountObj;
                String txCurrency = tx.getCurrency();
                if (txCurrency != null && currencyAmounts.containsKey(txCurrency)) {
                    minAmount = new BigDecimal(currencyAmounts.get(txCurrency).toString());
                    logger.info("🚀 Multi-currency minAmount for {}: {}", txCurrency, minAmount);
                }
            } else if (minAmountObj != null) {
                minAmount = RuleUtils.getBigDecimal(cond, "minAmount");
            }
            
            // Handle multi-currency totalAmountThreshold (for cumulative rules)
            BigDecimal totalAmountThreshold = null;
            Object totalThresholdObj = cond.get("totalAmountThreshold");
            if (totalThresholdObj instanceof Map) {
                Map<String, Object> currencyThresholds = (Map<String, Object>) totalThresholdObj;
                String txCurrency = tx.getCurrency();
                if (txCurrency != null && currencyThresholds.containsKey(txCurrency)) {
                    totalAmountThreshold = new BigDecimal(currencyThresholds.get(txCurrency).toString());
                    logger.info("🚀 Multi-currency totalAmountThreshold for {}: {}", txCurrency, totalAmountThreshold);
                }
            } else if (totalThresholdObj != null) {
                totalAmountThreshold = RuleUtils.getBigDecimal(cond, "totalAmountThreshold");
            }
            
            Integer windowMinutes = RuleUtils.getInt(cond, "timeWindowMinutes");
            Integer maxTransactions = RuleUtils.getInt(cond, "maxTransactions");

            if (windowMinutes == null || maxTransactions == null) {
                logger.warn("Skipping VELOCITY rule {} due to missing conditions", rule.getName());
                return false;
            }
            
            // Check applyTo direction filter (outbound/inbound)
            String applyTo = RuleUtils.getString(cond, "applyTo");
            if (applyTo != null && !applyTo.isEmpty()) {
                boolean isOutbound = tx.getTransactionType() == TransactionType.DEBIT || 
                                    tx.getTransactionType() == TransactionType.TRANSFER;
                boolean isInbound = tx.getTransactionType() == TransactionType.CREDIT;
                
                if ("outbound".equalsIgnoreCase(applyTo) && !isOutbound) {
                    logger.debug("✅ VELOCITY PASSED: {} | Not an outbound transaction", rule.getName());
                    return false;
                } else if ("inbound".equalsIgnoreCase(applyTo) && !isInbound) {
                    logger.debug("✅ VELOCITY PASSED: {} | Not an inbound transaction", rule.getName());
                    return false;
                }
            }
            
            // Check for cumulative amount threshold (Cumulative Daily Outflow)
            if (totalAmountThreshold != null) {
                LocalDateTime cutoff = tx.getTimestamp().minusMinutes(windowMinutes);
                // Sum all outbound transactions in the window
                BigDecimal totalAmount = transactionRepository.sumAmountByCustomerAndTimeWindow(
                    tx.getCustomer().getUserId(), cutoff, tx.getTimestamp());
                
                if (totalAmount != null && totalAmount.compareTo(totalAmountThreshold) >= 0) {
                    logger.warn("⚠️ VELOCITY TRIGGERED (CUMULATIVE): {} | Total amount {} >= threshold {}",
                        rule.getName(), totalAmount, totalAmountThreshold);
                    return true;
                }
            }

            // Ignore transactions below the minimum amount
            if (minAmount != null && tx.getAmount().compareTo(minAmount) < 0) {
                logger.debug("✅ VELOCITY PASSED: {} | Amount below min", rule.getName());
                return false;
            }

            // Calculate cutoff time
            LocalDateTime cutoff = tx.getTimestamp().minusMinutes(windowMinutes);
            
            // Determine transaction type to count based on applyTo
            TransactionType typeToCount = TransactionType.CREDIT; // default
            if (applyTo != null && "outbound".equalsIgnoreCase(applyTo)) {
                typeToCount = TransactionType.DEBIT;
            }

            // Count recent qualifying transactions from DB
            long recentTxCount = transactionRepository
                    .countByCustomerUserIdAndTimestampAfterAndTransactionTypeAndAmountGreaterThanEqual(
                            tx.getCustomer().getUserId(),
                            cutoff,
                            typeToCount,
                            minAmount != null ? minAmount : BigDecimal.ZERO);

            // Include the current transaction in the count
            long totalTxCount = recentTxCount + 1;

            boolean triggered = totalTxCount > maxTransactions;

            if (triggered) {
                logger.warn("⚠️ VELOCITY TRIGGERED: {} | RecentTxCount={} | Threshold={}",
                        rule.getName(), totalTxCount, maxTransactions);
            } else {
                logger.debug("✅ VELOCITY PASSED: {} | RecentTxCount={} | Threshold={}",
                        rule.getName(), totalTxCount, maxTransactions);
            }
         // ====================== NEW ADDITION ======================
            boolean checkAlternation = RuleUtils.getBoolean(cond, "checkAlternation", false);
            if (checkAlternation) {
                // Fetch recent transactions
                 cutoff = tx.getTimestamp().minusMinutes(windowMinutes);
                List<Transaction> recent = transactionRepository.findRecentTransactions(
                    tx.getCustomer().getUserId(), cutoff);
                recent.add(tx); // include current one

                boolean alternating = true;
                for (int i = 1; i < recent.size(); i++) {
                    if (recent.get(i).getTransactionType() == recent.get(i - 1).getTransactionType() ||
                        recent.get(i).getAmount().compareTo(recent.get(i - 1).getAmount()) != 0) {
                        alternating = false;
                        break;
                    }
                }
                if (alternating && recent.size() >= 4) { // at least 4 alternating txns
                    logger.warn("⚠️ VELOCITY TRIGGERED: {} | Alternating credit/debit pattern for customer {}",
                            rule.getName(), tx.getCustomer().getUserId());
                    return true;
                }
            }
            // ====================== END ADDITION ======================


            return triggered;

        } catch (Exception e) {
            logger.error("❌ Error evaluating velocity rule {}: {}", rule.getName(), e.getMessage(), e);
            return false;
        }
    }

    @Override
    public int getRiskScoreImpact(Rule rule) {
        return Optional.ofNullable(rule).map(Rule::getRiskScoreImpact).orElse(40);
    }
    
    /**
     * Evaluate a sub-rule from a rules array (for multi-window velocity checks)
     */
    private boolean evaluateSubRule(Transaction tx, Map<String, Object> subRule, String parentRuleName) {
        try {
            Integer windowMinutes = RuleUtils.getInt(subRule, "timeWindowMinutes");
            Integer maxTransactions = RuleUtils.getInt(subRule, "maxTransactions");
            String subRuleName = RuleUtils.getString(subRule, "name");
            
            // Handle multi-currency minAmount
            BigDecimal minAmount = null;
            Object minAmountObj = subRule.get("minAmount");
            if (minAmountObj instanceof Map) {
                Map<String, Object> currencyAmounts = (Map<String, Object>) minAmountObj;
                String txCurrency = tx.getCurrency();
                if (txCurrency != null && currencyAmounts.containsKey(txCurrency)) {
                    minAmount = new BigDecimal(currencyAmounts.get(txCurrency).toString());
                }
            } else if (minAmountObj != null) {
                minAmount = new BigDecimal(minAmountObj.toString());
            }
            
            if (windowMinutes == null || maxTransactions == null) {
                return false;
            }
            
            // Check minimum amount
            if (minAmount != null && tx.getAmount().compareTo(minAmount) < 0) {
                return false;
            }
            
            LocalDateTime cutoff = tx.getTimestamp().minusMinutes(windowMinutes);
            long recentTxCount = transactionRepository
                .countByCustomerUserIdAndTimestampAfterAndTransactionTypeAndAmountGreaterThanEqual(
                    tx.getCustomer().getUserId(),
                    cutoff,
                    TransactionType.CREDIT,
                    minAmount != null ? minAmount : BigDecimal.ZERO);
            
            long totalTxCount = recentTxCount + 1;
            
            if (totalTxCount > maxTransactions) {
                logger.warn("⚠️ VELOCITY SUB-RULE TRIGGERED: {} - {} | Count={} > {}",
                    parentRuleName, subRuleName, totalTxCount, maxTransactions);
                return true;
            }
            
            return false;
        } catch (Exception e) {
            logger.error("Error evaluating velocity sub-rule: {}", e.getMessage());
            return false;
        }
    }
}
