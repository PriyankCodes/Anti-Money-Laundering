package com.tss.aml.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.request.DepositRequest;
import com.tss.aml.dto.request.TransferRequest;
import com.tss.aml.dto.request.WithdrawalRequest;
import com.tss.aml.dto.response.TransactionResponseDto;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.User;
import com.tss.aml.entity.enums.AuditAction;
import com.tss.aml.entity.enums.AuditResourceType;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.security.SecurityUtils;
import com.tss.aml.service.AccountService;
import com.tss.aml.service.AuditService;
import com.tss.aml.service.TransactionService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

	@Autowired
	private TransactionService transactionService;

	@Autowired
	private AuditService auditService;

	@Autowired
	private TransactionRepository transactionRepository;

	@Autowired
	private AccountService accountService;

	@PostMapping("/transfer")
	@PreAuthorize("hasRole('CUSTOMER')")
	public ResponseEntity<TransactionResponseDto> transferFunds(@Valid @RequestBody TransferRequest transferRequest,
			HttpServletRequest request) {

		// Get current authenticated user
		User currentUser = SecurityUtils.getCurrentUser();
		Long userId = currentUser.getUserId();
		
		// Validate that customer can only transfer from their own accounts
		if (SecurityUtils.isCurrentUserCustomer()) {
			if (!accountService.isAccountOwnedByUser(transferRequest.getSenderAccountNumber(), userId)) {
				throw new SecurityException("Access denied: You can only transfer from your own accounts");
			}
		}

		String ipAddress = getClientIpAddress(request);
		String userAgent = request.getHeader("User-Agent");

		// Log the transfer attempt
		auditService.logAction(AuditAction.TRANSFER_FUNDS, AuditResourceType.TRANSACTION, null, userId, null,
				"Transfer attempt initiated", ipAddress, userAgent);

		Transaction transaction = transactionService.transferFunds(transferRequest, userId, ipAddress, userAgent);

		TransactionResponseDto response = new TransactionResponseDto();
		response.setTransactionId(transaction.getTransactionId());
		response.setSenderAccountNumber(
				transaction.getSenderAccountNumber() != null ? transaction.getSenderAccountNumber() : null);
		response.setCounterpartyAccount(
				transaction.getCounterpartyAccount() != null ? transaction.getCounterpartyAccount() : null);
		response.setAmount(transaction.getAmount());
		response.setCurrency(transaction.getCurrency());
		response.setDescription(transaction.getDescription());
		response.setTransactionType(transaction.getTransactionType());
		response.setStatus(transaction.getStatus());
		response.setTimestamp(transaction.getTimestamp());
		response.setCounterpartyName(transaction.getCounterpartyName());
		response.setCountryCode(transaction.getCountryCode());

		return new ResponseEntity<>(response, HttpStatus.CREATED);
	}

	@PostMapping("/deposit")
	@PreAuthorize("hasRole('CUSTOMER')")
	public ResponseEntity<TransactionResponseDto> depositFunds(@Valid @RequestBody DepositRequest depositRequest,
			HttpServletRequest request) {

		// Get current authenticated user
		User currentUser = SecurityUtils.getCurrentUser();
		Long userId = currentUser.getUserId();
		
		// Validate that customer can only deposit to their own accounts
		if (SecurityUtils.isCurrentUserCustomer()) {
			if (!accountService.isAccountOwnedByUser(depositRequest.getAccountNumber(), userId)) {
				throw new SecurityException("Access denied: You can only deposit to your own accounts");
			}
		}

		String ipAddress = getClientIpAddress(request);
		String userAgent = request.getHeader("User-Agent");

		// Log the deposit attempt
		auditService.logAction(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION, null, userId, null,
				"Deposit attempt initiated", ipAddress, userAgent);

		Transaction transaction = transactionService.depositFunds(depositRequest, userId, ipAddress, userAgent);

		TransactionResponseDto response = new TransactionResponseDto();
		response.setTransactionId(transaction.getTransactionId());
		response.setSenderAccountNumber(
				transaction.getSenderAccountNumber() != null ? transaction.getSenderAccountNumber() : null);
		response.setCounterpartyAccount(
				transaction.getCounterpartyAccount() != null ? transaction.getCounterpartyAccount() : null);
		response.setAmount(transaction.getAmount());
		response.setCurrency(transaction.getCurrency());
		response.setDescription(transaction.getDescription());
		response.setTransactionType(transaction.getTransactionType());
		response.setStatus(transaction.getStatus());
		response.setTimestamp(transaction.getTimestamp());
		response.setCounterpartyName(transaction.getCounterpartyName());
		response.setCountryCode(transaction.getCountryCode());

		return new ResponseEntity<>(response, HttpStatus.CREATED);
	}

	@PostMapping("/withdraw")
	@PreAuthorize("hasRole('CUSTOMER')")
	public ResponseEntity<TransactionResponseDto> withdrawFunds(@Valid @RequestBody WithdrawalRequest withdrawalRequest,
			HttpServletRequest request) {

		// Get current authenticated user
		User currentUser = SecurityUtils.getCurrentUser();
		Long userId = currentUser.getUserId();
		
		// Validate that customer can only withdraw from their own accounts
		if (SecurityUtils.isCurrentUserCustomer()) {
			if (!accountService.isAccountOwnedByUser(withdrawalRequest.getAccountNumber(), userId)) {
				throw new SecurityException("Access denied: You can only withdraw from your own accounts");
			}
		}

		String ipAddress = getClientIpAddress(request);
		String userAgent = request.getHeader("User-Agent");

		// Log the withdrawal attempt
		auditService.logAction(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION, null, userId, null,
				"Withdrawal attempt initiated", ipAddress, userAgent);

		Transaction transaction = transactionService.withdrawFunds(withdrawalRequest, userId, ipAddress, userAgent);

		TransactionResponseDto response = new TransactionResponseDto();
		response.setTransactionId(transaction.getTransactionId());
		response.setSenderAccountNumber(
				transaction.getSenderAccountNumber() != null ? transaction.getSenderAccountNumber() : null);
		response.setCounterpartyAccount(
				transaction.getCounterpartyAccount() != null ? transaction.getCounterpartyAccount() : null);
		response.setAmount(transaction.getAmount());
		response.setCurrency(transaction.getCurrency());
		response.setDescription(transaction.getDescription());
		response.setTransactionType(transaction.getTransactionType());
		response.setStatus(transaction.getStatus());
		response.setTimestamp(transaction.getTimestamp());
		response.setCounterpartyName(transaction.getCounterpartyName());
		response.setCountryCode(transaction.getCountryCode());

		return new ResponseEntity<>(response, HttpStatus.CREATED);
	}

	@GetMapping("/account/{accountNumber}")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COMPLIANCE_OFFICER') or (hasRole('CUSTOMER') and @accountService.isAccountOwnedByUser(#accountNumber, authentication.principal.userId))")
	public ResponseEntity<List<TransactionResponseDto>> getTransactionHistory(@PathVariable String accountNumber,
			HttpServletRequest request) {

		// Additional security validation for customers
		User currentUser = SecurityUtils.getCurrentUser();
		if (SecurityUtils.isCurrentUserCustomer()) {
			if (!accountService.isAccountOwnedByUser(accountNumber, currentUser.getUserId())) {
				throw new SecurityException("Access denied: You can only view your own transaction history");
			}
		}

		String ipAddress = getClientIpAddress(request);

		// Find transactions where this account is either sender or receiver
		List<Transaction> transactions = transactionRepository.findBySenderAccountNumber(accountNumber);

		List<TransactionResponseDto> responses = transactions.stream().map(transaction -> {
			TransactionResponseDto response = new TransactionResponseDto();
			response.setTransactionId(transaction.getTransactionId());
			response.setSenderAccountNumber(
					transaction.getSenderAccountNumber() != null ? transaction.getSenderAccountNumber() : null);
			response.setCounterpartyAccount(
					transaction.getCounterpartyAccount() != null ? transaction.getCounterpartyAccount() : null);
			response.setAmount(transaction.getAmount());
			response.setCurrency(transaction.getCurrency());
			response.setDescription(transaction.getDescription());
			response.setTransactionType(transaction.getTransactionType());
			response.setStatus(transaction.getStatus());
			response.setTimestamp(transaction.getTimestamp());
			response.setCounterpartyName(transaction.getCounterpartyName());
				response.setCountryCode(transaction.getCountryCode());
			return response;
		}).collect(Collectors.toList());

		auditService.logSuccess(AuditAction.DATA_VIEWED, AuditResourceType.TRANSACTION, null, null, null,
				"Transaction history queried for account: " + accountNumber, ipAddress);

		return ResponseEntity.ok(responses);
	}

	@GetMapping("/{transactionId}")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COMPLIANCE_OFFICER')")
	public ResponseEntity<TransactionResponseDto> getTransactionById(@PathVariable Long transactionId,
			HttpServletRequest request) {

		String ipAddress = getClientIpAddress(request);

		Transaction transaction = transactionRepository.findById(transactionId).orElse(null);
		if (transaction == null) {
			auditService.logFailure(AuditAction.DATA_VIEWED, AuditResourceType.TRANSACTION, transactionId, null, null,
					"Transaction not found: " + transactionId, ipAddress);
			return ResponseEntity.notFound().build();
		}

		if (SecurityUtils.isCurrentUserCustomer()) {
			throw new SecurityException("Access denied: Customers should use customer-specific endpoints");
		}

		TransactionResponseDto response = new TransactionResponseDto();
		response.setTransactionId(transaction.getTransactionId());
        response.setSenderAccountNumber(transaction.getSenderAccountNumber() != null ? transaction.getSenderAccountNumber() : null);
        response.setCounterpartyAccount(transaction.getCounterpartyAccount() != null ? transaction.getCounterpartyAccount() : null);
		response.setAmount(transaction.getAmount());
		response.setCurrency(transaction.getCurrency());
		response.setDescription(transaction.getDescription());
		response.setTransactionType(transaction.getTransactionType());
		response.setStatus(transaction.getStatus());
		response.setTimestamp(transaction.getTimestamp());
		response.setCounterpartyName(transaction.getCounterpartyName());
		response.setCountryCode(transaction.getCountryCode());

		auditService.logSuccess(AuditAction.DATA_VIEWED, AuditResourceType.TRANSACTION, transactionId, null, null,
				"Transaction details viewed: " + transactionId, ipAddress);

		return ResponseEntity.ok(response);
	}

	private String getClientIpAddress(HttpServletRequest request) {
		String xForwardedFor = request.getHeader("X-Forwarded-For");
		if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
			return xForwardedFor.split(",")[0].trim();
		}

		String xRealIp = request.getHeader("X-Real-IP");
		if (xRealIp != null && !xRealIp.isEmpty()) {
			return xRealIp;
		}

		return request.getRemoteAddr();
	}
}
