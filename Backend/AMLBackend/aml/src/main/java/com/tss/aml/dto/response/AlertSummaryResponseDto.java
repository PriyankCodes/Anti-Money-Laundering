package com.tss.aml.dto.response;

import java.time.LocalDateTime;

import com.tss.aml.entity.Alert.InvestigationStatus;
import com.tss.aml.entity.enums.AlertStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AlertSummaryResponseDto {

	private Long alertId;
	private Long transactionId;
	private String customerName;
	private String ruleTriggered;
	private Integer riskScore;
	private AlertStatus status;
	private InvestigationStatus investigationStatus;
	private LocalDateTime createdAt;

}
