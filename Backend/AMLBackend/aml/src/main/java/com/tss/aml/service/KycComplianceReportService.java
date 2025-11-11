package com.tss.aml.service;

import java.util.List;
import java.util.Map;

import com.tss.aml.dto.response.KycStatusSummaryDto;
import com.tss.aml.entity.enums.DocumentType;

public interface KycComplianceReportService {

	List<KycStatusSummaryDto> getAllCustomersKycStatus();

	KycComplianceDashboard getComplianceDashboard();


	// Inner class for dashboard data
	public static class KycComplianceDashboard {
		private int totalCustomers;
		private int completeKycCustomers;
		private int incompleteKycCustomers;
		private int totalDocuments;
		private int pendingDocuments;
		private int verifiedDocuments;
		private int rejectedDocuments;
		private int expiredDocuments;
		private int highRiskDocuments;
		private int documentsRequiringManualReview;
		private int expiringDocuments;
		private int kycRelatedAlerts;
		private int openKycAlerts;
		private Map<DocumentType, Long> documentTypeDistribution;
		private double overallComplianceScore;

		// Getters and setters
		public int getTotalCustomers() {
			return totalCustomers;
		}

		public void setTotalCustomers(int totalCustomers) {
			this.totalCustomers = totalCustomers;
		}

		public int getCompleteKycCustomers() {
			return completeKycCustomers;
		}

		public void setCompleteKycCustomers(int completeKycCustomers) {
			this.completeKycCustomers = completeKycCustomers;
		}

		public int getIncompleteKycCustomers() {
			return incompleteKycCustomers;
		}

		public void setIncompleteKycCustomers(int incompleteKycCustomers) {
			this.incompleteKycCustomers = incompleteKycCustomers;
		}

		public int getTotalDocuments() {
			return totalDocuments;
		}

		public void setTotalDocuments(int totalDocuments) {
			this.totalDocuments = totalDocuments;
		}

		public int getPendingDocuments() {
			return pendingDocuments;
		}

		public void setPendingDocuments(int pendingDocuments) {
			this.pendingDocuments = pendingDocuments;
		}

		public int getVerifiedDocuments() {
			return verifiedDocuments;
		}

		public void setVerifiedDocuments(int verifiedDocuments) {
			this.verifiedDocuments = verifiedDocuments;
		}

		public int getRejectedDocuments() {
			return rejectedDocuments;
		}

		public void setRejectedDocuments(int rejectedDocuments) {
			this.rejectedDocuments = rejectedDocuments;
		}

		public int getExpiredDocuments() {
			return expiredDocuments;
		}

		public void setExpiredDocuments(int expiredDocuments) {
			this.expiredDocuments = expiredDocuments;
		}

		public int getHighRiskDocuments() {
			return highRiskDocuments;
		}

		public void setHighRiskDocuments(int highRiskDocuments) {
			this.highRiskDocuments = highRiskDocuments;
		}

		public int getDocumentsRequiringManualReview() {
			return documentsRequiringManualReview;
		}

		public void setDocumentsRequiringManualReview(int documentsRequiringManualReview) {
			this.documentsRequiringManualReview = documentsRequiringManualReview;
		}

		public int getExpiringDocuments() {
			return expiringDocuments;
		}

		public void setExpiringDocuments(int expiringDocuments) {
			this.expiringDocuments = expiringDocuments;
		}

		public int getKycRelatedAlerts() {
			return kycRelatedAlerts;
		}

		public void setKycRelatedAlerts(int kycRelatedAlerts) {
			this.kycRelatedAlerts = kycRelatedAlerts;
		}

		public int getOpenKycAlerts() {
			return openKycAlerts;
		}

		public void setOpenKycAlerts(int openKycAlerts) {
			this.openKycAlerts = openKycAlerts;
		}

		public Map<DocumentType, Long> getDocumentTypeDistribution() {
			return documentTypeDistribution;
		}

		public void setDocumentTypeDistribution(Map<DocumentType, Long> documentTypeDistribution) {
			this.documentTypeDistribution = documentTypeDistribution;
		}

		public double getOverallComplianceScore() {
			return overallComplianceScore;
		}

		public void setOverallComplianceScore(double overallComplianceScore) {
			this.overallComplianceScore = overallComplianceScore;
		}
	}
}
