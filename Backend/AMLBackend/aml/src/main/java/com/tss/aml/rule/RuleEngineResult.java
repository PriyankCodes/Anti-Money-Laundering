package com.tss.aml.rule;

import java.util.List;

public class RuleEngineResult {
	private final boolean suspicious;
	private final int riskScore;
	private final List<String> triggeredRules;
	private final List<String> triggeredRuleTypes;

	private RuleEngineResult(boolean suspicious, int riskScore, List<String> triggeredRules,
			List<String> triggeredRuleTypes) {
		this.suspicious = suspicious;
		this.riskScore = riskScore;
		this.triggeredRules = triggeredRules;
		this.triggeredRuleTypes = triggeredRuleTypes;
	}

	public static RuleEngineResult suspicious(int riskScore, List<String> triggeredRules,
			List<String> triggeredRuleTypes) {
		return new RuleEngineResult(true, riskScore, triggeredRules, triggeredRuleTypes);
	}

	public static RuleEngineResult clean(int riskScore, List<String> triggeredRules, List<String> triggeredRuleTypes) {
		return new RuleEngineResult(false, riskScore, triggeredRules, triggeredRuleTypes);
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
}
