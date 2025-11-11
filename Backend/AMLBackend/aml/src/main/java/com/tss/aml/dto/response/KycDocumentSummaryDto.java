package com.tss.aml.dto.response;

import java.time.LocalDateTime;

import com.tss.aml.entity.enums.DocumentType;
import com.tss.aml.entity.enums.KycStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class KycDocumentSummaryDto {
    
    private Long id;
    private DocumentType documentType;
    private KycStatus status;
    private String fileName;
    private String fileUrl;
    private LocalDateTime uploadTimestamp;
}
