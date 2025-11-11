package com.tss.aml.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KycStatusSummaryDto {
    
    private Long customerId;
    private String customerName;
    private boolean isKycComplete;
    private int totalDocuments;
    private int verifiedDocuments;
    private int pendingDocuments;
    private int rejectedDocuments;
    private int highRiskDocuments;
    private String overallKycStatus;
}
