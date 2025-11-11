package com.tss.aml.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Rule;
import com.tss.aml.entity.enums.RuleType;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.RuleRepository;
import com.tss.aml.service.RuleService;

@Service
@Transactional
public class RuleServiceImpl implements RuleService {

    @Autowired
    private RuleRepository ruleRepository;
    
    @Autowired
    private AlertRepository alertRepository;

    @Override
    public List<String> getTriggeredRulesForAlert(Long alertId) {
        Alert alert = alertRepository.findById(alertId)
            .orElseThrow(() -> new RuntimeException("Alert not found"));
        
        // Parse the rule triggered field which might contain multiple rules
        String ruleTriggered = alert.getRuleTriggered();
        if (ruleTriggered != null && !ruleTriggered.isEmpty()) {
            // Split by comma or semicolon if multiple rules
            return List.of(ruleTriggered.split("[,;]"));
        }
        return List.of();
    }

    @Override
    public List<Rule> getRulesByType(RuleType ruleType) {
        return ruleRepository.findByTypeAndIsActiveTrue(ruleType);
    }
}
