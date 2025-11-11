package com.tss.aml.dto.request;

import com.tss.aml.entity.enums.KycStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KycDocumentVerificationRequest {
    
    @NotNull(message = "Document ID is required")
    private Long documentId;
    
    // Officer ID is optional since admin verification uses static ID
    private Long officerId;
    
    @NotNull(message = "Status is required")
    private KycStatus status;
    
    @Size(max = 1000, message = "Verification notes cannot exceed 1000 characters")
    private String verificationNotes;
}
