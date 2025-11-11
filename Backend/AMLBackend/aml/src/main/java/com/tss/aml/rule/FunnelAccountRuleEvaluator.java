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
public class FunnelAccountRuleEvaluator implements RuleEvaluator {

    private static final Logger logger = LoggerFactory.getLogger(FunnelAccountRuleEvaluator.class);

    @Autowired
    private TransactionRepository transactionRepository;

    @Override
    public boolean supports(String ruleType) {
        return "FUNNEL_ACCOUNT".equalsIgnoreCase(ruleType);
    }

    @Override
    public boolean evaluate(Transaction tx, Rule rule) {
        Map<String, Object> cond = null;
        try {
            cond = ObjectMapperHolder.readMap(rule.getConditions());
        } catch (Exception e) {
            logger.error("Failed to parse FUNNEL_ACCOUNT rule conditions", e);
            return false;
        }
        
        // Check aggregationTargetField (default: counterpartyAccount)
        String aggregationField = RuleUtils.getString(cond, "aggregationTargetField");
        if (aggregationField == null || aggregationField.isEmpty()) {
            aggregationField = "receiverAccount"; // default
        }
        
        // Get the receiver ID based on aggregationTargetField
        String receiverId = null;
        if ("receiverAccount".equalsIgnoreCase(aggregationField) || "counterpartyAccount".equalsIgnoreCase(aggregationField)) {
            receiverId = tx.getCounterpartyAccount();
        } else if ("senderAccount".equalsIgnoreCase(aggregationField)) {
            receiverId = tx.getSenderAccountNumber();
        } else {
            logger.warn("🔀 Unsupported aggregationTargetField: {} - defaulting to counterpartyAccount", aggregationField);
            receiverId = tx.getCounterpartyAccount();
        }
        
        if (receiverId == null || receiverId.trim().isEmpty()) {
            logger.debug("No {} – skipping funnel rule", aggregationField);
            return false;
        }

        // Check for dual time window support (short + extended)
        Integer minSendersShort = RuleUtils.getInt(cond, "minSendersShortWindow");
        Integer windowMinutesShort = RuleUtils.getInt(cond, "timeWindowMinutesShort");
        Integer minSendersExtended = RuleUtils.getInt(cond, "minSendersExtended");
        Integer windowMinutesExtended = RuleUtils.getInt(cond, "timeWindowMinutesExtended");

        // Handle multi-currency minAmountPerSender
        BigDecimal minAmountPerSender = null;
        Object minAmountObj = cond.get("minAmountPerSender");
        if (minAmountObj instanceof Map) {
            Map<String, Object> currencyAmounts = (Map<String, Object>) minAmountObj;
            String txCurrency = tx.getCurrency();
            if (txCurrency != null && currencyAmounts.containsKey(txCurrency)) {
                minAmountPerSender = new BigDecimal(currencyAmounts.get(txCurrency).toString());
                logger.info("🔀 Multi-currency minAmountPerSender for {}: {}", txCurrency, minAmountPerSender);
            }
        } else if (minAmountObj != null) {
            minAmountPerSender = RuleUtils.getBigDecimal(cond, "minAmountPerSender");
        }

        // Check if current transaction meets minimum amount
        if (minAmountPerSender != null && tx.getAmount() != null) {
            if (tx.getAmount().compareTo(minAmountPerSender) < 0) {
                logger.debug("✅ FUNNEL PASSED: Amount {} below minimum {}", 
                    tx.getAmount(), minAmountPerSender);
                return false;
            }
        }

        // Dual time window check
        if (minSendersShort != null && windowMinutesShort != null && 
            minSendersExtended != null && windowMinutesExtended != null) {

            // Check short window
            LocalDateTime cutoffShort = tx.getTimestamp().minusMinutes(windowMinutesShort);
            long uniqueSendersShort = transactionRepository.countDistinctSendersToReceiverAfter(
                receiverId, cutoffShort);

            // Check extended window
            LocalDateTime cutoffExtended = tx.getTimestamp().minusMinutes(windowMinutesExtended);
            long uniqueSendersExtended = transactionRepository.countDistinctSendersToReceiverAfter(
                receiverId, cutoffExtended);

            boolean shortTriggered = uniqueSendersShort >= minSendersShort;
            boolean extendedTriggered = uniqueSendersExtended >= minSendersExtended;

            if (shortTriggered || extendedTriggered) {
                logger.warn("⚠️ FUNNEL ACCOUNT DETECTED: receiver={} | Short: {}/{} senders in {} min | Extended: {}/{} senders in {} min",
                    receiverId, uniqueSendersShort, minSendersShort, windowMinutesShort,
                    uniqueSendersExtended, minSendersExtended, windowMinutesExtended);
                return true;
            }
            return false;
        }

        // Single time window check (backward compatibility)
        Integer minSenders = RuleUtils.getInt(cond, "minSenders");
        Integer windowMinutes = RuleUtils.getInt(cond, "timeWindowMinutes");

        if (minSenders == null || windowMinutes == null) {
            logger.warn("Missing conditions in FUNNEL_ACCOUNT rule");
            return false;
        }

        LocalDateTime cutoff = tx.getTimestamp().minusMinutes(windowMinutes);

        // Count distinct senders (customer.userIds) sending to this receiverId in time window
        long uniqueSenders = transactionRepository.countDistinctSendersToReceiverAfter(
            receiverId, cutoff
        );

        boolean triggered = uniqueSenders >= minSenders;
        if (triggered) {
            logger.warn("⚠️ FUNNEL ACCOUNT DETECTED: {}+ unique senders to receiver {} in {} minutes",
                uniqueSenders, receiverId, windowMinutes);
        }
        return triggered;
    }

    @Override
    public int getRiskScoreImpact(Rule rule) {
        return Optional.ofNullable(rule).map(Rule::getRiskScoreImpact).orElse(75);
    }
}