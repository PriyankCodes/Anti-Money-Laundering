package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.request.InvestigationActionRequest;
import com.tss.aml.dto.request.SarRequest;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Sar;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.AlertStatus;

public interface ComplianceOfficerService {
    // Alert Management
    List<Alert> getAllAlerts();
    Alert assignAlertToOfficer(Long alertId, Long officerId);
    Alert getAlertDetails(Long alertId);
    List<Transaction> getCustomerTransactions(Long customerId);

    // Investigation
    Alert takeActionOnAlert(Long alertId, Long officerId, InvestigationActionRequest request);

	// SAR
    Sar generateSar(Long alertId, Long officerId, SarRequest request);
    Sar submitSar(Long sarId);

    // New methods for enhanced compliance officer controller
    com.tss.aml.dto.response.OfficerProfileResponseDto getOfficerProfile(Long officerId);
    com.tss.aml.dto.response.OfficerProfileResponseDto updateOfficerProfile(Long officerId, com.tss.aml.dto.request.OfficerProfileUpdateRequest request);
    void sendProfileUpdateOtp(String email);
	void sendOfficerProfileUpdateOtp(String email);

	List<Alert> getAlertHistoryByOfficerId(Long officerId);
	List<Alert> getAlertHistoryByCustomerId(Long customerId);
	List<String> getTriggeredRulesForAlert(Long alertId);

	List<Alert> getAlertsByRiskScoreRange(Integer minRiskScore, Integer maxRiskScore);
	List<Sar> getAllSars();

	List<Alert> getAlertsByStatus(AlertStatus status);
	Sar getSarById(Long sarId);
}