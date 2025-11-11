package com.tss.aml.service;

import java.util.List;

import com.tss.aml.entity.Rule;
import com.tss.aml.entity.enums.RuleType;

public interface RuleService {
    List<String> getTriggeredRulesForAlert(Long alertId);
    List<Rule> getRulesByType(RuleType ruleType);
}
