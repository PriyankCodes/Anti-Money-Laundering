package com.tss.aml.service.impl;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.dto.response.KycStatusSummaryDto;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.KycDocument;
import com.tss.aml.entity.enums.AlertStatus;
import com.tss.aml.entity.enums.DocumentType;
import com.tss.aml.entity.enums.KycStatus;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.KycDocumentRepository;
import com.tss.aml.service.KycComplianceReportService;

@Service
@Transactional
public class KycComplianceReportServiceImpl implements KycComplianceReportService {

	@Autowired
	private KycDocumentRepository kycDocumentRepository;

	@Autowired
	private CustomerRepository customerRepository;

	@Autowired
	private AlertRepository alertRepository;



	@Override
	public List<KycStatusSummaryDto> getAllCustomersKycStatus() {
		List<Customer> customers = customerRepository.findAll();

		return customers.stream().map(customer -> {
			List<KycDocument> documents = kycDocumentRepository.findByCustomerUserId(customer.getUserId());
			boolean isKycComplete = isCustomerKycComplete(customer.getUserId());

			KycStatusSummaryDto summary = new KycStatusSummaryDto();
			summary.setCustomerId(customer.getUserId());
			summary.setCustomerName(customer.getFirstName() + " " + customer.getLastName());
			summary.setKycComplete(isKycComplete);
			summary.setTotalDocuments(documents.size());
			summary.setVerifiedDocuments(
					(int) documents.stream().filter(d -> d.getStatus() == KycStatus.VERIFIED).count());
			summary.setPendingDocuments(
					(int) documents.stream().filter(d -> d.getStatus() == KycStatus.PENDING).count());
			summary.setRejectedDocuments(
					(int) documents.stream().filter(d -> d.getStatus() == KycStatus.REJECTED).count());
			
			summary.setOverallKycStatus(determineOverallKycStatus(documents, isKycComplete));

			return summary;
		}).collect(Collectors.toList());
	}

	
	@Override
	public KycComplianceDashboard getComplianceDashboard() {
		List<KycDocument> allDocuments = kycDocumentRepository.findAll();
		List<Customer> allCustomers = customerRepository.findAll();

		KycComplianceDashboard dashboard = new KycComplianceDashboard();

		// Overall statistics
		dashboard.setTotalCustomers(allCustomers.size());
		dashboard.setTotalDocuments(allDocuments.size());

		// KYC completion statistics
		long completeKycCustomers = allCustomers.stream()
				.filter(customer -> isCustomerKycComplete(customer.getUserId())).count();
		dashboard.setCompleteKycCustomers((int) completeKycCustomers);
		dashboard.setIncompleteKycCustomers((int) (allCustomers.size() - completeKycCustomers));

		// Document status breakdown
		Map<KycStatus, Long> statusCounts = allDocuments.stream()
				.collect(Collectors.groupingBy(KycDocument::getStatus, Collectors.counting()));

		dashboard.setPendingDocuments(statusCounts.getOrDefault(KycStatus.PENDING, 0L).intValue());
		dashboard.setVerifiedDocuments(statusCounts.getOrDefault(KycStatus.VERIFIED, 0L).intValue());
		dashboard.setRejectedDocuments(statusCounts.getOrDefault(KycStatus.REJECTED, 0L).intValue());


		// KYC-related alerts
		List<Alert> kycAlerts = alertRepository.findAll().stream()
				.filter(alert -> alert.getRuleTriggered() != null && alert.getRuleTriggered().contains("KYC"))
				.collect(Collectors.toList());

		dashboard.setKycRelatedAlerts(kycAlerts.size());
		dashboard.setOpenKycAlerts(
				(int) kycAlerts.stream().filter(alert -> alert.getStatus() == AlertStatus.OPEN).count());

		// Document type distribution
		Map<DocumentType, Long> docTypeCounts = allDocuments.stream()
				.collect(Collectors.groupingBy(KycDocument::getDocType, Collectors.counting()));
		dashboard.setDocumentTypeDistribution(docTypeCounts);

		// Compliance score calculation
		double complianceScore = calculateOverallComplianceScore(dashboard);
		dashboard.setOverallComplianceScore(complianceScore);

		return dashboard;
	}

	

	private boolean isCustomerKycComplete(Long customerId) {
		List<KycDocument> documents = kycDocumentRepository.findByCustomerUserId(customerId);

		long verifiedCount = documents.stream().filter(doc -> doc.getStatus() == KycStatus.VERIFIED).count();

		// Check if customer has required document types
		List<DocumentType> verifiedTypes = documents.stream().filter(doc -> doc.getStatus() == KycStatus.VERIFIED)
				.map(KycDocument::getDocType).distinct().collect(Collectors.toList());

		// Minimum requirements: At least 2 verified documents including PAN and one ID
		// proof
		boolean hasPan = verifiedTypes.contains(DocumentType.PAN);
		boolean hasIdProof = verifiedTypes.stream()
				.anyMatch(type -> type == DocumentType.AADHAAR || type == DocumentType.PASSPORT
						|| type == DocumentType.DRIVING_LICENSE || type == DocumentType.VOTER_ID);

		return verifiedCount >= 2 && hasPan && hasIdProof;
	}

	private String determineOverallKycStatus(List<KycDocument> documents, boolean isComplete) {
		if (isComplete) {
			return "COMPLETE";
		}

		boolean hasRejected = documents.stream().anyMatch(d -> d.getStatus() == KycStatus.REJECTED);
		boolean hasPending = documents.stream().anyMatch(d -> d.getStatus() == KycStatus.PENDING);

		if (hasRejected) {
			return "REJECTED";
		} else if (hasPending) {
			return "PENDING";
		} else {
			return "INCOMPLETE";
		}
	}

	private double calculateOverallComplianceScore(KycComplianceDashboard dashboard) {
		if (dashboard.getTotalCustomers() == 0) {
			return 0.0;
		}

		double score = 0.0;

		// Base score from KYC completion rate
		double completionRate = (double) dashboard.getCompleteKycCustomers() / dashboard.getTotalCustomers();
		score += completionRate * 60; // 60% weight for completion

		// Penalty for high-risk documents
		if (dashboard.getTotalDocuments() > 0) {
			double highRiskRate = (double) dashboard.getHighRiskDocuments() / dashboard.getTotalDocuments();
			score -= highRiskRate * 20; // Penalty for high-risk documents
		}

		// Penalty for rejected documents
		if (dashboard.getTotalDocuments() > 0) {
			double rejectedRate = (double) dashboard.getRejectedDocuments() / dashboard.getTotalDocuments();
			score -= rejectedRate * 15; // Penalty for rejected documents
		}

		// Bonus for low pending documents
		if (dashboard.getTotalDocuments() > 0) {
			double pendingRate = (double) dashboard.getPendingDocuments() / dashboard.getTotalDocuments();
			if (pendingRate < 0.1) { // Less than 10% pending
				score += 10;
			}
		}

		// Penalty for documents requiring manual review
		if (dashboard.getTotalDocuments() > 0) {
			double manualReviewRate = (double) dashboard.getDocumentsRequiringManualReview()
					/ dashboard.getTotalDocuments();
			score -= manualReviewRate * 10;
		}

		return Math.max(0.0, Math.min(100.0, score));
	}


}
