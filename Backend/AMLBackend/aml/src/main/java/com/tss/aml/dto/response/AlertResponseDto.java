package com.tss.aml.dto.response;

import java.time.LocalDateTime;

import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Alert.InvestigationStatus;
import com.tss.aml.entity.enums.AlertStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertResponseDto {

	private Long alertId;
	private Long transactionId;
	private Long customerId;
	private String customerName;
	private String ruleTriggered;
	private Integer riskScore;
	private AlertStatus status;
	private InvestigationStatus investigationStatus;
	private String assignedToOfficer;
	private String assignedOfficerName;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	// Constructor from Alert entity
	public AlertResponseDto(Alert alert) {
		this.alertId = alert.getAlertId();
		this.transactionId = alert.getTransaction() != null ? alert.getTransaction().getTransactionId() : null;
		this.customerId = alert.getCustomer() != null ? alert.getCustomer().getUserId() : null;
		this.customerName = alert.getCustomer() != null
				? alert.getCustomer().getFirstName() + " " + alert.getCustomer().getLastName()
				: null;
		this.ruleTriggered = alert.getRuleTriggered();
		this.riskScore = alert.getRiskScore();
		this.status = alert.getStatus();
		this.investigationStatus = alert.getInvestigationStatus();
		this.assignedToOfficer = alert.getAssignedTo() != null ? alert.getAssignedTo().getEmail() : null;
		this.assignedOfficerName = alert.getAssignedTo() != null
				? alert.getAssignedTo().getFirstName() + " " + alert.getAssignedTo().getLastName()
				: null;
		this.createdAt = alert.getCreatedAt();
		this.updatedAt = alert.getUpdatedAt();
	}

}
