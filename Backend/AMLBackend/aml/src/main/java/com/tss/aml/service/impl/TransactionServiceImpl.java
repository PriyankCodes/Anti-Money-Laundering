package com.tss.aml.service.impl;

import java.math.BigDecimal;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.request.DepositRequest;
import com.tss.aml.dto.request.TransferRequest;
import com.tss.aml.dto.request.WithdrawalRequest;
import com.tss.aml.dto.response.CurrencyConversionResult;
import com.tss.aml.dto.response.TransactionCountDto;
import com.tss.aml.entity.Account;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.AuditAction;
import com.tss.aml.entity.enums.AuditResourceType;
import com.tss.aml.entity.enums.AuditStatus;
import com.tss.aml.entity.enums.TransactionStatus;
import com.tss.aml.entity.enums.TransactionType;
import com.tss.aml.exception.KycNotVerifiedException;
import com.tss.aml.exception.UserApiException;
import com.tss.aml.repository.AccountRepository;
import com.tss.aml.repository.KycDocumentRepository;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.rule.RuleEngineResult;
import com.tss.aml.service.AlertService;
import com.tss.aml.service.AuditService;
import com.tss.aml.service.CurrencyService;
import com.tss.aml.service.RuleEngineService;
import com.tss.aml.service.TransactionService;

import jakarta.transaction.Transactional;

@Service
@Transactional
public class TransactionServiceImpl implements TransactionService {

	private static final Logger logger = LoggerFactory.getLogger(TransactionServiceImpl.class);
	private static final int BLOCK_THRESHOLD = 90;
	private static final int FLAG_THRESHOLD = 60;

	@Autowired
	private TransactionRepository transactionRepository;

	@Autowired
	private RuleEngineService ruleEngineService;

	@Autowired
	private AlertService alertService;

	@Autowired
	private AccountRepository accountRepository;

	@Autowired
	private AuditService auditService;

	@Autowired
	private CurrencyService currencyService;
	
	@Autowired
	private KycDocumentRepository kycDocumentRepository;

	@Autowired
	private com.tss.aml.service.EmailService emailService;

	@Override
	public Transaction processTransaction(Transaction transaction) {
		logger.info("🔄 Processing transaction: {} | Amount: {} {} | Type: {}", transaction.getTransactionId(),
				transaction.getAmount(), transaction.getCurrency(), transaction.getTransactionType());

		// Save transaction first
		transaction.setStatus(TransactionStatus.PENDING);
		transaction = transactionRepository.save(transaction);
		logger.debug("💾 Transaction saved with ID: {}", transaction.getTransactionId());

		// Evaluate AML rules
		logger.info("🔍 Starting AML rule evaluation for transaction: {}", transaction.getTransactionId());
		RuleEngineResult result = ruleEngineService.evaluate(transaction);

		// Normalize risk score to 0-100 range and set status based on thresholds
		int normalizedRisk = result.getRiskScore(); // Already normalized in RuleEngineService

		logger.info("📊 Risk assessment complete - Normalized Risk: {}/100", normalizedRisk);


		if (normalizedRisk > BLOCK_THRESHOLD) {
		    transaction.setStatus(TransactionStatus.BLOCKED);
		    logger.warn("🚫 TRANSACTION BLOCKED - High risk score: {}", normalizedRisk);
		    
		    // Send email notification for blocked transaction
		    try {
		        String reason = result.getTriggeredRules().isEmpty() ? 
		            "High risk score detected" : 
		            String.join(", ", result.getTriggeredRules());
		        emailService.sendTransactionBlockedEmail(
		            transaction.getCustomer().getEmail(),
		            transaction.getCustomer().getFirstName(),
		            transaction.getTransactionId().toString(),
		            transaction.getAmount().toString(),
		            transaction.getCurrency(),
		            transaction.getTransactionType().toString(),
		            String.valueOf(normalizedRisk),
		            reason
		        );
		        logger.info("📧 Blocked transaction email sent to customer: {}", transaction.getCustomer().getEmail());
		    } catch (Exception e) {
		        logger.error("Failed to send blocked transaction email: {}", e.getMessage());
		    }
		} else if (normalizedRisk > FLAG_THRESHOLD) {
		    transaction.setStatus(TransactionStatus.FLAGGED);
		    logger.warn("⚠️ TRANSACTION FLAGGED - Medium risk score: {}", normalizedRisk);
		    
		    // Send email notification for flagged transaction
		    try {
		        String reason = result.getTriggeredRules().isEmpty() ? 
		            "Medium risk score detected" : 
		            String.join(", ", result.getTriggeredRules());
		        emailService.sendTransactionFlaggedEmail(
		            transaction.getCustomer().getEmail(),
		            transaction.getCustomer().getFirstName(),
		            transaction.getTransactionId().toString(),
		            transaction.getAmount().toString(),
		            transaction.getCurrency(),
		            transaction.getTransactionType().toString(),
		            String.valueOf(normalizedRisk),
		            reason
		        );
		        logger.info("📧 Flagged transaction email sent to customer: {}", transaction.getCustomer().getEmail());
		    } catch (Exception e) {
		        logger.error("Failed to send flagged transaction email: {}", e.getMessage());
		    }
		} else {
		    transaction.setStatus(TransactionStatus.COMPLETED);
		    logger.info("✅ TRANSACTION COMPLETED - Low risk score: {}", normalizedRisk);
		}


		transaction.setRiskScore(normalizedRisk);
		transaction = transactionRepository.save(transaction);

		// Create alert if suspicious
		if (result.isSuspicious()) {
			logger.warn("🚨 Creating alert for suspicious transaction: {} | Triggered rules: {}",
					transaction.getTransactionId(), result.getTriggeredRules());
			alertService.createAlertForTransaction(transaction, result);
		} else {
			logger.info("✅ No alert needed - transaction is clean");
		}

		logger.info("✅ Transaction processing complete: {} | Final Status: {} | Risk Score: {}",
				transaction.getTransactionId(), transaction.getStatus(), transaction.getRiskScore());

		return transaction;
	}

	@Override
	public Transaction transferFunds(TransferRequest transferRequest, Long userId, String ipAddress, String userAgent) {
		try {
			// Find sender and receiver accounts
			Account senderAccount = accountRepository.findByAccountNumber(transferRequest.getSenderAccountNumber());
			if (senderAccount == null) {
				auditService.logFailure(AuditAction.TRANSFER_FUNDS, AuditResourceType.TRANSACTION, null, userId, null,
						"Sender account not found: " + transferRequest.getSenderAccountNumber(), ipAddress);
				throw new UserApiException("Sender account not found");
			}

			// SECURITY CHECK: Verify that the logged-in user owns the sender account
			if (!senderAccount.getCustomer().getUserId().equals(userId)) {
				auditService.logFailure(AuditAction.TRANSFER_FUNDS, AuditResourceType.TRANSACTION, null, userId, null,
						"Unauthorized access attempt - user does not own sender account: "
								+ transferRequest.getSenderAccountNumber(),
						ipAddress);
				throw new UserApiException("You are not authorized to transfer from this account");
			}
			
			// ACCOUNT STATUS CHECK: Prevent transactions from inactive accounts
			if (senderAccount.getStatus() != com.tss.aml.entity.enums.AccountStatus.ACTIVE) {
				auditService.logFailure(AuditAction.TRANSFER_FUNDS, AuditResourceType.TRANSACTION, null, userId, null,
						"Transaction blocked - sender account is " + senderAccount.getStatus() + ": " + transferRequest.getSenderAccountNumber(),
						ipAddress);
				throw new UserApiException("This account is " + senderAccount.getStatus() + " and cannot perform transactions");
			}
			
			// KYC VERIFICATION CHECK: Ensure customer has at least one verified KYC document
			verifyCustomerKyc(userId);

			Account receiverAccount = accountRepository.findByAccountNumber(transferRequest.getReceiverAccountNumber());
			if (receiverAccount == null) {
				auditService.logFailure(AuditAction.TRANSFER_FUNDS, AuditResourceType.TRANSACTION, null, userId, null,
						"Receiver account not found: " + transferRequest.getReceiverAccountNumber(), ipAddress);
				throw new UserApiException("Receiver account not found");
			}
			
			// ACCOUNT STATUS CHECK: Prevent transfers to inactive receiver accounts
			if (receiverAccount.getStatus() != com.tss.aml.entity.enums.AccountStatus.ACTIVE) {
				auditService.logFailure(AuditAction.TRANSFER_FUNDS, AuditResourceType.TRANSACTION, null, userId, null,
						"Transfer blocked - receiver account is " + receiverAccount.getStatus() + ": " + transferRequest.getReceiverAccountNumber(),
						ipAddress);
				throw new UserApiException("Cannot transfer to this account - receiver account is " + receiverAccount.getStatus());
			}

			// Handle currency conversion if needed
			CurrencyConversionResult conversionResult = null;
			BigDecimal finalAmount = transferRequest.getAmount();
			BigDecimal totalDeductionFromSender = transferRequest.getAmount();

			if (!senderAccount.getCurrency().equals(receiverAccount.getCurrency())) {
				logger.info("💱 Cross-currency transfer detected: {} {} → {} {}", transferRequest.getAmount(),
						senderAccount.getCurrency(), "?", receiverAccount.getCurrency());

				// Convert from sender currency to receiver currency
				conversionResult = currencyService.convertCurrency(senderAccount.getCurrency(),
						receiverAccount.getCurrency(), transferRequest.getAmount());

				// Calculate proper amounts: 
				// 1. Deduct original amount from sender (in sender currency)
				// 2. Calculate fee in sender currency (convert fee back from target currency)
				// 3. Deposit converted amount to receiver (in receiver currency)
				finalAmount = conversionResult.getConvertedAmount(); // Amount to deposit in receiver account
				
				// Convert fee back to sender currency for deduction
				BigDecimal feeInSenderCurrency;
				if (conversionResult.getConversionFee().compareTo(BigDecimal.ZERO) > 0) {
					// Convert fee from target currency back to sender currency
					CurrencyConversionResult feeConversion = currencyService.convertCurrency(
						receiverAccount.getCurrency(), senderAccount.getCurrency(), conversionResult.getConversionFee());
					feeInSenderCurrency = feeConversion.getConvertedAmount();
				} else {
					feeInSenderCurrency = BigDecimal.ZERO;
				}
				
				totalDeductionFromSender = transferRequest.getAmount().add(feeInSenderCurrency);

				logger.info("✅ Currency conversion: {} {} = {} {} (Fee: {} {})", transferRequest.getAmount(),
						senderAccount.getCurrency(), finalAmount, receiverAccount.getCurrency(),
						feeInSenderCurrency, senderAccount.getCurrency());
			}

			// Check if sender has sufficient balance (including conversion fee if applicable)
			if (senderAccount.getBalance().compareTo(totalDeductionFromSender) < 0) {
				String errorMsg;
				if (conversionResult != null) {
					BigDecimal feeInSenderCurrency = totalDeductionFromSender.subtract(transferRequest.getAmount());
					errorMsg = "Insufficient balance for transfer including conversion fee of " + feeInSenderCurrency + " " + senderAccount.getCurrency();
				} else {
					errorMsg = "Insufficient balance";
				}
				auditService.logFailure(AuditAction.TRANSFER_FUNDS, AuditResourceType.TRANSACTION, null, userId, null,
						errorMsg, ipAddress);
				throw new UserApiException(errorMsg);
			}

			// Create transaction
			Transaction transaction = new Transaction();
			transaction.setCustomer(senderAccount.getCustomer());
			transaction.setSenderAccountNumber(senderAccount.getAccountNumber());
			transaction.setAmount(finalAmount);
			transaction.setCurrency(receiverAccount.getCurrency());
			transaction.setDescription(transferRequest.getDescription());
			transaction.setTransactionType(TransactionType.TRANSFER);
			// Fetch country code from request or customer's country field
			String countryCode = transferRequest.getCountryCode();
			logger.info("🌍 Country code from request: {}", countryCode);
			
			if (countryCode == null || countryCode.trim().isEmpty()) {
				// Fallback to customer's country if available
				countryCode = senderAccount.getCustomer().getCountry();
				logger.info("🌍 Country code from customer.country: {}", countryCode);
				
				if (countryCode == null || countryCode.trim().isEmpty()) {
					// Default to sender's nationality-based country code
					String nationality = senderAccount.getCustomer().getNationality();
					countryCode = getCountryCodeFromNationality(nationality);
					logger.info("🌍 Country code from nationality '{}': {}", nationality, countryCode);
				}
			}
			
			logger.info("🌍 Final country code set for transaction: {}", countryCode);
			transaction.setCountryCode(countryCode);
			
			// Set counterparty (receiver) country code
			String counterpartyCountryCode = receiverAccount.getCustomer().getCountry();
			if (counterpartyCountryCode == null || counterpartyCountryCode.trim().isEmpty()) {
				// Fallback to receiver's nationality-based country code
				String receiverNationality = receiverAccount.getCustomer().getNationality();
				counterpartyCountryCode = getCountryCodeFromNationality(receiverNationality);
				logger.info("🌍 Counterparty country code from nationality '{}': {}", receiverNationality, counterpartyCountryCode);
			} else {
				logger.info("🌍 Counterparty country code from customer.country: {}", counterpartyCountryCode);
			}
			transaction.setCounterpartyCountryCode(counterpartyCountryCode);
			logger.info("🌐 Cross-border transaction: {} (sender) → {} (receiver)", countryCode, counterpartyCountryCode);
			
			transaction.setCounterpartyName(
					receiverAccount.getCustomer().getFirstName() + " " + receiverAccount.getCustomer().getLastName());
			transaction.setCounterpartyAccount(receiverAccount.getAccountNumber());

			// Set currency exchange reference if applicable
			if (conversionResult != null) {
				transaction.setCurrencyExchange(conversionResult.getCurrencyExchange());
			}

			// Process the transaction through AML rules
			transaction = processTransaction(transaction);

			// If transaction is approved, update balances
			if (transaction.getStatus() == TransactionStatus.COMPLETED) {
				// Deduct from sender (original amount + conversion fee if applicable)
				senderAccount.setBalance(senderAccount.getBalance().subtract(totalDeductionFromSender));
				// Add to receiver (converted amount)
				receiverAccount.setBalance(receiverAccount.getBalance().add(finalAmount));

				accountRepository.save(senderAccount);
				accountRepository.save(receiverAccount);

				auditService.logSuccess(AuditAction.TRANSFER_FUNDS, AuditResourceType.TRANSACTION,
						transaction.getTransactionId(), userId, null,
						"Transfer completed: " + transferRequest.getAmount() + " " + senderAccount.getCurrency(),
						ipAddress);
			} else {
				auditService.logAction(AuditAction.TRANSFER_FUNDS, AuditResourceType.TRANSACTION,
						transaction.getTransactionId(), userId, null,
						"Transfer " + transaction.getStatus().toString().toLowerCase() + ": "
								+ transferRequest.getAmount() + " " + senderAccount.getCurrency(),
						ipAddress, userAgent, AuditStatus.PENDING);
			}

			return transaction;

		} catch (Exception e) {
			auditService.logFailure(AuditAction.TRANSFER_FUNDS, AuditResourceType.TRANSACTION, null, userId, null,
					"Transfer failed: " + e.getMessage(), ipAddress);
			throw e;
		}
	}

	@Override
	public Transaction depositFunds(DepositRequest depositRequest, Long userId, String ipAddress, String userAgent) {
		try {
			// Find the account
			Account account = accountRepository.findByAccountNumber(depositRequest.getAccountNumber());
			if (account == null) {
				auditService.logFailure(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION, null, userId,
						null, "Deposit failed - account not found: " + depositRequest.getAccountNumber(), ipAddress);
				throw new UserApiException("Account not found");
			}

			// SECURITY CHECK: Verify that the logged-in user owns the account
			if (!account.getCustomer().getUserId().equals(userId)) {
				auditService.logFailure(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION, null, userId,
						null, "Unauthorized deposit attempt - user does not own account: "
								+ depositRequest.getAccountNumber(),
						ipAddress);
				throw new UserApiException("You are not authorized to deposit to this account");
			}
			
			// ACCOUNT STATUS CHECK: Prevent transactions from inactive accounts
			if (account.getStatus() != com.tss.aml.entity.enums.AccountStatus.ACTIVE) {
				auditService.logFailure(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION, null, userId, null,
						"Deposit blocked - account is " + account.getStatus() + ": " + depositRequest.getAccountNumber(),
						ipAddress);
				throw new UserApiException("This account is " + account.getStatus() + " and cannot perform transactions");
			}
			
			// KYC VERIFICATION CHECK: Ensure customer has at least one verified KYC document
			verifyCustomerKyc(userId);

			// Create deposit transaction
			Transaction transaction = new Transaction();
			transaction.setCustomer(account.getCustomer());
			transaction.setSenderAccountNumber("EXTERNAL"); // External deposit
			transaction.setAmount(depositRequest.getAmount());
			// Automatically fetch currency from account
			transaction.setCurrency(account.getCurrency());
			transaction.setDescription(depositRequest.getDescription());
			transaction.setTransactionType(TransactionType.CREDIT);
			// Fetch country code from request or customer's country field
			String countryCode = depositRequest.getCountryCode();
			if (countryCode == null || countryCode.trim().isEmpty()) {
				// Fallback to customer's country if available
				countryCode = account.getCustomer().getCountry();
				if (countryCode == null || countryCode.trim().isEmpty()) {
					// Default to customer's nationality-based country code
					countryCode = getCountryCodeFromNationality(account.getCustomer().getNationality());
				}
			}
			transaction.setCountryCode(countryCode);
			transaction.setCounterpartyName("External Deposit");
			transaction.setCounterpartyAccount(account.getAccountNumber());

			// Process through AML rules
			transaction = processTransaction(transaction);

			// If approved, update balance
			if (transaction.getStatus() == TransactionStatus.COMPLETED) {
				account.setBalance(account.getBalance().add(depositRequest.getAmount()));
				accountRepository.save(account);

				auditService.logSuccess(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION,
						transaction.getTransactionId(), userId, null,
						"Deposit completed: " + depositRequest.getAmount() + " " + account.getCurrency(),
						ipAddress);
			} else {
				auditService.logAction(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION,
						transaction.getTransactionId(), userId, null,
						"Deposit " + transaction.getStatus().toString().toLowerCase() + ": "
								+ depositRequest.getAmount() + " " + account.getCurrency(),
						ipAddress, userAgent, AuditStatus.PENDING);
			}

			return transaction;

		} catch (Exception e) {
			auditService.logFailure(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION, null, userId, null,
					"Deposit failed: " + e.getMessage(), ipAddress);
			throw e;
		}
	}

	@Override
	public Transaction withdrawFunds(WithdrawalRequest withdrawalRequest, Long userId, String ipAddress,
			String userAgent) {
		try {
			// Find the account
			Account account = accountRepository.findByAccountNumber(withdrawalRequest.getAccountNumber());
			if (account == null) {
				auditService.logFailure(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION, null, userId,
						null, "Withdrawal failed - account not found: " + withdrawalRequest.getAccountNumber(),
						ipAddress);
				throw new UserApiException("Account not found");
			}

			// SECURITY CHECK: Verify that the logged-in user owns the account
			if (!account.getCustomer().getUserId().equals(userId)) {
				auditService.logFailure(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION, null, userId,
						null, "Unauthorized withdrawal attempt - user does not own account: "
								+ withdrawalRequest.getAccountNumber(),
						ipAddress);
				throw new UserApiException("You are not authorized to withdraw from this account");
			}
			
			// ACCOUNT STATUS CHECK: Prevent transactions from inactive accounts
			if (account.getStatus() != com.tss.aml.entity.enums.AccountStatus.ACTIVE) {
				auditService.logFailure(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION, null, userId, null,
						"Withdrawal blocked - account is " + account.getStatus() + ": " + withdrawalRequest.getAccountNumber(),
						ipAddress);
				throw new UserApiException("This account is " + account.getStatus() + " and cannot perform transactions");
			}
			
			// KYC VERIFICATION CHECK: Ensure customer has at least one verified KYC document
			verifyCustomerKyc(userId);

			// Check sufficient balance
			if (account.getBalance().compareTo(withdrawalRequest.getAmount()) < 0) {
				auditService.logFailure(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION, null, userId,
						null, "Withdrawal failed - insufficient balance", ipAddress);
				throw new UserApiException("Insufficient balance");
			}

			// Create withdrawal transaction
			Transaction transaction = new Transaction();
			transaction.setCustomer(account.getCustomer());
			transaction.setSenderAccountNumber(account.getAccountNumber());
			transaction.setAmount(withdrawalRequest.getAmount());
			// Automatically fetch currency from account
			transaction.setCurrency(account.getCurrency());
			transaction.setDescription(withdrawalRequest.getDescription());
			transaction.setTransactionType(TransactionType.DEBIT);
			// Fetch country code from request or customer's country field
			String countryCode = withdrawalRequest.getCountryCode();
			if (countryCode == null || countryCode.trim().isEmpty()) {
				// Fallback to customer's country if available
				countryCode = account.getCustomer().getCountry();
				if (countryCode == null || countryCode.trim().isEmpty()) {
					// Default to customer's nationality-based country code
					countryCode = getCountryCodeFromNationality(account.getCustomer().getNationality());
				}
			}
			transaction.setCountryCode(countryCode);
			transaction.setCounterpartyName("External Withdrawal");
			transaction.setCounterpartyAccount("EXTERNAL");

			// Process through AML rules
			transaction = processTransaction(transaction);

			// If approved, update balance
			if (transaction.getStatus() == TransactionStatus.COMPLETED) {
				account.setBalance(account.getBalance().subtract(withdrawalRequest.getAmount()));
				accountRepository.save(account);

				auditService
						.logSuccess(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION,
								transaction.getTransactionId(), userId, null, "Withdrawal completed: "
										+ withdrawalRequest.getAmount() + " " + account.getCurrency(),
								ipAddress);
			} else {
				auditService.logAction(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION,
						transaction.getTransactionId(), userId, null,
						"Withdrawal " + transaction.getStatus().toString().toLowerCase() + ": "
								+ withdrawalRequest.getAmount() + " " + account.getCurrency(),
						ipAddress, userAgent, AuditStatus.PENDING);
			}

			return transaction;

		} catch (Exception e) {
			auditService.logFailure(AuditAction.TRANSACTION_CREATED, AuditResourceType.TRANSACTION, null, userId, null,
					"Withdrawal failed: " + e.getMessage(), ipAddress);
			throw e;
		}
	}

	// In TransactionServiceImpl.java
	public TransactionRepository getTransactionRepository() {
		return transactionRepository;
	}

	@Override
	public List<Transaction> getTransactionsByCustomerId(Long customerId) {
		return transactionRepository.findByCustomerUserIdOrderByTimestampDesc(customerId);
	}

//	@Override
//	public List<Transaction> getTransactionsByCustomerIdAndAccountNumber(Long customerId, String accountNumber) {
//		return transactionRepository.findByAccountNumber( accountNumber);
//	}

	@Override
	public Transaction getTransactionByIdAndCustomerId(Long transactionId, Long customerId) {
		return transactionRepository.findByTransactionIdAndCustomerUserId(transactionId, customerId);
	}

	@Override
	public List<Transaction> getTransactionsByCustomerIdAndStatus(Long customerId, List<TransactionStatus> statuses) {
		return transactionRepository.findByCustomerUserIdAndStatusInOrderByTimestampDesc(customerId, statuses);
	}

	@Override
	public TransactionCountDto getTransactionCountsByCustomerId(Long customerId) {
		List<Transaction> transactions = transactionRepository.findByCustomerUserIdOrderByTimestampDesc(customerId);

		long totalCount = transactions.size();
		long completedCount = transactions.stream().filter(t -> t.getStatus() == TransactionStatus.COMPLETED).count();
		long pendingCount = transactions.stream().filter(t -> t.getStatus() == TransactionStatus.PENDING).count();
		long flaggedCount = transactions.stream().filter(t -> t.getStatus() == TransactionStatus.FLAGGED).count();
		long blockedCount = transactions.stream().filter(t -> t.getStatus() == TransactionStatus.BLOCKED).count();

		return new TransactionCountDto(totalCount, completedCount, pendingCount, flaggedCount, blockedCount);
	}

	@Override
	public List<Transaction> getAllTransactions() {
		return transactionRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));
	}

	@Override
	public List<Transaction> getFlaggedTransactionsByCustomerId(Long customerId) {
		return transactionRepository.findByCustomerUserIdAndStatusInOrderByTimestampDesc(
				customerId, List.of(TransactionStatus.FLAGGED, TransactionStatus.BLOCKED));
	}

	/**
	 * Helper method to get country code from nationality
	 */
	private String getCountryCodeFromNationality(String nationality) {
		if (nationality == null) return "IN"; // Default to India

		switch (nationality.toLowerCase()) {
			case "indian": return "IN";
			case "american": return "US";
			case "british": return "GB";
			case "canadian": return "CA";
			case "australian": return "AU";
			case "german": return "DE";
			case "french": return "FR";
			case "japanese": return "JP";
			case "chinese": return "CN";
			case "singaporean": return "SG";
			case "emirati": return "AE";
			case "saudi": return "SA";
			default: return "IN"; // Default to India
		}
	}

	/**
	 * Helper method to check if customer has at least one verified KYC document
	 */
	private void verifyCustomerKyc(Long customerId) {
		long verifiedDocuments = kycDocumentRepository.countVerifiedDocumentsByCustomer(customerId);
		if (verifiedDocuments == 0) {
			throw new KycNotVerifiedException(
				"Cannot process transaction. You must have at least one verified KYC document before making transactions. Please upload and verify your documents first."
			);
		}
	}

	public void processFalsePositiveTransaction(Long transactionId) {
		logger.info("🔄 Processing false positive transaction: {}", transactionId);

		Transaction transaction = transactionRepository.findById(transactionId)
				.orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));

		// Only process if transaction was previously flagged/blocked
		if (transaction.getStatus() == TransactionStatus.FLAGGED || transaction.getStatus() == TransactionStatus.BLOCKED) {
			// Update transaction status to completed
			transaction.setStatus(TransactionStatus.COMPLETED);
			transactionRepository.save(transaction);

			logger.info("✅ False positive transaction status updated to COMPLETED: {}", transactionId);

			// Note: Balance updates are handled in ComplianceOfficerServiceImpl.processTransactionBalanceUpdate()
			// This separation allows for better transaction management and audit logging

		} else {
			logger.warn("⚠️ Transaction {} is not in FLAGGED/BLOCKED status, current status: {}",
					transactionId, transaction.getStatus());
		}
	}
}