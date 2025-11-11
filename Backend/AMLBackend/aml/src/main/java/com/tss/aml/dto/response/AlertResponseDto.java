package com.tss.aml.dto.response;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Alert.InvestigationStatus;
import com.tss.aml.entity.Rule;
import com.tss.aml.entity.enums.AlertStatus;
import com.tss.aml.repository.RuleRepository;

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
	private String ruleDescription;  // First rule description (for backward compatibility)
	private String ruleType;         // First rule type (for backward compatibility)
	private List<String> ruleDescriptions;  // All rule descriptions
	private List<String> ruleTypes;         // All rule types
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
		this.ruleDescription = alert.getRuleDescription();
		this.ruleType = alert.getRuleType();
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
	
	// Constructor with RuleRepository to fetch rule details dynamically
	public AlertResponseDto(Alert alert, RuleRepository ruleRepository) {
		this(alert); // Call the basic constructor first
		
		// Initialize lists
		this.ruleDescriptions = new ArrayList<>();
		this.ruleTypes = new ArrayList<>();
		
		// Fetch details for ALL triggered rules
		if (alert.getRuleTriggered() != null && !alert.getRuleTriggered().trim().isEmpty()) {
			String[] ruleNames = alert.getRuleTriggered().split(",");
			
			for (String ruleName : ruleNames) {
				String trimmedRuleName = ruleName.trim();
				if (!trimmedRuleName.isEmpty()) {
					Rule rule = ruleRepository.findByName(trimmedRuleName);
					
					if (rule != null) {
						this.ruleDescriptions.add(rule.getDescription() != null ? rule.getDescription() : "No description available");
						this.ruleTypes.add(rule.getType().name());
					} else {
						this.ruleDescriptions.add("Rule not found in database");
						this.ruleTypes.add("UNKNOWN");
					}
				}
			}
			
			// Set first rule's details for backward compatibility
			if (!this.ruleDescriptions.isEmpty()) {
				if (this.ruleDescription == null) {
					this.ruleDescription = this.ruleDescriptions.get(0);
				}
				if (this.ruleType == null) {
					this.ruleType = this.ruleTypes.get(0);
				}
			}
		}
	}

}
