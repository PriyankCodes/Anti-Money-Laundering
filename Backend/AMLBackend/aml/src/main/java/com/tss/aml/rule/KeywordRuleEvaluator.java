package com.tss.aml.rule;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.tss.aml.entity.Rule;
import com.tss.aml.entity.SuspiciousKeyword;
import com.tss.aml.entity.Transaction;
import com.tss.aml.repository.SuspiciousKeywordRepository;
import com.tss.aml.util.ObjectMapperHolder;

@Component
public class KeywordRuleEvaluator implements RuleEvaluator {

	private static final Logger logger = LoggerFactory.getLogger(KeywordRuleEvaluator.class);

	@Autowired
	private SuspiciousKeywordRepository keywordRepository;

	@Override
	public boolean supports(String ruleType) {
		return "KEYWORD".equalsIgnoreCase(ruleType);
	}

	@Override
	public boolean evaluate(Transaction tx, Rule rule) {
		int scaledRisk = calculateKeywordRisk(tx, rule);
		boolean triggered = scaledRisk > 0;
		if (triggered) {
			logger.warn("⚠️ KEYWORD TRIGGERED: {} | Scaled Risk: {} (ruleImpact={})", rule.getName(), scaledRisk,
					Optional.ofNullable(rule).map(Rule::getRiskScoreImpact).orElse(0));
		} else {
			logger.debug("✅ KEYWORD PASSED: {} | No matches", rule.getName());
		}
		return triggered;
	}

	/**
	 * Returns a scaled risk value in range [0 .. rule.getRiskScoreImpact()] - Uses
	 * normalization of both description and keyword (removes punctuation, lowers
	 * case) - Matches multi-word phrases reliably
	 */
	public int calculateKeywordRisk(Transaction tx, Rule rule) {
		if (tx == null)
			return 0;
			
		// Get contextFields to scan (default: ["description"])
		Map<String, Object> cond = null;
		List<String> contextFields = new ArrayList<>();
		try {
			cond = ObjectMapperHolder.readMap(rule.getConditions());
			Object contextFieldsObj = cond.get("contextFields");
			if (contextFieldsObj instanceof List) {
				contextFields = (List<String>) contextFieldsObj;
			}
		} catch (Exception e) {
			logger.debug("No contextFields specified, using default");
		}
		
		if (contextFields.isEmpty()) {
			contextFields.add("description"); // default
		}
		
		// Collect text from all specified fields
		StringBuilder combinedText = new StringBuilder();
		for (String field : contextFields) {
			String fieldValue = null;
			if ("description".equalsIgnoreCase(field)) {
				fieldValue = tx.getDescription();
			} else if ("remitterNote".equalsIgnoreCase(field) || "note".equalsIgnoreCase(field)) {
				// Note: Transaction entity may not have this field
				logger.debug("Field '{}' not available in Transaction entity", field);
			}
			
			if (fieldValue != null && !fieldValue.trim().isEmpty()) {
				combinedText.append(" ").append(fieldValue);
			}
		}
		
		String descRaw = combinedText.toString().trim();
		if (descRaw.isEmpty())
			return 0;

		// Normalise description: keep letters/numbers, replace other chars with single
		// space
		String normalizedDesc = (" " + descRaw.toLowerCase().replaceAll("[^\\p{L}\\p{N}]+", " ").trim() + " ");

		List<SuspiciousKeyword> keywords = keywordRepository.findByIsActiveTrue();
		if (keywords == null || keywords.isEmpty()) {
			logger.debug("No active suspicious keywords configured.");
			return 0;
		}

		int matchCount = 0;
		int maxSeverity = 0;
		List<String> matched = new ArrayList<>();

		for (SuspiciousKeyword kw : keywords) {
			String w = Optional.ofNullable(kw.getWord()).orElse("").trim().toLowerCase();
			if (w.isEmpty())
				continue;

			String normalizedKw = (" " + w.replaceAll("[^\\p{L}\\p{N}]+", " ").trim() + " ");
			if (normalizedDesc.contains(normalizedKw)) {
				matchCount++;
				matched.add(kw.getWord());
				Integer sev = kw.getSeverity() == null ? 0 : kw.getSeverity();
				maxSeverity = Math.max(maxSeverity, sev);
			}
		}

		if (matchCount == 0) {
			logger.debug("Keyword check: no matches for transaction '{}'", descRaw);
			return 0;
		}

		// Raw severity → 0..100 mapping. (severity 1→10, 10→100)
		int raw = Math.min(100, Math.max(0, maxSeverity));

		// small boost for multiple matches
		if (matchCount == 2)
			raw = Math.min(100, raw + 5);
		else if (matchCount >= 3)
			raw = Math.min(100, raw + 10);

		// Scale the 0..100 raw keyword score to the rule's configured impact (so
		// weighting is consistent)
		int ruleImpact = (rule != null && rule.getRiskScoreImpact() > 0) ? rule.getRiskScoreImpact() : 10;
		int scaled = (int) Math.round((raw / 10.0) * ruleImpact);

		logger.warn("Keyword matches: {} | matchCount={} | maxSeverity={} | raw={} | scaled={}", matched, matchCount,
				maxSeverity, raw, scaled);

		return Math.max(0, Math.min(scaled, ruleImpact));
	}

	@Override
	public int getRiskScoreImpact(Rule rule) {
		// Return configured impact (default 100 if absent)
		return Optional.ofNullable(rule).map(Rule::getRiskScoreImpact).orElse(100);
	}
}
