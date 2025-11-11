package com.tss.aml.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.request.CreateAccountRequest;
import com.tss.aml.dto.request.CustomerProfileUpdateRequest;
import com.tss.aml.dto.request.HelpDeskTicketRequest;
import com.tss.aml.dto.response.AlertResponseDto;
import com.tss.aml.dto.response.ApiResponseDto;
import com.tss.aml.dto.response.CustomerProfileDto;
import com.tss.aml.dto.response.HelpDeskTicketDto;
import com.tss.aml.dto.response.KycDocumentResponseDto;
import com.tss.aml.dto.response.TransactionCountDto;
import com.tss.aml.dto.response.TransactionResponseDto;
import com.tss.aml.entity.Account;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.HelpDeskTicket;
import com.tss.aml.entity.KycDocument;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.User;
import com.tss.aml.service.AccountService;
import com.tss.aml.service.AlertService;
import com.tss.aml.service.CustomerService;
import com.tss.aml.service.HelpDeskService;
import com.tss.aml.service.KycDocumentService;
import com.tss.aml.service.TransactionService;

@RestController
@RequestMapping("/api/customers")
@PreAuthorize("hasRole('CUSTOMER')")
public class CustomerController {

	@Autowired
	private TransactionService transactionService;

	@Autowired
	private AlertService alertService;

	@Autowired
	private KycDocumentService kycDocumentService;

	@Autowired
	private CustomerService customerService;

	@Autowired
	private HelpDeskService helpDeskService;

	@Autowired
	private AccountService accountService;

	@GetMapping("/accounts")
	public ResponseEntity<ApiResponseDto<List<Map<String, Object>>>> getCustomerAccounts() {
		try {
			Authentication auth = SecurityContextHolder.getContext().getAuthentication();
			Long customerId = ((User) auth.getPrincipal()).getUserId();

			System.out.println("Controller: Getting accounts for customer ID: " + customerId);

			// Try to get accounts with detailed error handling
			List<Map<String, Object>> accountDtos = new ArrayList<>();

			try {
				List<Account> accounts = accountService.getAccountsByCustomerId(customerId);
				System.out.println("Service returned " + accounts.size() + " accounts");
				accountDtos = accounts.stream().map(this::convertToAccountDto).collect(Collectors.toList());
			} catch (Exception serviceEx) {
				System.err.println("Service layer error: " + serviceEx.getMessage());
				serviceEx.printStackTrace();
				// Return empty list instead of failing
				accountDtos = new ArrayList<>();
			}

			System.out.println("Controller: Successfully returning " + accountDtos.size() + " accounts");
			return ResponseEntity.ok(new ApiResponseDto<>(true, "Accounts retrieved successfully", accountDtos));
		} catch (Exception e) {
			System.err.println("Controller: Error getting customer accounts: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(500)
					.body(new ApiResponseDto<>(false, "Failed to retrieve accounts: " + e.getMessage(), null));
		}
	}

	@PostMapping("/accounts")
	public ResponseEntity<ApiResponseDto<Map<String, Object>>> createAccount(
			@RequestBody CreateAccountRequest request) {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long customerId = ((User) auth.getPrincipal()).getUserId();

		Account account = accountService.createAccount(request, customerId);
		Map<String, Object> accountDto = convertToAccountDto(account);

		return ResponseEntity.ok(new ApiResponseDto<>(true, "Account created successfully", accountDto));
	}

	// === TRANSACTION ENDPOINTS ===
	@GetMapping("/transactions")
	public ResponseEntity<ApiResponseDto<List<TransactionResponseDto>>> getCustomerTransactions() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long customerId = ((User) auth.getPrincipal()).getUserId();

		List<Transaction> transactions = transactionService.getTransactionsByCustomerId(customerId);
		List<TransactionResponseDto> responses = transactions.stream().map(this::convertToTransactionResponse)
				.collect(Collectors.toList());

		return ResponseEntity.ok(new ApiResponseDto<>(true, "Transactions retrieved successfully", responses));
	}

	@GetMapping("/transactions/flagged")
	public ResponseEntity<ApiResponseDto<List<TransactionResponseDto>>> getFlaggedTransactions() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long customerId = ((User) auth.getPrincipal()).getUserId();

		List<Transaction> transactions = transactionService.getFlaggedTransactionsByCustomerId(customerId);
		List<TransactionResponseDto> responses = transactions.stream().map(this::convertToTransactionResponse)
				.collect(Collectors.toList());

		return ResponseEntity.ok(new ApiResponseDto<>(true, "Flagged transactions retrieved successfully", responses));
	}

	@GetMapping("/transactions/counts")
	public ResponseEntity<ApiResponseDto<TransactionCountDto>> getTransactionCounts() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long customerId = ((User) auth.getPrincipal()).getUserId();

		TransactionCountDto counts = transactionService.getTransactionCountsByCustomerId(customerId);
		return ResponseEntity.ok(new ApiResponseDto<>(true, "Transaction counts retrieved successfully", counts));
	}

	// === ALERT ENDPOINTS ===
	@GetMapping("/alerts")
	public ResponseEntity<ApiResponseDto<List<AlertResponseDto>>> getCustomerAlerts() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long customerId = ((User) auth.getPrincipal()).getUserId();

		List<Alert> alerts = alertService.getAlertsByCustomerId(customerId);
		List<AlertResponseDto> responses = alerts.stream().map(this::convertToAlertResponse)
				.collect(Collectors.toList());

		return ResponseEntity.ok(new ApiResponseDto<>(true, "Alerts retrieved successfully", responses));
	}

	// === KYC DOCUMENT ENDPOINTS ===
	@GetMapping("/kyc-documents")
	public ResponseEntity<ApiResponseDto<List<KycDocumentResponseDto>>> getKycDocumentHistory() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long customerId = ((User) auth.getPrincipal()).getUserId();

		List<KycDocument> documents = kycDocumentService.getCustomerDocuments(customerId);
		List<KycDocumentResponseDto> responses = documents.stream().map(this::convertToKycDocumentDto)
				.collect(Collectors.toList());

		return ResponseEntity.ok(new ApiResponseDto<>(true, "KYC documents retrieved successfully", responses));
	}

	// === PROFILE MANAGEMENT ENDPOINTS ===
	@GetMapping("/profile")
	public ResponseEntity<ApiResponseDto<CustomerProfileDto>> getCustomerProfile() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long customerId = ((User) auth.getPrincipal()).getUserId();

		CustomerProfileDto profile = customerService.getCustomerProfile(customerId);
		return ResponseEntity.ok(new ApiResponseDto<>(true, "Profile retrieved successfully", profile));
	}

	@PutMapping("/profile")
	public ResponseEntity<ApiResponseDto<CustomerProfileDto>> updateCustomerProfile(
			@RequestBody CustomerProfileUpdateRequest request) {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long customerId = ((User) auth.getPrincipal()).getUserId();

		CustomerProfileDto updatedProfile = customerService.updateCustomerProfile(customerId, request);
		return ResponseEntity.ok(new ApiResponseDto<>(true, "Profile updated successfully", updatedProfile));
	}

	@PostMapping("/profile/send-otp")
	public ResponseEntity<ApiResponseDto<String>> sendProfileUpdateOtp() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		String email = ((User) auth.getPrincipal()).getEmail();

		customerService.sendProfileUpdateOtp(email);
		return ResponseEntity.ok(new ApiResponseDto<>(true, "OTP sent successfully", "OTP sent to your email"));
	}

	// === HELPDESK ENDPOINTS ===
	@PostMapping("/helpdesk/tickets")
	public ResponseEntity<ApiResponseDto<HelpDeskTicketDto>> createHelpDeskTicket(
			@RequestBody HelpDeskTicketRequest request) {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long customerId = ((User) auth.getPrincipal()).getUserId();

		HelpDeskTicket ticket = helpDeskService.createTicket(customerId, request);
		HelpDeskTicketDto response = convertToHelpDeskTicketDto(ticket);

		return ResponseEntity.ok(new ApiResponseDto<>(true, "Ticket created successfully", response));
	}

	@GetMapping("/helpdesk/tickets")
	public ResponseEntity<ApiResponseDto<List<HelpDeskTicketDto>>> getCustomerTickets() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long customerId = ((User) auth.getPrincipal()).getUserId();

		List<HelpDeskTicket> tickets = helpDeskService.getCustomerTickets(customerId);
		List<HelpDeskTicketDto> responses = tickets.stream().map(this::convertToHelpDeskTicketDto)
				.collect(Collectors.toList());

		return ResponseEntity.ok(new ApiResponseDto<>(true, "Tickets retrieved successfully", responses));
	}

	@PutMapping("/helpdesk/tickets/{ticketId}")
	public ResponseEntity<ApiResponseDto<HelpDeskTicketDto>> updateTicketDescription(@PathVariable Long ticketId,
			@RequestBody String description) {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long customerId = ((User) auth.getPrincipal()).getUserId();

		HelpDeskTicket ticket = helpDeskService.updateTicketDescription(ticketId, customerId, description);
		HelpDeskTicketDto response = convertToHelpDeskTicketDto(ticket);

		return ResponseEntity.ok(new ApiResponseDto<>(true, "Ticket updated successfully", response));
	}

	// === HELPER METHODS ===
	private TransactionResponseDto convertToTransactionResponse(Transaction transaction) {
		// Use the DTO constructor which properly maps all fields including customer
		// info
		return new TransactionResponseDto(transaction);
	}

	private AlertResponseDto convertToAlertResponse(Alert alert) {
		AlertResponseDto response = new AlertResponseDto();
		response.setAlertId(alert.getAlertId());
		response.setCustomerId(alert.getCustomer().getUserId());
		response.setCustomerName(alert.getCustomer().getFirstName() + " " + alert.getCustomer().getLastName());
		response.setTransactionId(alert.getTransaction() != null ? alert.getTransaction().getTransactionId() : null);
		response.setRuleTriggered(alert.getRuleTriggered());
		response.setRiskScore(alert.getRiskScore());
		response.setStatus(alert.getStatus());
		response.setCreatedAt(alert.getCreatedAt());
		response.setAssignedOfficerName(alert.getAssignedTo() != null
				? alert.getAssignedTo().getFirstName() + " " + alert.getAssignedTo().getLastName()
				: null);
		return response;
	}

	private KycDocumentResponseDto convertToKycDocumentDto(KycDocument document) {
		KycDocumentResponseDto dto = new KycDocumentResponseDto();
		dto.setId(document.getId());
		dto.setDocumentType(document.getDocType());
		dto.setFileName(document.getFileName());
		dto.setStatus(document.getStatus());
		dto.setUploadTimestamp(document.getUploadTimestamp());
		dto.setVerificationTimestamp(document.getVerificationTimestamp());
		dto.setVerificationNotes(document.getVerificationNotes());

		return dto;
	}

	private HelpDeskTicketDto convertToHelpDeskTicketDto(HelpDeskTicket ticket) {
		HelpDeskTicketDto dto = new HelpDeskTicketDto();
		dto.setTicketId(ticket.getTicketId());
		dto.setCustomerId(ticket.getCustomerId());
		dto.setCustomerName(ticket.getCustomerName());
		dto.setSubject(ticket.getSubject());
		dto.setDescription(ticket.getDescription());
		dto.setPriority(ticket.getPriority());
		dto.setStatus(ticket.getStatus());
		dto.setCreatedAt(ticket.getCreatedAt());
		dto.setUpdatedAt(ticket.getUpdatedAt());
		dto.setResolvedAt(ticket.getResolvedAt());
		dto.setResolution(ticket.getResolution());
		dto.setAssignedToId(ticket.getAssignedToId());
		dto.setAlertId(ticket.getAlertId());
		return dto;
	}

	private Map<String, Object> convertToAccountDto(Account account) {
		Map<String, Object> dto = new HashMap<>();
		dto.put("id", account.getAccountId());
		dto.put("accountNumber", account.getAccountNumber());
		dto.put("accountType", account.getAccountType().name());
		dto.put("balance", account.getBalance());
		dto.put("currency", account.getCurrency());
		dto.put("status", account.getStatus() != null ? account.getStatus().name() : "ACTIVE");
		dto.put("openDate",
				account.getCreatedAt() != null ? account.getCreatedAt().toString() : LocalDateTime.now().toString());
		return dto;
	}
}
