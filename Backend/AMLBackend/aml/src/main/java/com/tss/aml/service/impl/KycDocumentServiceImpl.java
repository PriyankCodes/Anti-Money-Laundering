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
		Optional<KycDocument> existingVerifiedDoc = kycDocumentRepository.findByCustomerUserIdAndDocTypeAndStatus(customerId,
				docType, KycStatus.VERIFIED);

		if (existingVerifiedDoc.isPresent()) {
			throw new RuntimeException("Document type " + docType + " already verified for this customer");
		}

		// Allow re-upload for pending and rejected documents - delete existing ones
		List<KycDocument> existingDocs = kycDocumentRepository.findByCustomerUserIdAndDocType(customerId, docType);
		for (KycDocument existingDoc : existingDocs) {
			if (existingDoc.getStatus() == KycStatus.PENDING || existingDoc.getStatus() == KycStatus.REJECTED) {
				// Delete the old file from storage
				if (existingDoc.getFileUrl() != null) {
					fileStorageService.deleteFile(existingDoc.getFileUrl());
				}
				// Delete the database record
				kycDocumentRepository.delete(existingDoc);
			}
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

		KycDocument savedDocument = kycDocumentRepository.save(document);

		// Update customer KYC status if all required documents are verified
		updateCustomerKycStatus(document.getCustomer().getUserId());

		return savedDocument;
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
		// All 5 document types must be verified for complete KYC
		return verifiedCount >= 5; // All 5 documents required (PASSPORT, PAN, AADHAAR, DRIVING_LICENSE, VOTER_ID)
	}

	private void updateCustomerKycStatus(Long customerId) {
		Customer customer = customerRepository.findById(customerId)
				.orElseThrow(() -> new RuntimeException("Customer not found"));

		// Check if all 5 documents are verified
		if (isCustomerKycComplete(customerId)) {
			customer.setKycStatus(KycStatus.VERIFIED);
		} else {
			// Check if any document is rejected
			List<KycDocument> customerDocs = kycDocumentRepository.findByCustomerUserId(customerId);
			boolean hasRejected = customerDocs.stream()
					.anyMatch(doc -> doc.getStatus() == KycStatus.REJECTED);
			
			if (hasRejected) {
				customer.setKycStatus(KycStatus.REJECTED);
			} else {
				customer.setKycStatus(KycStatus.PENDING);
			}
		}

		customerRepository.save(customer);
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
