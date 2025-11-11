package com.tss.aml.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.AlertStatus;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.rule.RuleEngineResult;
import com.tss.aml.service.AlertService;

@Service
@Transactional
public class AlertServiceImpl implements AlertService {

    @Autowired
    private AlertRepository alertRepository;

    @Override
    public Alert createAlertForTransaction(Transaction transaction, RuleEngineResult result) {
        Alert alert = new Alert();
        alert.setCustomer(transaction.getCustomer());
        alert.setTransaction(transaction);
        alert.setRuleTriggered(String.join(", ", result.getTriggeredRules()));
        // Store the first (highest priority) rule type for reporting
        if (!result.getTriggeredRuleTypes().isEmpty()) {
            alert.setRuleType(result.getTriggeredRuleTypes().get(0));
        }
        // Store the first rule description
        if (!result.getTriggeredRuleDescriptions().isEmpty()) {
            alert.setRuleDescription(result.getTriggeredRuleDescriptions().get(0));
        }
        alert.setRiskScore(result.getRiskScore());
        alert.setStatus(AlertStatus.OPEN); // Awaiting investigation
        // assignedTo remains null until assigned by system or admin

        return alertRepository.save(alert);
    }

    @Override
    public Alert createAlert(Transaction transaction, List<String> triggeredRules, int riskScore) {
        Alert alert = new Alert();
        alert.setCustomer(transaction.getCustomer());
        alert.setTransaction(transaction);
        alert.setRuleTriggered(String.join(", ", triggeredRules));
        alert.setRiskScore(riskScore);
        alert.setStatus(AlertStatus.OPEN); // Awaiting investigation
        // assignedTo remains null until assigned by system or admin

        return alertRepository.save(alert);
    }

    /**
     * Update alert status - Note: Balance processing is handled in ComplianceOfficerService
     */
    public Alert updateAlertStatus(Long alertId, AlertStatus status) {
        Alert alert = alertRepository.findById(alertId)
            .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));
        
        alert.setStatus(status);
        alert.setUpdatedAt(java.time.LocalDateTime.now());
        
        return alertRepository.save(alert);
    }
    
    /**
     * Update alert investigation status - Note: Balance processing is handled in ComplianceOfficerService
     */
    public Alert updateAlertInvestigationStatus(Long alertId, Alert.InvestigationStatus investigationStatus) {
        Alert alert = alertRepository.findById(alertId)
            .orElseThrow(() -> new RuntimeException("Alert not found: " + alertId));
        
        alert.setInvestigationStatus(investigationStatus);
        alert.setUpdatedAt(java.time.LocalDateTime.now());
        
        return alertRepository.save(alert);
    }

    // New methods for enhanced alert queries
    @Override
    public List<Alert> getAlertsByCustomerId(Long customerId) {
        return alertRepository.findByCustomerUserIdOrderByCreatedAtDesc(customerId);
    }

    @Override
    public List<Alert> getAlertsByStatus(AlertStatus status) {
        return alertRepository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Override
    public List<Alert> getAlertsByRiskScoreRange(Integer minRiskScore, Integer maxRiskScore) {
        return alertRepository.findByRiskScoreBetweenOrderByRiskScoreDesc(minRiskScore, maxRiskScore);
    }

    @Override
    public List<Alert> getAlertHistoryByCustomerId(Long customerId) {
        return alertRepository.findByCustomerUserIdOrderByCreatedAtDesc(customerId);
    }

    @Override
    public List<Alert> getAlertHistoryByOfficerId(Long officerId) {
        return alertRepository.findByAssignedToUserIdOrderByCreatedAtDesc(officerId);
    }

	@Override
	public Alert getAlertById(Long alertId) {
		return alertRepository.findById(alertId).orElse(null);
	}
}