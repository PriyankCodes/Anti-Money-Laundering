package com.tss.aml.entity;

import java.time.LocalDateTime;

import com.tss.aml.entity.enums.AlertStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Alert {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long alertId;

	@NotNull
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "customer_id", nullable = false)
	private Customer customer;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "transaction_id")
	private Transaction transaction;

	@NotNull
	private String ruleTriggered;

	// Store rule type for reporting/grouping
	private String ruleType;

	// Store rule description for display
	private String ruleDescription;

	// Optional: Reference to the actual Rule entity
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "rule_id")
	private Rule rule;

	@NotNull
	private Integer riskScore;

	@Enumerated(EnumType.STRING)
	@NotNull
	private AlertStatus status = AlertStatus.OPEN;

	private LocalDateTime createdAt = LocalDateTime.now();
	private LocalDateTime updatedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assigned_to")
	private ComplianceOfficer assignedTo;

	@Enumerated(EnumType.STRING)
	private InvestigationStatus investigationStatus = InvestigationStatus.PENDING;

	public enum InvestigationStatus {
		PENDING, INVESTIGATING, TRUE_POSITIVE, FALSE_POSITIVE, ESCALATED
	}

	// Add getter/setter
	public InvestigationStatus getInvestigationStatus() {
		return investigationStatus;
	}

	public void setInvestigationStatus(InvestigationStatus investigationStatus) {
		this.investigationStatus = investigationStatus;
	}
}