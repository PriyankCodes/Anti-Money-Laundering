package com.tss.aml.service;

import java.util.List;
import java.util.Map;

import com.tss.aml.dto.request.AccountUpdateRequest;
import com.tss.aml.dto.request.ComplianceOfficerRequest;
import com.tss.aml.dto.request.CustomerProfileUpdateRequest;
import com.tss.aml.dto.request.KeywordRequest;
import com.tss.aml.dto.request.RiskyCountryRequest;
import com.tss.aml.dto.request.RuleRequest;
import com.tss.aml.dto.response.AdminNotificationDto;
import com.tss.aml.entity.Account;
import com.tss.aml.entity.ComplianceOfficer;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.KycDocument;
import com.tss.aml.entity.RiskyCountry;
import com.tss.aml.entity.Rule;
import com.tss.aml.entity.SuspiciousKeyword;

public interface AdminService {
	// Compliance Officers
	ComplianceOfficer createComplianceOfficer(ComplianceOfficerRequest request);

	List<ComplianceOfficer> getAllComplianceOfficers();

	void deleteComplianceOfficer(Long id);

	// Rules
	Rule createRule(RuleRequest request);

	Rule updateRule(Long id, RuleRequest request);

	void deleteRule(Long id);

	List<Rule> getAllRules();

	// Keywords
	SuspiciousKeyword createKeyword(KeywordRequest request);

	SuspiciousKeyword updateKeyword(Long id, KeywordRequest request);

	void deleteKeyword(Long id);

	List<SuspiciousKeyword> getAllKeywords();

	// Risky Countries
	RiskyCountry createRiskyCountry(RiskyCountryRequest request);

	RiskyCountry updateRiskyCountry(String countryCode, RiskyCountryRequest request);

	void deleteRiskyCountry(String countryCode);

	List<RiskyCountry> getAllRiskyCountries();

	// Customer Management
	List<Customer> getAllCustomers();

	Customer getCustomerById(Long id);

	Customer updateCustomer(Long id, CustomerProfileUpdateRequest request);

	void deleteCustomer(Long id);

	// Account Management
	List<Account> getAllAccounts();

	List<Account> getAccountsByCustomerId(Long customerId);

	Account updateAccount(Long accountId, AccountUpdateRequest request);

	void freezeAccount(Long accountId);

	void unfreezeAccount(Long accountId);

	// KYC Document Verification Management
	List<KycDocument> getPendingDocuments();

	List<KycDocument> getDocumentsRequiringManualReview();

	KycDocument verifyDocument(Long documentId, Long officerId, String notes, boolean approved);

	KycDocument rejectDocument(Long documentId, Long officerId, String rejectionReason);

	// New methods for enhanced admin controller
	com.tss.aml.dto.response.DashboardStatsDto getDashboardStats();

	Long getAlertCountByCustomerId(Long customerId);

	void updateAdminProfile(String firstName, String lastName);

	Map<String, Object> getSystemHealthStatus();

	List<com.tss.aml.entity.AuditLog> getAllAuditLogs(int page, int size);

	void updateCustomerAccountStatus(Long customerId, com.tss.aml.entity.enums.AccountStatus status, String reason);

	List<com.tss.aml.entity.Rule> getRulesByType(com.tss.aml.entity.enums.RuleType ruleType);

	// Officer status management
	void updateOfficerStatus(Long officerId, com.tss.aml.entity.enums.UserStatus status);

	// Customer status management
	void updateCustomerStatus(Long customerId, com.tss.aml.entity.enums.UserStatus status);

	List<AdminNotificationDto> getAdminNotifications(int limit);
	
	// Account deactivation (also blocks all transactions)
	void deactivateAccount(Long accountId, String reason);
	
	void activateAccount(Long accountId);
}