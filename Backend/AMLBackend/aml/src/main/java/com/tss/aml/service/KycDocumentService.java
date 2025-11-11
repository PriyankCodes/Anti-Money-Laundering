package com.tss.aml.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.tss.aml.entity.KycDocument;
import com.tss.aml.entity.enums.DocumentType;
import com.tss.aml.entity.enums.KycStatus;

public interface KycDocumentService {
    
    KycDocument uploadDocument(Long customerId, DocumentType docType, MultipartFile file);
    
    KycDocument verifyDocument(Long documentId, Long officerId, KycStatus status, String notes);
    
    List<KycDocument> getCustomerDocuments(Long customerId);
    
    List<KycDocument> getDocumentsByStatus(KycStatus status);
    
    List<KycDocument> getPendingDocuments();
    List<KycDocument> getAllDocuments();

    
    boolean isCustomerKycComplete(Long customerId);
    
    void deleteDocument(Long documentId);
    
    List<KycDocument> getDocumentsByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    List<KycDocument> getDocumentsByOfficer(Long officerId);
    
    KycDocument getDocumentById(Long documentId);
    }
