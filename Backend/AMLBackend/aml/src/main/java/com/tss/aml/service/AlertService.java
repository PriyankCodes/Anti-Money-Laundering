package com.tss.aml.service;

import java.util.List;

import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.AlertStatus;
import com.tss.aml.rule.RuleEngineResult;

public interface AlertService {
    Alert createAlertForTransaction(Transaction transaction, RuleEngineResult result);
    Alert createAlert(Transaction transaction, List<String> triggeredRules, int riskScore);
    
    // New methods for enhanced controllers
    List<Alert> getAlertsByCustomerId(Long customerId);
    List<Alert> getAlertsByStatus(AlertStatus status);
    List<Alert> getAlertsByRiskScoreRange(Integer minRiskScore, Integer maxRiskScore);
    Alert getAlertById(Long alertId);
    List<Alert> getAlertHistoryByCustomerId(Long customerId);
    List<Alert> getAlertHistoryByOfficerId(Long officerId);
}