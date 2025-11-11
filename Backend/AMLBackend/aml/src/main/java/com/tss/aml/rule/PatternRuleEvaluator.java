package com.tss.aml.rule;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

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
public class PatternRuleEvaluator implements RuleEvaluator {

	private static final Logger logger = LoggerFactory.getLogger(PatternRuleEvaluator.class);
	
	@Autowired
	private TransactionRepository transactionRepository;

	@Override
	public boolean supports(String ruleType) {
		return "PATTERN".equalsIgnoreCase(ruleType);
	}

	@Override
	public boolean evaluate(Transaction tx, Rule rule) {
	    try {
	        if (tx == null) return false;
	        Map<String, Object> cond = ObjectMapperHolder.readMap(rule.getConditions());
	        String regex = RuleUtils.getString(cond, "regex");
	        String field = RuleUtils.getString(cond, "field"); // "description" or "amount"
	        Integer minRepeats = RuleUtils.getInt(cond, "minRepeats");
	        Integer occurrenceWindowMinutes = RuleUtils.getInt(cond, "occurrenceWindowMinutes");

	        if (regex == null || regex.trim().isEmpty()) {
	            logger.warn("Skipping PATTERN rule {} – missing regex", rule.getName());
	            return false;
	        }

	        String text = "";
	        if ("amount".equalsIgnoreCase(field)) {
	            text = Optional.ofNullable(tx.getAmount()).map(BigDecimal::toString).orElse("");
	        } else {
	            // default to description
	            text = Optional.ofNullable(tx.getDescription()).orElse("");
	        }

	        boolean currentMatches = Pattern.compile(regex, Pattern.CASE_INSENSITIVE).matcher(text).find();
	        
	        // If minRepeats is specified, check for pattern repetition in time window
	        if (minRepeats != null && minRepeats > 1 && occurrenceWindowMinutes != null) {
	            if (!currentMatches) {
	                logger.debug("✅ PATTERN PASSED: {} | Current transaction doesn't match", rule.getName());
	                return false;
	            }
	            
	            // Count how many recent transactions match the pattern
	            LocalDateTime cutoff = tx.getTimestamp().minusMinutes(occurrenceWindowMinutes);
	            List<Transaction> recentTxs = transactionRepository.findRecentTransactions(
	                tx.getCustomer().getUserId(), cutoff);
	            
	            int matchCount = 1; // current transaction
	            Pattern pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
	            
	            for (Transaction recentTx : recentTxs) {
	                String recentText = "";
	                if ("amount".equalsIgnoreCase(field)) {
	                    recentText = Optional.ofNullable(recentTx.getAmount()).map(BigDecimal::toString).orElse("");
	                } else {
	                    recentText = Optional.ofNullable(recentTx.getDescription()).orElse("");
	                }
	                
	                if (pattern.matcher(recentText).find()) {
	                    matchCount++;
	                }
	            }
	            
	            boolean triggered = matchCount >= minRepeats;
	            if (triggered) {
	                logger.warn("⚠️ PATTERN TRIGGERED (REPETITION): {} | field={} | regex={} | matches={}/{} in {} min",
	                    rule.getName(), field, regex, matchCount, minRepeats, occurrenceWindowMinutes);
	            } else {
	                logger.debug("✅ PATTERN PASSED: {} | matches={} < required={}", 
	                    rule.getName(), matchCount, minRepeats);
	            }
	            return triggered;
	        }
	        
	        // Simple pattern match (no repetition check)
	        if (currentMatches)
	            logger.warn("⚠️ PATTERN TRIGGERED: {} | field={} | regex={}", rule.getName(), field, regex);
	        else
	            logger.debug("✅ PATTERN PASSED: {}", rule.getName());
	        return currentMatches;
	    } catch (Exception e) {
	        logger.error("❌ Error evaluating pattern rule {}: {}", rule.getName(), e.getMessage());
	        return false;
	    }
	}

	@Override
	public int getRiskScoreImpact(Rule rule) {
		return Optional.ofNullable(rule).map(Rule::getRiskScoreImpact).orElse(40);
	}
}