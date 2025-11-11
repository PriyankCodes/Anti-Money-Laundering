package com.tss.aml.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.tss.aml.entity.ComplianceOfficer;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.KycDocument;
import com.tss.aml.entity.enums.DocumentType;
import com.tss.aml.entity.enums.KycStatus;
import com.tss.aml.repository.ComplianceOfficerRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.KycDocumentRepository;
import com.tss.aml.service.FileStorageService;
import com.tss.aml.service.KycDocumentService;

@Service
@Transactional
public class KycDocumentServiceImpl implements KycDocumentService {

	@Autowired
	private KycDocumentRepository kycDocumentRepository;

	@Autowired
	private CustomerRepository customerRepository;

	@Autowired
	private ComplianceOfficerRepository complianceOfficerRepository;

	@Autowired
	private FileStorageService fileStorageService;

	public KycDocument uploadDocument(Long customerId, DocumentType docType, MultipartFile file) {
		Customer customer = customerRepository.findById(customerId)
				.orElseThrow(() -> new RuntimeException("Customer not found"));

		// Check if document type already exists and is verified
		Optional<KycDocument> existingDoc = kycDocumentRepository.findByCustomerUserIdAndDocTypeAndStatus(customerId,
				docType, KycStatus.VERIFIED);

		if (existingDoc.isPresent()) {
			throw new RuntimeException("Document type " + docType + " already verified for this customer");
		}

		// Store file
		String fileUrl = fileStorageService.storeFile(file);

		// Create KYC document
		KycDocument kycDocument = new KycDocument();
		kycDocument.setCustomer(customer);
		kycDocument.setDocType(docType);
		kycDocument.setFileName(file.getOriginalFilename());
		kycDocument.setFileUrl(fileUrl);
		kycDocument.setFileSize(file.getSize());
		kycDocument.setStatus(KycStatus.PENDING);

		// Perform initial document verification
		// documentVerificationService.performInitialVerification(kycDocument, file);

		return kycDocumentRepository.save(kycDocument);
	}

	public KycDocument verifyDocument(Long documentId, Long officerId, KycStatus status, String notes) {
		KycDocument document = kycDocumentRepository.findById(documentId)
				.orElseThrow(() -> new RuntimeException("Document not found"));

		// For admin verification, officer lookup is optional
		ComplianceOfficer officer = null;
		if (officerId != null) {
			officer = complianceOfficerRepository.findById(officerId).orElse(null);
		}

		document.setStatus(status);
		document.setVerificationNotes(notes);
		document.setVerifiedBy(officer); // Can be null for admin verification
		document.setVerificationTimestamp(LocalDateTime.now());
		document.setValidated(status == KycStatus.VERIFIED);

		return kycDocumentRepository.save(document);
	}

	public List<KycDocument> getCustomerDocuments(Long customerId) {
		return kycDocumentRepository.findByCustomerUserId(customerId);
	}

	public List<KycDocument> getDocumentsByStatus(KycStatus status) {
		return kycDocumentRepository.findByStatus(status);
	}

	public List<KycDocument> getPendingDocuments() {
		return kycDocumentRepository.findByStatus(KycStatus.PENDING);
	}
	
	public List<KycDocument> getAllDocuments() {
		return kycDocumentRepository.findAll();
	}

	public boolean isCustomerKycComplete(Long customerId) {
		long verifiedCount = kycDocumentRepository.countVerifiedDocumentsByCustomer(customerId);
		// Minimum required documents for complete KYC
		return verifiedCount >= 2; // At least 2 verified documents required
	}

	public void deleteDocument(Long documentId) {
		KycDocument document = kycDocumentRepository.findById(documentId)
				.orElseThrow(() -> new RuntimeException("Document not found"));

		// Delete file from storage
		fileStorageService.deleteFile(document.getFileUrl());

		// Delete database record
		kycDocumentRepository.delete(document);
	}

	public List<KycDocument> getDocumentsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
		return kycDocumentRepository.findByUploadDateRange(startDate, endDate);
	}

	public List<KycDocument> getDocumentsByOfficer(Long officerId) {
		return kycDocumentRepository.findByVerifiedBy(officerId);
	}

	@Override
	public KycDocument getDocumentById(Long documentId) {
		return kycDocumentRepository.findById(documentId)
				.orElseThrow(() -> new RuntimeException("Document not found with ID: " + documentId));
	}
}
