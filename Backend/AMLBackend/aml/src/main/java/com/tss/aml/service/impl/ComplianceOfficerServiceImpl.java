package com.tss.aml.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.dto.request.InvestigationActionRequest;
import com.tss.aml.dto.request.SarRequest;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.ComplianceOfficer;
import com.tss.aml.entity.Sar;
import com.tss.aml.entity.Sar.SarStatus;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.AlertStatus;
import com.tss.aml.entity.enums.AuditAction;
import com.tss.aml.entity.enums.AuditResourceType;
import com.tss.aml.entity.enums.TransactionStatus;
import com.tss.aml.entity.enums.UserRole;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.ComplianceOfficerRepository;
import com.tss.aml.repository.SarRepository;
import com.tss.aml.repository.TransactionRepository;
import com.tss.aml.service.AuditService;
import com.tss.aml.service.ComplianceOfficerService;

@Service
@Transactional
public class ComplianceOfficerServiceImpl implements ComplianceOfficerService {

	@Autowired
	private AlertRepository alertRepo;

	@Autowired
	private ComplianceOfficerRepository officerRepo;

	@Autowired
	private TransactionRepository transactionRepo;

	@Autowired
	private SarRepository sarRepo;

	@Autowired
	private com.tss.aml.repository.AccountRepository accountRepository;

	@Autowired
	private com.tss.aml.service.OtpService otpService;

	@Autowired
	private com.tss.aml.service.EmailService emailService;

	@Autowired
	private AuditService auditService;
	
	@Autowired
	private com.tss.aml.repository.HelpDeskTicketRepository helpDeskTicketRepository;

	// === ALERTS ===
	@Override
	public List<Alert> getAllAlerts() {
		return alertRepo.findAll();
	}

	@Override
	public Alert assignAlertToOfficer(Long alertId, Long officerId) {
		Alert alert = alertRepo.findById(alertId).orElseThrow(() -> new RuntimeException("Alert not found"));
		ComplianceOfficer officer = officerRepo.findById(officerId)
				.orElseThrow(() -> new RuntimeException("Officer not found"));
		alert.setAssignedTo(officer);
		alert.setInvestigationStatus(Alert.InvestigationStatus.INVESTIGATING);
		alert.setStatus(AlertStatus.INVESTIGATING); // Automatically change status to INVESTIGATING when officer assigns themselves
		alert.setUpdatedAt(LocalDateTime.now()); // Update timestamp
		
		// Auto-assign related tickets to the same officer
		try {
			Long customerId = alert.getCustomer().getUserId();
			List<com.tss.aml.entity.HelpDeskTicket> customerTickets = 
				helpDeskTicketRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
			
			if (customerTickets != null && !customerTickets.isEmpty()) {
				for (com.tss.aml.entity.HelpDeskTicket ticket : customerTickets) {
					// Only assign if ticket is not already assigned
					if (ticket.getAssignedToId() == null) {
						ticket.setAssignedToId(officer.getUserId());
						ticket.setStatus(com.tss.aml.entity.enums.TicketStatus.IN_PROGRESS);
						helpDeskTicketRepository.save(ticket);
						System.out.println("Auto-assigned ticket " + ticket.getTicketId() + " to officer " + officer.getUserId());
					}
				}
			}
		} catch (Exception e) {
			System.err.println("Error auto-assigning tickets when alert assigned: " + e.getMessage());
			// Continue even if ticket assignment fails
		}
		
		return alertRepo.save(alert);
	}

	@Override
	public Alert getAlertDetails(Long alertId) {
		return alertRepo.findById(alertId).orElseThrow(() -> new RuntimeException("Alert not found"));
	}

	@Override
	public List<Transaction> getCustomerTransactions(Long customerId) {
		return transactionRepo.findByCustomerUserId(customerId);
	}

	// === INVESTIGATION ===
	@Override
	public Alert takeActionOnAlert(Long alertId, Long officerId, InvestigationActionRequest request) {
		Alert alert = alertRepo.findById(alertId).orElseThrow(() -> new RuntimeException("Alert not found"));
		ComplianceOfficer officer = officerRepo.findById(officerId)
				.orElseThrow(() -> new RuntimeException("Officer not found"));

		ComplianceOfficer assignedOfficer = alert.getAssignedTo();
		if (assignedOfficer != null && !officer.getUserId().equals(assignedOfficer.getUserId())
				&& !officer.getRole().equals(UserRole.ADMIN)) {
			throw new RuntimeException("Not authorized...");
		}

		// Log incoming request for debugging
		System.out.println("🔍 Alert Action Request - Action: " + request.getAction() + ", Decision: " + request.getDecision());
		
		// Map user-friendly action to internal decision if action is provided
		String decisionValue = request.getDecision();
		
		// If decision is not provided, try to map from action field
		if (decisionValue == null || decisionValue.trim().isEmpty()) {
			if (request.getAction() != null && !request.getAction().trim().isEmpty()) {
				decisionValue = mapActionToDecision(request.getAction());
			}
		}
		
		if (decisionValue == null || decisionValue.trim().isEmpty()) {
			throw new IllegalArgumentException("Either 'action' or 'decision' field must be provided. Valid actions: APPROVE, REJECT, ESCALATE, INVESTIGATE");
		}

		Alert.InvestigationStatus investigationStatus;
		try {
			investigationStatus = Alert.InvestigationStatus.valueOf(decisionValue.toUpperCase());
		} catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("Invalid decision/action value: " + decisionValue + 
				". Valid values: TRUE_POSITIVE, FALSE_POSITIVE, ESCALATED, INVESTIGATING, PENDING (or use action field with: APPROVE, REJECT, ESCALATE, INVESTIGATE)");
		}
		
		alert.setInvestigationStatus(investigationStatus);

		// Update alert status based on investigation decision
		Transaction transaction = alert.getTransaction();
		
		if (investigationStatus == Alert.InvestigationStatus.TRUE_POSITIVE) {
			alert.setStatus(AlertStatus.TRUE_POSITIVE);
			transaction.setStatus(TransactionStatus.BLOCKED);
		} else if (investigationStatus == Alert.InvestigationStatus.FALSE_POSITIVE) {
			alert.setStatus(AlertStatus.FALSE_POSITIVE);
			transaction.setStatus(TransactionStatus.COMPLETED);
			
			// IMPORTANT: Process the actual money transfer when approving
			processTransactionBalanceUpdate(transaction);
		} else if (investigationStatus == Alert.InvestigationStatus.ESCALATED) {
			alert.setStatus(AlertStatus.ESCALATED);
		} else if (investigationStatus == Alert.InvestigationStatus.INVESTIGATING) {
			alert.setStatus(AlertStatus.INVESTIGATING);
		} else {
			alert.setStatus(AlertStatus.INVESTIGATING);
		}

		// Auto-generate SAR if true positive
		if (investigationStatus == Alert.InvestigationStatus.TRUE_POSITIVE && request.getSarSummary() != null) {
			Sar sar = new Sar(alert, officer, request.getSarSummary());
			sarRepo.save(sar);
		}

		return alertRepo.save(alert);
	}

	// === SAR ===
	@Override
	public Sar generateSar(Long alertId, Long officerId, SarRequest request) {
		Alert alert = alertRepo.findById(alertId).orElseThrow(() -> new RuntimeException("Alert not found"));
		
		// Check if SAR already exists for this alert
		if (sarRepo.existsByAlert_AlertId(alertId)) {
			throw new RuntimeException("A SAR has already been generated for this alert. Only one SAR can be created per alert.");
		}
		
		ComplianceOfficer officer = officerRepo.findById(officerId)
				.orElseThrow(() -> new RuntimeException("Officer not found"));
		Sar sar = new Sar(alert, officer, request.getSummary());
		return sarRepo.save(sar);
	}

	@Override
	public Sar submitSar(Long sarId) {
		Sar sar = sarRepo.findById(sarId).orElseThrow(() -> new RuntimeException("SAR not found"));
		sar.setSubmittedAt(LocalDateTime.now());
		sar.setStatus(SarStatus.SUBMITTED);
		return sarRepo.save(sar);
	}

	// New methods for enhanced compliance officer endpoints
	@Override
	public List<Alert> getAlertsByStatus(AlertStatus status) {
		return alertRepo.findByStatusOrderByCreatedAtDesc(status);
	}

	@Override
	public List<Alert> getAlertsByRiskScoreRange(Integer minRiskScore, Integer maxRiskScore) {
		return alertRepo.findByRiskScoreBetweenOrderByRiskScoreDesc(minRiskScore, maxRiskScore);
	}

	@Override
	public List<Sar> getAllSars() {
		return sarRepo.findAllByOrderByCreatedAtDesc();
	}

	@Override
	public List<String> getTriggeredRulesForAlert(Long alertId) {
		Alert alert = alertRepo.findById(alertId).orElseThrow(() -> new RuntimeException("Alert not found"));

		String ruleTriggered = alert.getRuleTriggered();
		if (ruleTriggered != null && !ruleTriggered.isEmpty()) {
			return List.of(ruleTriggered.split("[,;]"));
		}
		return List.of();
	}

	@Override
	public List<Alert> getAlertHistoryByCustomerId(Long customerId) {
		return alertRepo.findByCustomerUserIdOrderByCreatedAtDesc(customerId);
	}

	@Override
	public List<Alert> getAlertHistoryByOfficerId(Long officerId) {
		return alertRepo.findByAssignedToUserIdOrderByCreatedAtDesc(officerId);
	}

	@Override
	public com.tss.aml.dto.response.OfficerProfileResponseDto getOfficerProfile(Long officerId) {
		ComplianceOfficer officer = officerRepo.findById(officerId)
				.orElseThrow(() -> new RuntimeException("Officer not found"));

		com.tss.aml.dto.response.OfficerProfileResponseDto dto = new com.tss.aml.dto.response.OfficerProfileResponseDto();
		dto.setOfficerId(officer.getUserId());
		dto.setFirstName(officer.getFirstName());
		dto.setLastName(officer.getLastName());
		dto.setEmail(officer.getEmail());
		dto.setPhoneNumber(officer.getPhone());

		dto.setStatus(officer.getStatus());
		dto.setCreatedAt(officer.getCreatedAt());
		dto.setLastLoginAt(officer.getLastLogin());

		return dto;
	}

	@Override
	public com.tss.aml.dto.response.OfficerProfileResponseDto updateOfficerProfile(Long officerId,
			com.tss.aml.dto.request.OfficerProfileUpdateRequest request) {
		// Verify OTP first
		if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
			throw new RuntimeException("Invalid OTP");
		}

		ComplianceOfficer officer = officerRepo.findById(officerId)
				.orElseThrow(() -> new RuntimeException("Officer not found"));

		if (request.getFirstName() != null) {
			officer.setFirstName(request.getFirstName());
		}
		if (request.getLastName() != null) {
			officer.setLastName(request.getLastName());
		}
		if (request.getPhoneNumber() != null) {
			officer.setPhone(request.getPhoneNumber());
		}

		officer = officerRepo.save(officer);
		return getOfficerProfile(officer.getUserId());
	}

	@Override
	public void sendOfficerProfileUpdateOtp(String email) {
		String otp = otpService.generateOtp(email);
		emailService.sendOtpEmail(email, otp);
	}

	@Override
	public void sendProfileUpdateOtp(String email) {
		String otp = otpService.generateOtp(email);
		emailService.sendOtpEmail(email, otp);
	}
	
	/**
	 * Helper method to map user-friendly action names to internal decision values
	 */
	private String mapActionToDecision(String action) {
		if (action == null) {
			return null;
		}
		
		switch (action.toUpperCase()) {
			case "APPROVE":
				return "FALSE_POSITIVE"; // Approve = transaction is legitimate
			case "REJECT":
			case "BLOCK":
				return "TRUE_POSITIVE"; // Reject/Block = transaction is suspicious
			case "ESCALATE":
				return "ESCALATED"; // Escalate for further review
			case "INVESTIGATE":
				return "INVESTIGATING"; // Keep under investigation
			default:
				throw new IllegalArgumentException("Invalid action: " + action + ". Valid actions are: APPROVE, REJECT, ESCALATE, INVESTIGATE");
		}
	}
	
	/**
	 * Process the actual balance updates when a flagged transaction is approved (FALSE_POSITIVE)
	 * This method handles all transaction types and updates account balances accordingly
	 */
	private void processTransactionBalanceUpdate(Transaction transaction) {
		System.out.println("💰 Processing balance update for approved transaction: " + transaction.getTransactionId());
		
		String senderAccNumber = transaction.getSenderAccountNumber();
		String counterpartyAccNumber = transaction.getCounterpartyAccount();
		
		try {
			// Handle different transaction types
			switch (transaction.getTransactionType()) {
				case TRANSFER:
					// Transfer: Deduct from sender, add to receiver
					if (senderAccNumber != null && !senderAccNumber.equals("EXTERNAL")) {
						com.tss.aml.entity.Account senderAccount = accountRepository.findByAccountNumber(senderAccNumber);
						if (senderAccount == null) {
							throw new RuntimeException("Sender account not found: " + senderAccNumber);
						}
						
						// Check sufficient balance before deducting
						if (senderAccount.getBalance().compareTo(transaction.getAmount()) < 0) {
							throw new RuntimeException("Insufficient balance in sender account: " + senderAccNumber + 
								". Available: " + senderAccount.getBalance() + ", Required: " + transaction.getAmount());
						}
						
						senderAccount.setBalance(senderAccount.getBalance().subtract(transaction.getAmount()));
						accountRepository.save(senderAccount);
						System.out.println("✅ Debited " + transaction.getAmount() + " " + transaction.getCurrency() + " from account: " + senderAccNumber);
						
						// Log audit trail for debit
						auditService.logSuccess(AuditAction.TRANSACTION_UPDATED, AuditResourceType.ACCOUNT,
							senderAccount.getAccountId(), null, null, 
							"Balance debited for false positive transaction: " + transaction.getTransactionId() + 
							", Amount: " + transaction.getAmount() + " " + transaction.getCurrency(),
							"SYSTEM");
					}
					
					if (counterpartyAccNumber != null && !counterpartyAccNumber.equals("EXTERNAL")) {
						com.tss.aml.entity.Account receiverAccount = accountRepository.findByAccountNumber(counterpartyAccNumber);
						if (receiverAccount == null) {
							throw new RuntimeException("Receiver account not found: " + counterpartyAccNumber);
						}
						
						receiverAccount.setBalance(receiverAccount.getBalance().add(transaction.getAmount()));
						accountRepository.save(receiverAccount);
						System.out.println("✅ Credited " + transaction.getAmount() + " " + transaction.getCurrency() + " to account: " + counterpartyAccNumber);
						
						// Log audit trail for credit
						auditService.logSuccess(AuditAction.TRANSACTION_UPDATED, AuditResourceType.ACCOUNT,
							receiverAccount.getAccountId(), null, null, 
							"Balance credited for false positive transaction: " + transaction.getTransactionId() + 
							", Amount: " + transaction.getAmount() + " " + transaction.getCurrency(),
							"SYSTEM");
					}
					break;
					
				case CREDIT:
					// Credit/Deposit: Add to account
					if (counterpartyAccNumber != null && !counterpartyAccNumber.equals("EXTERNAL")) {
						com.tss.aml.entity.Account account = accountRepository.findByAccountNumber(counterpartyAccNumber);
						if (account == null) {
							throw new RuntimeException("Account not found: " + counterpartyAccNumber);
						}
						
						account.setBalance(account.getBalance().add(transaction.getAmount()));
						accountRepository.save(account);
						System.out.println("✅ Deposited " + transaction.getAmount() + " " + transaction.getCurrency() + " to account: " + counterpartyAccNumber);
						
						// Log audit trail for deposit
						auditService.logSuccess(AuditAction.TRANSACTION_UPDATED, AuditResourceType.ACCOUNT,
							account.getAccountId(), null, null, 
							"Balance deposited for false positive transaction: " + transaction.getTransactionId() + 
							", Amount: " + transaction.getAmount() + " " + transaction.getCurrency(),
							"SYSTEM");
					}
					break;
					
				case DEBIT:
					// Debit/Withdrawal: Deduct from account
					if (senderAccNumber != null && !senderAccNumber.equals("EXTERNAL")) {
						com.tss.aml.entity.Account account = accountRepository.findByAccountNumber(senderAccNumber);
						if (account == null) {
							throw new RuntimeException("Account not found: " + senderAccNumber);
						}
						
						// Check sufficient balance before deducting
						if (account.getBalance().compareTo(transaction.getAmount()) < 0) {
							throw new RuntimeException("Insufficient balance in account: " + senderAccNumber + 
								". Available: " + account.getBalance() + ", Required: " + transaction.getAmount());
						}
						
						account.setBalance(account.getBalance().subtract(transaction.getAmount()));
						accountRepository.save(account);
						System.out.println("✅ Withdrew " + transaction.getAmount() + " " + transaction.getCurrency() + " from account: " + senderAccNumber);
						
						// Log audit trail for withdrawal
						auditService.logSuccess(AuditAction.TRANSACTION_UPDATED, AuditResourceType.ACCOUNT,
							account.getAccountId(), null, null, 
							"Balance withdrawn for false positive transaction: " + transaction.getTransactionId() + 
							", Amount: " + transaction.getAmount() + " " + transaction.getCurrency(),
							"SYSTEM");
					}
					break;
					
				default:
					System.out.println("⚠️ Unknown transaction type: " + transaction.getTransactionType());
					auditService.logFailure(AuditAction.TRANSACTION_UPDATED, AuditResourceType.TRANSACTION,
						transaction.getTransactionId(), null, null, 
						"Unknown transaction type for false positive processing: " + transaction.getTransactionType(),
						"SYSTEM");
			}
			
			// Log successful completion
			auditService.logSuccess(AuditAction.TRANSACTION_UPDATED, AuditResourceType.TRANSACTION,
				transaction.getTransactionId(), null, null, 
				"Balance update completed for false positive transaction: " + transaction.getTransactionId() + 
				", Type: " + transaction.getTransactionType() + ", Amount: " + transaction.getAmount() + " " + transaction.getCurrency(),
				"SYSTEM");
			
			System.out.println("💰 Balance update completed successfully for transaction: " + transaction.getTransactionId());
			
		} catch (Exception e) {
			System.err.println("❌ Error processing balance update for transaction " + transaction.getTransactionId() + ": " + e.getMessage());
			
			// Log audit trail for failed balance update
			auditService.logFailure(AuditAction.TRANSACTION_UPDATED, AuditResourceType.TRANSACTION,
				transaction.getTransactionId(), null, null, 
				"Failed to update balance for false positive transaction: " + e.getMessage(),
				"SYSTEM");
			
			// Revert transaction status back to FLAGGED if balance update fails
			transaction.setStatus(TransactionStatus.FLAGGED);
			transactionRepo.save(transaction);
			
			throw new RuntimeException("Failed to process balance update for transaction " + 
				transaction.getTransactionId() + ": " + e.getMessage(), e);
		}
	}

	@Override
	public Sar getSarById(Long sarId) {
	    return sarRepo.findById(sarId)
	        .orElseThrow(() -> new RuntimeException("SAR not found with ID: " + sarId));
	}
}