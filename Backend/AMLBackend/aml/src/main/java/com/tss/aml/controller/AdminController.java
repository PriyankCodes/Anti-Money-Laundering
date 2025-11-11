package com.tss.aml.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.request.AccountStatusUpdateRequest;
import com.tss.aml.dto.request.ComplianceOfficerRequest;
import com.tss.aml.dto.request.KeywordRequest;
import com.tss.aml.dto.request.RiskyCountryRequest;
import com.tss.aml.dto.request.RuleRequest;
import com.tss.aml.dto.response.KycDocumentResponseDto;
import com.tss.aml.dto.response.TransactionResponseDto;
import com.tss.aml.dto.response.TransactionTrendDTO;
import com.tss.aml.entity.AuditLog;
import com.tss.aml.entity.ComplianceOfficer;
import com.tss.aml.entity.KycDocument;
import com.tss.aml.entity.RiskyCountry;
import com.tss.aml.entity.Rule;
import com.tss.aml.entity.SuspiciousKeyword;
import com.tss.aml.entity.enums.RuleType;
import com.tss.aml.service.AdminService;
import com.tss.aml.service.TransactionService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")

public class AdminController {

	@Autowired
	private AdminService adminService;

	@Autowired
	private TransactionService transactionService;

	// === TRANSACTIONS ===
	@GetMapping("/transactions/all")
	public ResponseEntity<List<TransactionResponseDto>> getAllTransactions() {
		List<TransactionResponseDto> transactions = transactionService.getAllTransactions().stream()
				.map(TransactionResponseDto::new).collect(Collectors.toList());
		return ResponseEntity.ok(transactions);
	}

	// === COMPLIANCE OFFICERS ===
	@PostMapping("/officers")
	public ResponseEntity<ComplianceOfficer> createOfficer(@RequestBody ComplianceOfficerRequest request) {
		return ResponseEntity.ok(adminService.createComplianceOfficer(request));
	}

	@GetMapping("/officers")
	public ResponseEntity<List<ComplianceOfficer>> getAllOfficers() {
		return ResponseEntity.ok(adminService.getAllComplianceOfficers());
	}

	@DeleteMapping("/officers/{id}")
	public ResponseEntity<Void> deleteOfficer(@PathVariable Long id) {
		adminService.deleteComplianceOfficer(id);
		return ResponseEntity.noContent().build();
	}

	// === RULES ===
	@PostMapping("/rules")
	public ResponseEntity<Rule> createRule(@RequestBody RuleRequest request) {
		return ResponseEntity.ok(adminService.createRule(request));
	}

	@PutMapping("/rules/{id}")
	public ResponseEntity<Rule> updateRule(@PathVariable Long id, @RequestBody RuleRequest request) {
		return ResponseEntity.ok(adminService.updateRule(id, request));
	}

	@DeleteMapping("/rules/{id}")
	public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
		adminService.deleteRule(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/rules")
	public ResponseEntity<List<Rule>> getAllRules() {
		return ResponseEntity.ok(adminService.getAllRules());
	}

	// === KEYWORDS ===
	@PostMapping("/keywords")
	public ResponseEntity<SuspiciousKeyword> createKeyword(@RequestBody KeywordRequest request) {
		return ResponseEntity.ok(adminService.createKeyword(request));
	}

	@PutMapping("/keywords/{id}")
	public ResponseEntity<SuspiciousKeyword> updateKeyword(@PathVariable Long id, @RequestBody KeywordRequest request) {
		return ResponseEntity.ok(adminService.updateKeyword(id, request));
	}

	@DeleteMapping("/keywords/{id}")
	public ResponseEntity<Void> deleteKeyword(@PathVariable Long id) {
		adminService.deleteKeyword(id);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/keywords")
	public ResponseEntity<List<SuspiciousKeyword>> getAllKeywords() {
		return ResponseEntity.ok(adminService.getAllKeywords());
	}

	// === RISKY COUNTRIES ===
	@PostMapping("/countries")
	public ResponseEntity<RiskyCountry> createCountry(@RequestBody RiskyCountryRequest request) {
		return ResponseEntity.ok(adminService.createRiskyCountry(request));
	}

	@PutMapping("/countries/{code}")
	public ResponseEntity<RiskyCountry> updateCountry(@PathVariable String code,
			@RequestBody RiskyCountryRequest request) {
		return ResponseEntity.ok(adminService.updateRiskyCountry(code, request));
	}

	@DeleteMapping("/countries/{code}")
	public ResponseEntity<Void> deleteCountry(@PathVariable String code) {
		adminService.deleteRiskyCountry(code);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/countries")
	public ResponseEntity<List<RiskyCountry>> getAllCountries() {
		return ResponseEntity.ok(adminService.getAllRiskyCountries());
	}

	// === KYC MANAGEMENT ===
	@GetMapping("/kyc/pending")
	public ResponseEntity<List<KycDocumentResponseDto>> getPendingKycDocuments() {
		List<KycDocument> documents = adminService.getPendingDocuments();
		List<KycDocumentResponseDto> response = documents.stream().map(this::convertToKycDocumentResponseDto)
				.collect(Collectors.toList());
		return ResponseEntity.ok(response);
	}

	@GetMapping("/alerts/count/customer/{customerId}")
	public ResponseEntity<Long> getAlertCountByCustomer(@PathVariable Long customerId) {
		return ResponseEntity.ok(adminService.getAlertCountByCustomerId(customerId));
	}

	// === AUDIT LOGS ===
	@GetMapping("/audit-logs")
	public ResponseEntity<List<AuditLog>> getAllAuditLogs(@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "50") int size) {
		return ResponseEntity.ok(adminService.getAllAuditLogs(page, size));
	}

	// === CUSTOMER MANAGEMENT ===
	@PutMapping("/customers/{customerId}/account-status")
	public ResponseEntity<String> updateCustomerAccountStatus(@PathVariable Long customerId,
			@RequestBody AccountStatusUpdateRequest request) {
		adminService.updateCustomerAccountStatus(customerId, request.getStatus(), request.getReason());
		return ResponseEntity.ok("Account status updated successfully");
	}

	// === RULES BY TYPE ===
	@GetMapping("/rules/type/{ruleType}")
	public ResponseEntity<List<Rule>> getRulesByType(@PathVariable RuleType ruleType) {
		return ResponseEntity.ok(adminService.getRulesByType(ruleType));
	}

	/**
	 * Helper method to convert KycDocument Entity to KycDocumentResponseDto
	 */
	private KycDocumentResponseDto convertToKycDocumentResponseDto(KycDocument document) {
		KycDocumentResponseDto dto = new KycDocumentResponseDto();

		dto.setId(document.getId());
		dto.setDocumentType(document.getDocType());
		dto.setStatus(document.getStatus());
		dto.setFileName(document.getFileName());
		dto.setFileUrl(document.getFileUrl());
		dto.setFileSize(document.getFileSize());
		dto.setVerificationNotes(document.getVerificationNotes());
		dto.setUploadTimestamp(document.getUploadTimestamp());
		dto.setVerificationTimestamp(document.getVerificationTimestamp());
		dto.setValidated(document.isValidated());

		if (document.getVerifiedBy() != null) {
			dto.setVerifiedByName(
					document.getVerifiedBy().getFirstName() + " " + document.getVerifiedBy().getLastName());
		} else {
			dto.setVerifiedByName("System");
		}

		if (document.getCustomer() != null) {
			dto.setCustomerId(document.getCustomer().getUserId());
			dto.setCustomerName(document.getCustomer().getFirstName() + " " + document.getCustomer().getLastName());
			dto.setFirstName(document.getCustomer().getFirstName());
			dto.setMiddleName(document.getCustomer().getMiddleName());
			dto.setLastName(document.getCustomer().getLastName());
			dto.setEmail(document.getCustomer().getEmail());
			dto.setContactNumber(document.getCustomer().getContactNumber());
			dto.setDateOfBirth(document.getCustomer().getDateOfBirth());
			dto.setNationality(document.getCustomer().getNationality());
			dto.setStreet(document.getCustomer().getStreet());
			dto.setCity(document.getCustomer().getCity());
			dto.setState(document.getCustomer().getState());
			dto.setCountry(document.getCustomer().getCountry());
			dto.setPincode(document.getCustomer().getPincode());
			dto.setCustomerKycStatus(document.getCustomer().getKycStatus());
			dto.setCustomerStatus(document.getCustomer().getStatus());
			dto.setCustomerCreatedAt(document.getCustomer().getCreatedAt());
			dto.setCustomerLastLogin(document.getCustomer().getLastLogin());
			dto.setEmailVerified(document.getCustomer().isEmailVerified());
		}

		return dto;
	}

	// === USER MANAGEMENT ===
	@GetMapping("/customers")
	public ResponseEntity<List<com.tss.aml.entity.Customer>> getAllCustomers() {
		return ResponseEntity.ok(adminService.getAllCustomers());
	}

	@PutMapping("/customers/{customerId}/status")
	public ResponseEntity<String> updateCustomerStatus(@PathVariable Long customerId,
			@RequestBody Map<String, Object> request) {
		String status = (String) request.get("status");

		// Convert status to UserStatus enum
		com.tss.aml.entity.enums.UserStatus userStatus;
		try {
			userStatus = com.tss.aml.entity.enums.UserStatus.valueOf(status.toUpperCase());
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body("Invalid status: " + status);
		}

		adminService.updateCustomerStatus(customerId, userStatus);
		return ResponseEntity.ok("Customer status updated successfully");
	}

	// === OFFICER STATUS MANAGEMENT ===
	@PutMapping("/officers/{officerId}/status")
	public ResponseEntity<String> updateOfficerStatus(@PathVariable Long officerId,
			@RequestBody Map<String, Object> statusRequest) {

		com.tss.aml.entity.enums.UserStatus userStatus;

		// Handle different request formats for officer status updates
		if (statusRequest.containsKey("status")) {
			String status = (String) statusRequest.get("status");
			try {
				userStatus = com.tss.aml.entity.enums.UserStatus.valueOf(status.toUpperCase());
			} catch (IllegalArgumentException e) {
				return ResponseEntity.badRequest().body("Invalid status: " + status);
			}
		} else if (statusRequest.containsKey("isActive")) {
			Boolean isActive = (Boolean) statusRequest.get("isActive");
			userStatus = isActive ? com.tss.aml.entity.enums.UserStatus.ACTIVE
					: com.tss.aml.entity.enums.UserStatus.INACTIVE;
		} else if (statusRequest.containsKey("active")) {
			Boolean active = (Boolean) statusRequest.get("active");
			userStatus = active ? com.tss.aml.entity.enums.UserStatus.ACTIVE
					: com.tss.aml.entity.enums.UserStatus.INACTIVE;
		} else {
			return ResponseEntity.badRequest().body("Missing status field in request");
		}

		adminService.updateOfficerStatus(officerId, userStatus);
		return ResponseEntity.ok("Officer status updated successfully");
	}

	// PATCH endpoint for officer status
	@PatchMapping("/officers/{officerId}/status")
	public ResponseEntity<String> patchOfficerStatus(@PathVariable Long officerId,
			@RequestBody Map<String, Object> statusRequest) {
		return updateOfficerStatus(officerId, statusRequest);
	}

	// PATCH endpoint for customer status
	@PatchMapping("/customers/{customerId}/status")
	public ResponseEntity<String> patchCustomerStatus(@PathVariable Long customerId,
			@RequestBody Map<String, Object> request) {
		return updateCustomerStatus(customerId, request);
	}

	@GetMapping("/dashboard/transaction-trends")
	public ResponseEntity<List<TransactionTrendDTO>> getTransactionTrends() {
		LocalDateTime sixMonthsAgo = LocalDateTime.now().minusMonths(6);
		List<com.tss.aml.entity.Transaction> transactions = transactionService.getAllTransactions();

		// Filter transactions from last 6 months
		List<com.tss.aml.entity.Transaction> recentTransactions = transactions.stream()
				.filter(t -> t.getTimestamp() != null && t.getTimestamp().isAfter(sixMonthsAgo))
				.collect(Collectors.toList());

		// Group by month
		Map<String, TransactionTrendDTO> monthlyData = new LinkedHashMap<>();
		DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("MMM");

		// Initialize last 6 months
		for (int i = 5; i >= 0; i--) {
			LocalDateTime month = LocalDateTime.now().minusMonths(i);
			String monthKey = month.format(monthFormatter);
			monthlyData.put(monthKey, new TransactionTrendDTO(monthKey, 0, 0, 0));
		}

		// Count transactions by status for each month
		for (com.tss.aml.entity.Transaction tx : recentTransactions) {
			String monthKey = tx.getTimestamp().format(monthFormatter);
			TransactionTrendDTO trend = monthlyData.get(monthKey);

			if (trend != null) {
				com.tss.aml.entity.enums.TransactionStatus status = tx.getStatus();

				if (status == com.tss.aml.entity.enums.TransactionStatus.COMPLETED
						|| status == com.tss.aml.entity.enums.TransactionStatus.APPROVED) {
					trend.setCompleted(trend.getCompleted() + 1);
				} else if (status == com.tss.aml.entity.enums.TransactionStatus.FLAGGED
						|| status == com.tss.aml.entity.enums.TransactionStatus.PENDING) {
					trend.setFlagged(trend.getFlagged() + 1);
				} else if (status == com.tss.aml.entity.enums.TransactionStatus.BLOCKED) {
					trend.setBlocked(trend.getBlocked() + 1);
				}
			}
		}

		return ResponseEntity.ok(new ArrayList<>(monthlyData.values()));
	}
	
	// === ACCOUNT MANAGEMENT ===
	@GetMapping("/customers/{customerId}/accounts")
	public ResponseEntity<List<com.tss.aml.entity.Account>> getCustomerAccounts(@PathVariable Long customerId) {
		return ResponseEntity.ok(adminService.getAccountsByCustomerId(customerId));
	}
	
	@PutMapping("/accounts/{accountId}/deactivate")
	public ResponseEntity<String> deactivateAccount(@PathVariable Long accountId, 
			@RequestBody Map<String, String> request) {
		String reason = request.getOrDefault("reason", "Deactivated by admin");
		adminService.deactivateAccount(accountId, reason);
		return ResponseEntity.ok("Account deactivated - all future transactions blocked");
	}
	
	@PutMapping("/accounts/{accountId}/activate")
	public ResponseEntity<String> activateAccount(@PathVariable Long accountId) {
		adminService.activateAccount(accountId);
		return ResponseEntity.ok("Account activated successfully");
	}

}