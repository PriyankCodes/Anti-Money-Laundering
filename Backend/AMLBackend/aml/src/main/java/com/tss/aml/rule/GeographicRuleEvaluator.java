package com.tss.aml.rule;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.tss.aml.entity.Rule;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.RiskLevel;
import com.tss.aml.repository.RiskyCountryRepository;
import com.tss.aml.util.ObjectMapperHolder;

@Component
public class GeographicRuleEvaluator implements RuleEvaluator {

    private static final Logger logger = LoggerFactory.getLogger(GeographicRuleEvaluator.class);

    @Autowired
    private RiskyCountryRepository riskyCountryRepository;

    @Override
    public boolean supports(String ruleType) {
        return "GEOGRAPHIC".equalsIgnoreCase(ruleType);
    }

    @Override
    public boolean evaluate(Transaction tx, Rule rule) {
        try {
            // Parse rule conditions
            Map<String, Object> conditions = null;
            try {
                conditions = ObjectMapperHolder.readMap(rule.getConditions());
            } catch (Exception e) {
                logger.warn("⚠️ Failed to parse GEOGRAPHIC rule conditions");
            }
            
            // Check matchFields (default: ["originCountry", "destinationCountry"])
            List<String> matchFields = new ArrayList<>();
            if (conditions != null && conditions.containsKey("matchFields")) {
                Object matchFieldsObj = conditions.get("matchFields");
                if (matchFieldsObj instanceof List) {
                    matchFields = (List<String>) matchFieldsObj;
                }
            }
            
            if (matchFields.isEmpty()) {
                // Default: check both origin and destination
                matchFields.add("originCountry");
                matchFields.add("destinationCountry");
            }
            
            // Get sender's country code (if needed)
            String senderCountryCode = null;
            if (matchFields.contains("originCountry") || matchFields.contains("senderCountry")) {
                senderCountryCode = Optional.ofNullable(tx)
                    .map(Transaction::getCountryCode)
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .filter(code -> !code.isEmpty())
                    .orElse(null);
            }

            // Get receiver's country code (if needed)
            String receiverCountryCode = null;
            if (matchFields.contains("destinationCountry") || matchFields.contains("receiverCountry")) {
                receiverCountryCode = Optional.ofNullable(tx)
                    .map(Transaction::getCounterpartyCountryCode)
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .filter(code -> !code.isEmpty())
                    .orElse(null);
            }

            if (senderCountryCode == null && receiverCountryCode == null) {
                logger.debug("🌍 No country codes in transaction – skipping geographic rule");
                return false;
            }

            // Check BOTH sender and receiver countries (if specified in matchFields)
            boolean senderRisky = false;
            boolean receiverRisky = false;
            
            if (senderCountryCode != null && (matchFields.contains("originCountry") || matchFields.contains("senderCountry"))) {
                senderRisky = checkCountryRisk(senderCountryCode, tx, rule, "SENDER");
            }
            
            if (receiverCountryCode != null && (matchFields.contains("destinationCountry") || matchFields.contains("receiverCountry"))) {
                receiverRisky = checkCountryRisk(receiverCountryCode, tx, rule, "RECEIVER");
            }

            // Trigger if EITHER sender OR receiver is from risky country
            return senderRisky || receiverRisky;

        } catch (Exception e) {
            logger.error("❌ Error evaluating geographic rule {}: {}", 
                Optional.ofNullable(rule).map(Rule::getName).orElse("UNKNOWN"), e.getMessage(), e);
            return false;
        }
    }

    /**
     * Check if a country is risky and should trigger the rule
     */
    private boolean checkCountryRisk(String countryCode, Transaction tx, Rule rule, String party) {
        if (countryCode == null) {
            return false;
        }

        return riskyCountryRepository.findById(countryCode)
            .map(riskyCountry -> {
                RiskLevel riskLevel = riskyCountry.getRiskLevel();
                BigDecimal amount = Optional.ofNullable(tx.getAmount()).orElse(BigDecimal.ZERO);

                    // Parse thresholds from rule conditions (with fallbacks)
                    Map<String, Object> conditions = null;
                    try {
                        conditions = ObjectMapperHolder.readMap(rule.getConditions());
                    } catch (Exception e) {
                        logger.warn("⚠️ Failed to parse GEOGRAPHIC rule conditions – using defaults");
                    }

                    BigDecimal highThreshold = getThreshold(conditions, "highRiskAmountThreshold", new BigDecimal("50000"));
                    BigDecimal mediumThreshold = getThreshold(conditions, "mediumRiskAmountThreshold", new BigDecimal("500000"));

                    boolean shouldTrigger = false;

                    switch (riskLevel) {
                        case CRITICAL:
                            // Block ALL transactions – no amount check
                            shouldTrigger = true;
                            logger.warn("🚨 CRITICAL RISK COUNTRY DETECTED ({}) | Country: {} | Amount: {} | ACTION: BLOCK", 
                                party, countryCode, amount);
                            break;

                        case HIGH:
                            if (amount.compareTo(highThreshold) >= 0) {
                                shouldTrigger = true;
                                logger.warn("⚠️ HIGH RISK COUNTRY ({}) + LARGE AMOUNT | Country: {} | {} ≥ {} | ACTION: FLAG", 
                                    party, countryCode, amount, highThreshold);
                            } else {
                                logger.debug("✅ HIGH RISK COUNTRY ({}) BELOW THRESHOLD | Country: {} | {} < {}", 
                                    party, countryCode, amount, highThreshold);
                            }
                            break;

                        case MEDIUM:
                            if (amount.compareTo(mediumThreshold) >= 0) {
                                shouldTrigger = true;
                                logger.warn("⚠️ MEDIUM RISK COUNTRY ({}) + VERY LARGE AMOUNT | Country: {} | {} ≥ {} | ACTION: FLAG", 
                                    party, countryCode, amount, mediumThreshold);
                            } else {
                                logger.debug("✅ MEDIUM RISK COUNTRY ({}) BELOW THRESHOLD | Country: {} | {} < {}", 
                                    party, countryCode, amount, mediumThreshold);
                            }
                            break;

                        default:
                            // LOW or unknown – do not trigger
                            logger.debug("✅ Country {} ({}) is {} risk – ignored", countryCode, party, riskLevel);
                            shouldTrigger = false;
                    }

                    return shouldTrigger;
                })
                .orElse(false);
    }

    private BigDecimal getThreshold(Map<String, Object> conditions, String key, BigDecimal defaultValue) {
        if (conditions != null) {
            try {
                Object value = conditions.get(key);
                if (value instanceof Number) {
                    return new BigDecimal(value.toString());
                } else if (value instanceof String) {
                    return new BigDecimal((String) value);
                }
            } catch (Exception ex) {
                logger.warn("⚠️ Invalid threshold for '{}': {} – using default {}", key, conditions.get(key), defaultValue);
            }
        }
        return defaultValue;
    }

    @Override
    public int getRiskScoreImpact(Rule rule) {
        // This is a fallback; actual impact should be scaled in RuleEngineServiceImpl if needed
        return Optional.ofNullable(rule).map(Rule::getRiskScoreImpact).orElse(50);
    }
}