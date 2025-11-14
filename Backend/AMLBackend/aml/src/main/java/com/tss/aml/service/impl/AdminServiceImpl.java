package com.tss.aml.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.dto.request.AccountUpdateRequest;
import com.tss.aml.dto.request.ComplianceOfficerRequest;
import com.tss.aml.dto.request.CustomerProfileUpdateRequest;
import com.tss.aml.dto.request.KeywordRequest;
import com.tss.aml.dto.request.RiskyCountryRequest;
import com.tss.aml.dto.request.RuleRequest;
import com.tss.aml.dto.response.AdminNotificationDto;
import com.tss.aml.entity.Account;
import com.tss.aml.entity.Admin;
import com.tss.aml.entity.ComplianceOfficer;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.KycDocument;
import com.tss.aml.entity.RiskyCountry;
import com.tss.aml.entity.Rule;
import com.tss.aml.entity.SuspiciousKeyword;
import com.tss.aml.entity.User;
import com.tss.aml.entity.enums.AccountStatus;
import com.tss.aml.entity.enums.AccountType;
import com.tss.aml.entity.enums.KycStatus;
import com.tss.aml.entity.enums.UserStatus;
import com.tss.aml.repository.AccountRepository;
import com.tss.aml.repository.AdminRepository;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.AuditLogRepository;
import com.tss.aml.repository.ComplianceOfficerRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.KycDocumentRepository;
import com.tss.aml.repository.RiskyCountryRepository;
import com.tss.aml.repository.RuleRepository;
import com.tss.aml.repository.SuspiciousKeywordRepository;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.service.AdminService;
import com.tss.aml.service.AuditService;
import com.tss.aml.service.EmailService;

@Service
@Transactional
public class AdminServiceImpl implements AdminService {

	@Autowired
	private ComplianceOfficerRepository complianceOfficerRepo;

	@Autowired
	private RuleRepository ruleRepo;

	@Autowired
	private SuspiciousKeywordRepository keywordRepo;

	@Autowired
	private RiskyCountryRepository riskyCountryRepo;

	@Autowired
	private AdminRepository adminRepo;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private CustomerRepository customerRepo;

	@Autowired
	private AccountRepository accountRepo;

	@Autowired
	private KycDocumentRepository kycDocumentRepo;

	@Autowired
	private TransactionRepository transactionRepo;

	@Autowired
	private AlertRepository alertRepo;

	@Autowired
	private AuditLogRepository auditLogRepo;

	@Autowired
	private AuditService auditService;

	@Autowired
	private EmailService emailService;
	

	private Admin getCurrentAdmin() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth != null && auth.getPrincipal() instanceof User) {
			User user = (User) auth.getPrincipal();
			return adminRepo.findById(user.getUserId()).orElse(null);
		}
		return null;
	}

	// === COMPLIANCE OFFICERS ===
	@Override
	public ComplianceOfficer createComplianceOfficer(ComplianceOfficerRequest request) {
		if (complianceOfficerRepo.findByEmail(request.getEmail()).isPresent()) {
			throw new RuntimeException("Email already exists");
		}
		
		// Check if phone number already exists
		if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
			if (complianceOfficerRepo.existsByPhone(request.getPhone().trim())) {
				throw new RuntimeException("Phone number already registered. Please use a different phone number.");
			}
		}

		// Store the plain password before encoding for email
		String plainPassword = request.getPassword();

		ComplianceOfficer officer = new ComplianceOfficer(request.getEmail(),
				passwordEncoder.encode(request.getPassword()), request.getFirstName(), request.getLastName(),
				request.getPhone());

		// Set officer as active and verified immediately
		officer.setStatus(com.tss.aml.entity.enums.UserStatus.ACTIVE);
		officer.setEmailVerified(true);

		ComplianceOfficer savedOfficer = complianceOfficerRepo.save(officer);

		// Send welcome email with credentials
		try {
			String loginUrl = "http://localhost:8080/login"; // You can make this configurable
			emailService.sendOfficerAccountCreatedEmail(savedOfficer.getEmail(), savedOfficer.getFirstName(),
					savedOfficer.getLastName(), savedOfficer.getEmail(), plainPassword, loginUrl);

		} catch (Exception emailError) {
			// Log email failure but don't fail the officer creation
			System.err.println("Failed to send officer creation email: " + emailError.getMessage());

		}

		// Set officer as active and verified immediately
		officer.setStatus(com.tss.aml.entity.enums.UserStatus.ACTIVE);
		officer.setEmailVerified(true);
		return complianceOfficerRepo.save(officer);
	}

	@Override
	public List<ComplianceOfficer> getAllComplianceOfficers() {
		return complianceOfficerRepo.findAll();
	}

	@Override
	public void deleteComplianceOfficer(Long id) {
		complianceOfficerRepo.deleteById(id);
	}

	// === RULES ===
	@Override
	public Rule createRule(RuleRequest request) {
		Rule rule = new Rule(request.getName(), request.getType(), request.getConditions(),
				request.getRiskScoreImpact());
		rule.setDescription(request.getDescription());
		rule.setActive(request.getActive());

		// Set updatedBy and updatedAt
		Admin currentAdmin = getCurrentAdmin();
		if (currentAdmin != null) {
			rule.setUpdatedBy(currentAdmin);
		}
		rule.setUpdatedAt(LocalDateTime.now());

		return ruleRepo.save(rule);
	}

	@Override
	public Rule updateRule(Long id, RuleRequest request) {
		Rule rule = ruleRepo.findById(id).orElseThrow(() -> new RuntimeException("Rule not found"));
		rule.setName(request.getName());
		rule.setDescription(request.getDescription());
		rule.setType(request.getType());
		rule.setConditions(request.getConditions());
		rule.setRiskScoreImpact(request.getRiskScoreImpact());
		rule.setActive(request.getActive());

		// Set updatedBy and updatedAt
		Admin currentAdmin = getCurrentAdmin();
		if (currentAdmin != null) {
			rule.setUpdatedBy(currentAdmin);
		}
		rule.setUpdatedAt(LocalDateTime.now());

		return ruleRepo.save(rule);
	}

	@Override
	public void deleteRule(Long id) {
		ruleRepo.deleteById(id);
	}

	@Override
	public List<Rule> getAllRules() {
		return ruleRepo.findAll();
	}

	// === KEYWORDS ===
	@Transactional
	@Override
	public SuspiciousKeyword createKeyword(KeywordRequest request) {
		SuspiciousKeyword keyword = new SuspiciousKeyword(request.getWord(), request.getCategory(),
				request.getSeverity());
		keyword.setActive(request.getActive());
		return keywordRepo.save(keyword);
	}

	@Transactional
	@Override
	public SuspiciousKeyword updateKeyword(Long id, KeywordRequest request) {
		SuspiciousKeyword kw = keywordRepo.findById(id).orElseThrow(() -> new RuntimeException("Keyword not found"));
		kw.setWord(request.getWord());
		kw.setCategory(request.getCategory());
		kw.setSeverity(request.getSeverity());
		kw.setActive(request.getActive());
		return keywordRepo.save(kw);
	}

	@Transactional
	@Override
	public void deleteKeyword(Long id) {
		keywordRepo.deleteById(id);
	}

	@Override
	public List<SuspiciousKeyword> getAllKeywords() {
		return keywordRepo.findAll();
	}

	// === RISKY COUNTRIES ===
	@Override
	public RiskyCountry createRiskyCountry(RiskyCountryRequest request) {
		// Check if country already exists
		if (riskyCountryRepo.findById(request.getCountryCode().toUpperCase()).isPresent()) {
			throw new RuntimeException("Country with code " + request.getCountryCode() + " already exists");
		}

		RiskyCountry country = new RiskyCountry(request.getCountryCode().toUpperCase(), request.getCountryName(),
				request.getRiskLevel());

		// Set lastUpdatedBy
		Admin currentAdmin = getCurrentAdmin();
		if (currentAdmin != null) {
			country.setLastUpdatedBy(currentAdmin);
		}
		country.setLastUpdatedAt(LocalDateTime.now());

		return riskyCountryRepo.save(country);
	}

	@Override
	public RiskyCountry updateRiskyCountry(String countryCode, RiskyCountryRequest request) {
		RiskyCountry country = riskyCountryRepo.findById(countryCode.toUpperCase())
				.orElseThrow(() -> new RuntimeException("Country not found"));
		country.setCountryName(request.getCountryName());
		country.setRiskLevel(request.getRiskLevel());

		// Set lastUpdatedBy
		Admin currentAdmin = getCurrentAdmin();
		if (currentAdmin != null) {
			country.setLastUpdatedBy(currentAdmin);
		}
		country.setLastUpdatedAt(LocalDateTime.now());

		return riskyCountryRepo.save(country);
	}

	@Override
	public void deleteRiskyCountry(String countryCode) {
		if (!riskyCountryRepo.existsById(countryCode.toUpperCase())) {
			throw new RuntimeException("Country not found");
		}
		riskyCountryRepo.deleteById(countryCode.toUpperCase());
	}

	@Override
	public List<RiskyCountry> getAllRiskyCountries() {
		return riskyCountryRepo.findAll();
	}

	// === CUSTOMER MANAGEMENT ===
	@Override
	public List<Customer> getAllCustomers() {
		return customerRepo.findAll();
	}

	@Override
	public Customer getCustomerById(Long id) {
		return customerRepo.findById(id).orElseThrow(() -> new RuntimeException("Customer not found"));
	}

	@Override
	public Customer updateCustomer(Long id, CustomerProfileUpdateRequest request) {
		Customer customer = getCustomerById(id);
		customer.setFirstName(request.getFirstName());
		customer.setLastName(request.getLastName());
		customer.setEmail(request.getEmail());
		customer.setContactNumber(request.getContactNumber());
		customer.setStreet(request.getStreet());
		customer.setCity(request.getCity());
		customer.setState(request.getState());
		customer.setNationality(request.getNationality());
		customer.setPincode(request.getPincode());
		// Note: riskProfile field doesn't exist in Customer entity - removing this line
		// customer.setRiskProfile(request.getRiskProfile());
		return customerRepo.save(customer);
	}

	@Override
	public void deleteCustomer(Long id) {
		if (!customerRepo.existsById(id)) {
			throw new RuntimeException("Customer not found");
		}
		customerRepo.deleteById(id);
	}

	// === ACCOUNT MANAGEMENT ===
	@Override
	public List<Account> getAllAccounts() {
		return accountRepo.findAll();
	}

	@Override
	public List<Account> getAccountsByCustomerId(Long customerId) {
		return accountRepo.findByCustomerUserId(customerId);
	}

	@Override
	public Account updateAccount(Long accountId, AccountUpdateRequest request) {
		Account account = accountRepo.findById(accountId).orElseThrow(() -> new RuntimeException("Account not found"));

		// Convert string to AccountType enum
		if (request.getAccountType() != null) {
			account.setAccountType(AccountType.valueOf(request.getAccountType().toUpperCase()));
		}

		if (request.getBalance() != null) {
			account.setBalance(request.getBalance());
		}

		// Note: dailyTransactionLimit, monthlyTransactionLimit, and riskLevel fields
		// don't exist in Account entity
		// These would need to be added to the Account entity if required

		// Convert string to AccountStatus enum
		if (request.getStatus() != null) {
			account.setStatus(AccountStatus.valueOf(request.getStatus().toUpperCase()));
		}

		account.setUpdatedAt(java.time.LocalDateTime.now());
		return accountRepo.save(account);
	}

	@Override
	public void freezeAccount(Long accountId) {
		Account account = accountRepo.findById(accountId).orElseThrow(() -> new RuntimeException("Account not found"));
		account.setStatus(AccountStatus.FROZEN);
		account.setUpdatedAt(java.time.LocalDateTime.now());
		accountRepo.save(account);
	}

	@Override
	public void unfreezeAccount(Long accountId) {
		Account account = accountRepo.findById(accountId).orElseThrow(() -> new RuntimeException("Account not found"));
		account.setStatus(AccountStatus.ACTIVE);
		account.setUpdatedAt(java.time.LocalDateTime.now());
		accountRepo.save(account);
	}

	// === KYC DOCUMENT VERIFICATION MANAGEMENT ===
	@Override
	public List<KycDocument> getPendingDocuments() {
		return kycDocumentRepo.findByStatus(KycStatus.PENDING);
	}

	@Override
	public List<KycDocument> getDocumentsRequiringManualReview() {
		return kycDocumentRepo.findByValidatedFalse();
	}

	@Override
	public KycDocument verifyDocument(Long documentId, Long officerId, String notes, boolean approved) {
		KycDocument document = kycDocumentRepo.findById(documentId)
				.orElseThrow(() -> new RuntimeException("Document not found"));

		ComplianceOfficer officer = complianceOfficerRepo.findById(officerId)
				.orElseThrow(() -> new RuntimeException("Compliance officer not found"));

		document.setVerifiedBy(officer);
		document.setVerificationNotes(notes);
		document.setVerificationTimestamp(LocalDateTime.now());
		document.setStatus(approved ? KycStatus.VERIFIED : KycStatus.REJECTED);
		document.setValidated(approved);

		return kycDocumentRepo.save(document);
	}

	@Override
	public KycDocument rejectDocument(Long documentId, Long officerId, String rejectionReason) {
		return verifyDocument(documentId, officerId, rejectionReason, false);
	}

	// New methods for enhanced admin controller
	@Override
	public com.tss.aml.dto.response.DashboardStatsDto getDashboardStats() {
		com.tss.aml.dto.response.DashboardStatsDto stats = new com.tss.aml.dto.response.DashboardStatsDto();

		stats.setTotalCustomers(customerRepo.count());
		stats.setActiveCustomers(customerRepo.countByStatus(UserStatus.ACTIVE));
		stats.setTotalTransactions(transactionRepo.count());
		stats.setPendingAlerts(alertRepo.countByStatus(com.tss.aml.entity.enums.AlertStatus.OPEN));
		stats.setHighRiskAlerts(alertRepo.countByRiskScoreGreaterThanEqual(85));
		stats.setTotalComplianceOfficers(complianceOfficerRepo.count());
		stats.setPendingKycDocuments(kycDocumentRepo.countByStatus(KycStatus.PENDING));
		stats.setActiveRules(ruleRepo.countByIsActiveTrue());

		return stats;
	}

	@Override
	public Long getAlertCountByCustomerId(Long customerId) {
		return alertRepo.countByCustomerUserId(customerId);
	}

	@Override
	public void updateAdminProfile(String firstName, String lastName) {
		Admin admin = getCurrentAdmin();
		if (admin == null) {
			throw new RuntimeException("Admin not found");
		}

		admin.setFirstName(firstName);
		admin.setLastName(lastName);
//        admin.setDepartment(department);
		adminRepo.save(admin);
	}

	@Override
	public Map<String, Object> getSystemHealthStatus() {
		Map<String, Object> healthReport = new HashMap<>();

		try {
			// ✅ Basic database checks
			long customerCount = customerRepo.count();
			long transactionCount = transactionRepo.count();
			long alertCount = alertRepo.count();

			healthReport.put("database", "OK");
			healthReport.put("customerCount", customerCount);
			healthReport.put("transactionCount", transactionCount);
			healthReport.put("alertCount", alertCount);

			// ✅ Check total rules (if ruleRepo exists)
			try {
				long ruleCount = ruleRepo.count();
				healthReport.put("rulesLoaded", ruleCount);
			} catch (Exception e) {
				healthReport.put("rulesLoaded", "Error: " + e.getMessage());
			}

			// ✅ System resources check
			Runtime runtime = Runtime.getRuntime();
			long totalMemory = runtime.totalMemory() / (1024 * 1024);
			long freeMemory = runtime.freeMemory() / (1024 * 1024);
			long usedMemory = totalMemory - freeMemory;

			healthReport.put("memoryUsageMB", usedMemory + " / " + totalMemory);
			healthReport.put("availableProcessors", runtime.availableProcessors());

			// ✅ Overall status
			healthReport.put("status", "HEALTHY");
			healthReport.put("timestamp", java.time.LocalDateTime.now().toString());

		} catch (Exception e) {
			healthReport.put("status", "UNHEALTHY");
			healthReport.put("error", e.getMessage());
			healthReport.put("timestamp", java.time.LocalDateTime.now().toString());
		}

		return healthReport;
	}

	@Override
	public List<com.tss.aml.entity.AuditLog> getAllAuditLogs(int page, int size) {
		org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
		return auditLogRepo.findAllByOrderByTimestampDesc(pageable).getContent();
	}

	@Override
	public void updateCustomerAccountStatus(Long customerId, com.tss.aml.entity.enums.AccountStatus status,
			String reason) {
		List<Account> accounts = accountRepo.findByCustomerUserId(customerId);
		if (accounts.isEmpty()) {
			throw new RuntimeException("No accounts found for customer");
		}

		for (Account account : accounts) {
			account.setStatus(status);
			accountRepo.save(account);
		}

		// Log the action
		auditService.logAction(com.tss.aml.entity.enums.AuditAction.ACCOUNT_STATUS_UPDATE,
				com.tss.aml.entity.enums.AuditResourceType.CUSTOMER, customerId, getCurrentAdmin().getUserId(), null,
				"Account status updated to " + status + ". Reason: " + reason, null, null,
				com.tss.aml.entity.enums.AuditStatus.SUCCESS);
	}

	@Override
	public List<com.tss.aml.entity.Rule> getRulesByType(com.tss.aml.entity.enums.RuleType ruleType) {
		return ruleRepo.findByTypeAndIsActiveTrue(ruleType);
	}

	@Override
	public void updateOfficerStatus(Long officerId, com.tss.aml.entity.enums.UserStatus status) {
		try {
			ComplianceOfficer officer = complianceOfficerRepo.findById(officerId)
					.orElseThrow(() -> new RuntimeException("Officer not found with ID: " + officerId));

			// Update the status field
			officer.setStatus(status);
			complianceOfficerRepo.save(officer);

		} catch (Exception e) {
			System.err.println("Error updating officer status: " + e.getMessage());
			throw new RuntimeException("Failed to update officer status: " + e.getMessage());
		}
	}

	@Override
	public void updateCustomerStatus(Long customerId, com.tss.aml.entity.enums.UserStatus status) {
		try {
			Customer customer = customerRepo.findById(customerId)
					.orElseThrow(() -> new RuntimeException("Customer not found with ID: " + customerId));

			customer.setStatus(status);
			customerRepo.save(customer);

		} catch (Exception e) {
			System.err.println("Error updating customer status: " + e.getMessage());
			throw new RuntimeException("Failed to update customer status: " + e.getMessage());
		}
	}

	@Override
	public List<AdminNotificationDto> getAdminNotifications(int limit) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public void deactivateAccount(Long accountId, String reason) {
		Account account = accountRepo.findById(accountId)
				.orElseThrow(() -> new RuntimeException("Account not found with ID: " + accountId));
		
		// Deactivate the account - this prevents ALL future transactions
		// Past transactions remain unchanged
		account.setStatus(AccountStatus.INACTIVE);
		accountRepo.save(account);
		
		// Send email notification to customer
		try {
			Customer customer = account.getCustomer();
			emailService.sendAccountDeactivatedEmail(
				customer.getEmail(),
				customer.getFirstName(),
				account.getAccountNumber(),
				reason
			);
			System.out.println("📧 Account deactivation email sent to customer: " + customer.getEmail());
		} catch (Exception e) {
			System.err.println("Failed to send account deactivation email: " + e.getMessage());
		}
		
		// Log the action
		auditService.logAction(com.tss.aml.entity.enums.AuditAction.ACCOUNT_STATUS_UPDATE,
				com.tss.aml.entity.enums.AuditResourceType.ACCOUNT, accountId, 
				getCurrentAdmin() != null ? getCurrentAdmin().getUserId() : null, null,
				"Account deactivated - future transactions blocked. Reason: " + reason, null, null,
				com.tss.aml.entity.enums.AuditStatus.SUCCESS);
	}

	@Override
	public void activateAccount(Long accountId) {
		Account account = accountRepo.findById(accountId)
				.orElseThrow(() -> new RuntimeException("Account not found with ID: " + accountId));
		
		account.setStatus(AccountStatus.ACTIVE);
		accountRepo.save(account);
		
		// Log the action
		auditService.logAction(com.tss.aml.entity.enums.AuditAction.ACCOUNT_STATUS_UPDATE,
				com.tss.aml.entity.enums.AuditResourceType.ACCOUNT, accountId, 
				getCurrentAdmin() != null ? getCurrentAdmin().getUserId() : null, null,
				"Account activated", null, null,
				com.tss.aml.entity.enums.AuditStatus.SUCCESS);
	}
}
