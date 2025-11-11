package com.tss.aml.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvestigationActionRequest {
    private String action; // "APPROVE", "REJECT", "ESCALATE", "INVESTIGATE" (user-friendly)
    private String decision; // "TRUE_POSITIVE", "FALSE_POSITIVE", "ESCALATED", "INVESTIGATING" (internal)
    private String notes;
    private String riskAssessment; // "LOW", "MEDIUM", "HIGH"
    private String sarSummary; // Optional SAR summary for TRUE_POSITIVE cases
}