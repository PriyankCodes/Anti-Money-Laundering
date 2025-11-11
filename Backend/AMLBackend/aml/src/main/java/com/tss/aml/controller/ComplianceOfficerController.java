package com.tss.aml.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.http.HttpStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.request.InvestigationActionRequest;
import com.tss.aml.dto.request.SarRequest;
import com.tss.aml.dto.request.UpdateSarRequest;
import com.tss.aml.dto.response.AlertResponseDto;
import com.tss.aml.dto.response.SarResponseDto;
import com.tss.aml.dto.response.TransactionResponseDto;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Sar;
import com.tss.aml.entity.User;
import com.tss.aml.repository.SarRepository;
import com.tss.aml.service.ComplianceOfficerService;
import com.tss.aml.service.TransactionService;

@RestController
@RequestMapping("/api/compliance")
@PreAuthorize("hasAnyRole('COMPLIANCE_OFFICER', 'ADMIN')")
public class ComplianceOfficerController {

	@Autowired
	private ComplianceOfficerService complianceService;

	@Autowired
	private TransactionService transactionService;

	@Autowired
	private com.tss.aml.service.HelpDeskService helpDeskService;

	@Autowired
	private SarRepository sarRepository;

	// === ALERTS ===
	@GetMapping("/alerts")
	public ResponseEntity<List<AlertResponseDto>> getAllAlerts() {
		List<AlertResponseDto> alerts = complianceService.getAllAlerts().stream().map(AlertResponseDto::new)
				.collect(Collectors.toList());
		return ResponseEntity.ok(alerts);
	}

	@PostMapping("/alerts/{alertId}/assign")
	public ResponseEntity<AlertResponseDto> assignAlert(@PathVariable Long alertId) {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || auth.getPrincipal() == null) {
			throw new RuntimeException("User not authenticated");
		}
		Long officerId = ((User) auth.getPrincipal()).getUserId();
		Alert alert = complianceService.assignAlertToOfficer(alertId, officerId);
		return ResponseEntity.ok(new AlertResponseDto(alert));
	}

	@GetMapping("/alerts/{alertId}")
	public ResponseEntity<AlertResponseDto> getAlertDetails(@PathVariable Long alertId) {
		Alert alert = complianceService.getAlertDetails(alertId);
		return ResponseEntity.ok(new AlertResponseDto(alert));
	}

	// === TRANSACTIONS ===
	@GetMapping("/transactions/all")
	public ResponseEntity<List<TransactionResponseDto>> getAllTransactions() {
		List<TransactionResponseDto> transactions = transactionService.getAllTransactions().stream()
				.map(TransactionResponseDto::new).collect(Collectors.toList());
		return ResponseEntity.ok(transactions);
	}

	@GetMapping("/customers/{customerId}/transactions")
	public ResponseEntity<List<TransactionResponseDto>> getCustomerTransactions(@PathVariable Long customerId) {
		List<TransactionResponseDto> transactions = complianceService.getCustomerTransactions(customerId).stream()
				.map(TransactionResponseDto::new).collect(Collectors.toList());
		return ResponseEntity.ok(transactions);
	}

	@GetMapping("/sars/{sarId}")
	public ResponseEntity<SarResponseDto> getSarById(@PathVariable Long sarId) {
		Sar sar = complianceService.getSarById(sarId);
		if (sar == null) {
			return ResponseEntity.notFound().build();
		}
		return ResponseEntity.ok(new SarResponseDto(sar));
	}

	// === INVESTIGATION ===
	@PostMapping("/alerts/{alertId}/action")
	public ResponseEntity<AlertResponseDto> takeAction(@PathVariable Long alertId,
			@RequestBody InvestigationActionRequest request) {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || auth.getPrincipal() == null) {
			throw new RuntimeException("User not authenticated");
		}
		Long officerId = ((User) auth.getPrincipal()).getUserId();
		Alert alert = complianceService.takeActionOnAlert(alertId, officerId, request);
		return ResponseEntity.ok(new AlertResponseDto(alert));
	}

	// === SAR ===
	@PostMapping("/alerts/{alertId}/sar")
	public ResponseEntity<SarResponseDto> generateSar(@PathVariable Long alertId, @RequestBody SarRequest request) {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		if (auth == null || auth.getPrincipal() == null) {
			throw new RuntimeException("User not authenticated");
		}
		Long officerId = ((User) auth.getPrincipal()).getUserId();
		Sar sar = complianceService.generateSar(alertId, officerId, request);
		return ResponseEntity.ok(new SarResponseDto(sar));
	}

	@PostMapping("/sars/{sarId}/submit")
	public ResponseEntity<SarResponseDto> submitSar(@PathVariable Long sarId) {
		Sar sar = complianceService.submitSar(sarId);
		return ResponseEntity.ok(new SarResponseDto(sar));
	}

	@PutMapping("/sars/{sarId}")
	public ResponseEntity<SarResponseDto> updateSar(@PathVariable Long sarId, @RequestBody UpdateSarRequest request) {
		Sar sar = complianceService.getSarById(sarId);

		if (sar == null) {
			return ResponseEntity.notFound().build();
		}

		// Update investigation notes - map 'summary' to 'summary' field
		if (request.getSummary() != null && !request.getSummary().isEmpty()) {
			sar.setSummary(request.getSummary());
		}

		// Update description if provided
		if (request.getDescription() != null && !request.getDescription().isEmpty()) {
			sar.setSummary(request.getDescription());
		}

		// Update updated_at timestamp
		// sar.set(java.time.LocalDateTime.now());

		// Save and return
		Sar savedSar = sarRepository.save(sar);
		return ResponseEntity.ok(new SarResponseDto(savedSar));
	}

	// === ENHANCED COMPLIANCE OFFICER ENDPOINTS ===
	@GetMapping("/alerts/status/{status}")
	public ResponseEntity<List<com.tss.aml.dto.response.AlertResponseDto>> getAlertsByStatus(
			@PathVariable com.tss.aml.entity.enums.AlertStatus status) {

		List<com.tss.aml.entity.Alert> alerts = complianceService.getAlertsByStatus(status);
		List<com.tss.aml.dto.response.AlertResponseDto> responses = alerts.stream().map(this::convertToAlertResponse)
				.collect(java.util.stream.Collectors.toList());

		return ResponseEntity.ok(responses);
	}

	@GetMapping("/alerts/risk-score")
	public ResponseEntity<List<com.tss.aml.dto.response.AlertResponseDto>> getAlertsByRiskScore(
			@RequestParam(defaultValue = "50") Integer minRiskScore,
			@RequestParam(defaultValue = "100") Integer maxRiskScore) {

		List<com.tss.aml.entity.Alert> alerts = complianceService.getAlertsByRiskScoreRange(minRiskScore, maxRiskScore);
		List<com.tss.aml.dto.response.AlertResponseDto> responses = alerts.stream().map(this::convertToAlertResponse)
				.collect(java.util.stream.Collectors.toList());

		return ResponseEntity.ok(responses);
	}

	@GetMapping("/sars")
	public ResponseEntity<List<SarResponseDto>> getAllSars() {
		List<com.tss.aml.entity.Sar> sars = complianceService.getAllSars();
		List<SarResponseDto> responses = sars.stream().map(SarResponseDto::new)
				.collect(java.util.stream.Collectors.toList());

		return ResponseEntity.ok(responses);
	}

	@GetMapping("/alerts/{alertId}/rules")
	public ResponseEntity<List<String>> getTriggeredRulesForAlert(@PathVariable Long alertId) {
		List<String> triggeredRules = complianceService.getTriggeredRulesForAlert(alertId);
		return ResponseEntity.ok(triggeredRules);
	}

	@GetMapping("/alerts/history/customer/{customerId}")
	public ResponseEntity<List<com.tss.aml.dto.response.AlertResponseDto>> getAlertHistoryByCustomer(
			@PathVariable Long customerId) {

		List<com.tss.aml.entity.Alert> alerts = complianceService.getAlertHistoryByCustomerId(customerId);
		List<com.tss.aml.dto.response.AlertResponseDto> responses = alerts.stream().map(this::convertToAlertResponse)
				.collect(java.util.stream.Collectors.toList());

		return ResponseEntity.ok(responses);
	}

	@GetMapping("/alerts/history/officer")
	public ResponseEntity<List<com.tss.aml.dto.response.AlertResponseDto>> getAlertHistoryByOfficer() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long officerId = ((User) auth.getPrincipal()).getUserId();

		List<com.tss.aml.entity.Alert> alerts = complianceService.getAlertHistoryByOfficerId(officerId);
		List<com.tss.aml.dto.response.AlertResponseDto> responses = alerts.stream().map(this::convertToAlertResponse)
				.collect(java.util.stream.Collectors.toList());

		return ResponseEntity.ok(responses);
	}

	// Helper method
	private com.tss.aml.dto.response.AlertResponseDto convertToAlertResponse(com.tss.aml.entity.Alert alert) {
		com.tss.aml.dto.response.AlertResponseDto response = new com.tss.aml.dto.response.AlertResponseDto();
		response.setAlertId(alert.getAlertId());
		response.setCustomerId(alert.getCustomer().getUserId());
		response.setCustomerName(alert.getCustomer().getFirstName() + " " + alert.getCustomer().getLastName());
		response.setTransactionId(alert.getTransaction() != null ? alert.getTransaction().getTransactionId() : null);
		response.setRuleTriggered(alert.getRuleTriggered());
		response.setRiskScore(alert.getRiskScore());
		response.setStatus(alert.getStatus());
		response.setInvestigationStatus(alert.getInvestigationStatus());
		response.setAssignedToOfficer(alert.getAssignedTo() != null ? alert.getAssignedTo().getEmail() : null);
		response.setAssignedOfficerName(alert.getAssignedTo() != null
				? alert.getAssignedTo().getFirstName() + " " + alert.getAssignedTo().getLastName()
				: null);
		response.setCreatedAt(alert.getCreatedAt());
		response.setUpdatedAt(alert.getUpdatedAt());
		return response;
	}

	// === OFFICER PROFILE MANAGEMENT ===
	@GetMapping("/profile")
	public ResponseEntity<com.tss.aml.dto.response.OfficerProfileResponseDto> getOfficerProfile() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long officerId = ((User) auth.getPrincipal()).getUserId();

		com.tss.aml.dto.response.OfficerProfileResponseDto profile = complianceService.getOfficerProfile(officerId);
		return ResponseEntity.ok(profile);
	}

	@PutMapping("/profile")
	public ResponseEntity<com.tss.aml.dto.response.OfficerProfileResponseDto> updateOfficerProfile(
			@RequestBody com.tss.aml.dto.request.OfficerProfileUpdateRequest request) {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		Long officerId = ((User) auth.getPrincipal()).getUserId();

		com.tss.aml.dto.response.OfficerProfileResponseDto updatedProfile = complianceService
				.updateOfficerProfile(officerId, request);
		return ResponseEntity.ok(updatedProfile);
	}

	@PostMapping("/profile/send-otp")
	public ResponseEntity<String> sendOfficerProfileUpdateOtp() {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();
		String email = ((User) auth.getPrincipal()).getEmail();

		complianceService.sendOfficerProfileUpdateOtp(email);
		return ResponseEntity.ok("OTP sent successfully to your email");
	}

	// === HELPDESK TICKETS ===
	@GetMapping("/helpdesk/tickets")
	public ResponseEntity<List<com.tss.aml.dto.response.HelpDeskTicketDto>> getAllHelpDeskTickets(
			@RequestParam(required = false) String status) {
		try {
			List<com.tss.aml.entity.HelpDeskTicket> tickets = helpDeskService.getAllTickets(status);
			List<com.tss.aml.dto.response.HelpDeskTicketDto> ticketDtos = tickets.stream().map(this::convertTicketToDto)
					.collect(Collectors.toList());
			return ResponseEntity.ok(ticketDtos);
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/helpdesk/tickets/my-tickets")
	public ResponseEntity<List<com.tss.aml.dto.response.HelpDeskTicketDto>> getMyTickets() {
		try {
			System.out.println("=== Getting My Tickets ===");
			Authentication auth = SecurityContextHolder.getContext().getAuthentication();
			System.out.println("Auth: " + auth);

			User user = (User) auth.getPrincipal();
			System.out.println("User: " + user);

			Long officerId = user.getUserId();
			System.out.println("Officer ID: " + officerId);

			List<com.tss.aml.entity.HelpDeskTicket> tickets = helpDeskService.getTicketsByAssignedOfficer(officerId);
			System.out.println("Found " + tickets.size() + " tickets");

			List<com.tss.aml.dto.response.HelpDeskTicketDto> ticketDtos = tickets.stream().map(ticket -> {
				System.out.println("Converting ticket: " + ticket.getTicketId());
				return this.convertTicketToDto(ticket);
			}).collect(Collectors.toList());

			System.out.println("Returning " + ticketDtos.size() + " ticket DTOs");
			return ResponseEntity.ok(ticketDtos);
		} catch (Exception e) {
			System.err.println("ERROR in getMyTickets: " + e.getMessage());
			e.printStackTrace();
			return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@GetMapping("/helpdesk/tickets/{ticketId}")
	public ResponseEntity<com.tss.aml.dto.response.HelpDeskTicketDto> getTicketById(@PathVariable Long ticketId) {
		try {
			com.tss.aml.entity.HelpDeskTicket ticket = helpDeskService.getTicketById(ticketId);
			return ResponseEntity.ok(convertTicketToDto(ticket));
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).build();
		}
	}

	@PostMapping("/helpdesk/tickets/{ticketId}/assign")
	public ResponseEntity<com.tss.aml.dto.response.HelpDeskTicketDto> assignHelpDeskTicket(@PathVariable Long ticketId,
			@RequestParam Long adminId) {
		try {
			com.tss.aml.entity.HelpDeskTicket ticket = helpDeskService.assignTicket(ticketId, adminId);
			return ResponseEntity.ok(convertTicketToDto(ticket));
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@DeleteMapping("/helpdesk/tickets/{ticketId}")
	public ResponseEntity<Void> deleteHelpDeskTicket(@PathVariable Long ticketId) {
		try {
			helpDeskService.deleteTicket(ticketId);
			return ResponseEntity.noContent().build();
		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	@PutMapping("/helpdesk/tickets/{ticketId}/status")
	public ResponseEntity<?> updateTicketStatus(@PathVariable Long ticketId,
			@RequestBody Map<String, String> statusUpdate) {
		try {
			String newStatus = statusUpdate.get("status");
			String resolution = statusUpdate.get("resolution"); // Optional, only for RESOLVED

			if (newStatus == null || newStatus.isEmpty()) {
				return ResponseEntity.badRequest().body(Map.of("error", "Status is required"));
			}

			com.tss.aml.entity.HelpDeskTicket ticket = helpDeskService.updateTicketStatus(ticketId, newStatus,
					resolution);

			return ResponseEntity.ok(convertTicketToDto(ticket));

		} catch (IllegalStateException e) {
			// Ticket is closed/resolved and cannot be changed
			return ResponseEntity.status(HttpStatus.SC_FORBIDDEN).body(Map.of("error", e.getMessage()));

		} catch (IllegalArgumentException e) {
			// Invalid status or missing resolution
			return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
					.body(Map.of("error", "An unexpected error occurred"));
		}
	}

// Keep the resolve endpoint for backward compatibility if needed
	@PostMapping("/helpdesk/tickets/{ticketId}/resolve")
	public ResponseEntity<?> resolveHelpDeskTicket(@PathVariable Long ticketId,
			@RequestBody Map<String, String> request) {
		try {
			String resolution = request.get("resolution");

			if (resolution == null || resolution.trim().isEmpty()) {
				return ResponseEntity.badRequest().body(Map.of("error", "Resolution is required"));
			}

			com.tss.aml.entity.HelpDeskTicket ticket = helpDeskService.updateTicketStatus(ticketId, "RESOLVED",
					resolution);

			return ResponseEntity.ok(convertTicketToDto(ticket));

		} catch (IllegalStateException e) {
			return ResponseEntity.status(HttpStatus.SC_FORBIDDEN).body(Map.of("error", e.getMessage()));

		} catch (Exception e) {
			e.printStackTrace();
			return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
					.body(Map.of("error", "An unexpected error occurred"));
		}
	}

// Helper method to convert Entity to DTO
	private com.tss.aml.dto.response.HelpDeskTicketDto convertTicketToDto(com.tss.aml.entity.HelpDeskTicket ticket) {
		com.tss.aml.dto.response.HelpDeskTicketDto dto = new com.tss.aml.dto.response.HelpDeskTicketDto();
		dto.setTicketId(ticket.getTicketId());
		dto.setCustomerId(ticket.getCustomerId());
		dto.setCustomerName(ticket.getCustomerName());
		dto.setSubject(ticket.getSubject());
		dto.setDescription(ticket.getDescription());
		dto.setStatus(ticket.getStatus());
		dto.setPriority(ticket.getPriority());
		dto.setAssignedToId(ticket.getAssignedToId());
		dto.setAlertId(ticket.getAlertId());
		dto.setResolution(ticket.getResolution());
		dto.setCreatedAt(ticket.getCreatedAt());
		dto.setUpdatedAt(ticket.getUpdatedAt());
		dto.setResolvedAt(ticket.getResolvedAt());
		return dto;
	}
}