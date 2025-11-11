package com.tss.aml.dto.response;

import java.time.LocalDateTime;

import com.tss.aml.entity.Sar;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SarResponseDto {

	private Long sarId;
	private Long alertId;
	private String alertRuleTriggered;
	private Integer alertRiskScore;
	private Long officerId;
	private String officerName;
	private String officerEmail;
	private String summary;
	private String regulatorReference;
	private Sar.SarStatus status;
	private LocalDateTime submittedAt;
	private LocalDateTime createdAt;
	
	  public SarResponseDto(Sar sar) {
	        this.sarId = sar.getSarId();
	        this.alertId = sar.getAlert() != null ? sar.getAlert().getAlertId() : null;
	        this.alertRuleTriggered = sar.getAlert() != null ? sar.getAlert().getRuleTriggered() : null;
	        this.alertRiskScore = sar.getAlert() != null ? sar.getAlert().getRiskScore() : null;
	        this.officerId = sar.getOfficer() != null ? sar.getOfficer().getUserId() : null;
	        this.officerName = sar.getOfficer() != null ? 
	            sar.getOfficer().getFirstName() + " " + sar.getOfficer().getLastName() : null;
	        this.officerEmail = sar.getOfficer() != null ? sar.getOfficer().getEmail() : null;
	        this.summary = sar.getSummary();
	        this.regulatorReference = sar.getRegulatorReference();
	        this.status = sar.getStatus();
	        this.submittedAt = sar.getSubmittedAt();
	        this.createdAt = sar.getCreatedAt();
	    }
}
