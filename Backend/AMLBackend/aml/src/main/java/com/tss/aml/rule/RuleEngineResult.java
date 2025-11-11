package com.tss.aml.rule;

import java.util.List;

public class RuleEngineResult {
	private final boolean suspicious;
	private final int riskScore;
	private final List<String> triggeredRules;
	private final List<String> triggeredRuleTypes;
	private final List<String> triggeredRuleDescriptions;

	private RuleEngineResult(boolean suspicious, int riskScore, List<String> triggeredRules,
			List<String> triggeredRuleTypes, List<String> triggeredRuleDescriptions) {
		this.suspicious = suspicious;
		this.riskScore = riskScore;
		this.triggeredRules = triggeredRules;
		this.triggeredRuleTypes = triggeredRuleTypes;
		this.triggeredRuleDescriptions = triggeredRuleDescriptions;
	}

	public static RuleEngineResult suspicious(int riskScore, List<String> triggeredRules,
			List<String> triggeredRuleTypes, List<String> triggeredRuleDescriptions) {
		return new RuleEngineResult(true, riskScore, triggeredRules, triggeredRuleTypes, triggeredRuleDescriptions);
	}

	public static RuleEngineResult clean(int riskScore, List<String> triggeredRules, List<String> triggeredRuleTypes, List<String> triggeredRuleDescriptions) {
		return new RuleEngineResult(false, riskScore, triggeredRules, triggeredRuleTypes, triggeredRuleDescriptions);
	}

	public boolean isSuspicious() {
		return suspicious;
	}

	public int getRiskScore() {
		return riskScore;
	}

	public List<String> getTriggeredRules() {
		return triggeredRules;
	}

	public List<String> getTriggeredRuleTypes() {
		return triggeredRuleTypes;
	}

	public List<String> getTriggeredRuleDescriptions() {
		return triggeredRuleDescriptions;
	}
}
