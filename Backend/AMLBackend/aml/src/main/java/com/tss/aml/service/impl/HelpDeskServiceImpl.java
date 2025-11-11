package com.tss.aml.service.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.dto.request.HelpDeskTicketRequest;
import com.tss.aml.entity.Alert;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.HelpDeskTicket;
import com.tss.aml.entity.enums.TicketStatus;
import com.tss.aml.repository.AlertRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.HelpDeskTicketRepository;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.HelpDeskService;

@Service
@Transactional
public class HelpDeskServiceImpl implements HelpDeskService {

	@Autowired
	private HelpDeskTicketRepository helpDeskRepository;

	@Autowired
	private CustomerRepository customerRepository;

	@Autowired
	private AlertRepository alertRepository;

	@Override
	public HelpDeskTicket createTicket(Long customerId, HelpDeskTicketRequest request) {
		Customer customer = customerRepository.findById(customerId)
				.orElseThrow(() -> new RuntimeException("Customer not found"));

		// Validate that the alert exists and is assigned to an officer
		Alert alert = alertRepository.findById(request.getAlertId())
				.orElseThrow(() -> new RuntimeException("Alert not found with ID: " + request.getAlertId()));

		// Verify the alert belongs to this customer
		if (!alert.getCustomer().getUserId().equals(customer.getUserId())) {
			throw new RuntimeException("This alert does not belong to you");
		}

		// Verify the alert is assigned to an officer
		if (alert.getAssignedTo() == null) {
			throw new RuntimeException(
					"Cannot create ticket for unassigned alert. Please wait for an officer to be assigned.");
		}

		HelpDeskTicket ticket = new HelpDeskTicket();
		ticket.setCustomerId(customer.getUserId());
		ticket.setCustomerName(customer.getFirstName() + " " + customer.getLastName());
		ticket.setSubject(request.getSubject());
		ticket.setDescription(request.getDescription());
		ticket.setPriority(request.getPriority());
		ticket.setAlertId(alert.getAlertId());
		ticket.setAssignedToId(alert.getAssignedTo().getUserId());
		ticket.setStatus(TicketStatus.IN_PROGRESS);

		System.out.println("✅ Created ticket for alert ID: " + alert.getAlertId() + ", assigned to officer: "
				+ alert.getAssignedTo().getUserId());

		return helpDeskRepository.save(ticket);
	}

	@Override
	public List<HelpDeskTicket> getCustomerTickets(Long customerId) {
		return helpDeskRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
	}

	@Override
	public HelpDeskTicket updateTicketDescription(Long ticketId, Long customerId, String description) {
		HelpDeskTicket ticket = helpDeskRepository.findById(ticketId)
				.orElseThrow(() -> new RuntimeException("Ticket not found"));

		if (!ticket.getCustomerId().equals(customerId)) {
			throw new RuntimeException("Unauthorized to update this ticket");
		}

		ticket.setDescription(description);

		return helpDeskRepository.save(ticket);
	}

	@Override
	public List<HelpDeskTicket> getAllTickets(String status) {
		if (status != null && !status.isEmpty()) {
			TicketStatus ticketStatus = TicketStatus.valueOf(status.toUpperCase());
			return helpDeskRepository.findByStatusOrderByCreatedAtDesc(ticketStatus);
		}
		return helpDeskRepository.findAllByOrderByCreatedAtDesc();
	}

	@Override
	public List<HelpDeskTicket> getTicketsByAssignedOfficer(Long officerId) {
		return helpDeskRepository.findByAssignedToIdOrderByCreatedAtDesc(officerId);
	}

	@Override
	public HelpDeskTicket getTicketById(Long ticketId) {
		return helpDeskRepository.findById(ticketId)
				.orElseThrow(() -> new RuntimeException("Ticket not found with id: " + ticketId));
	}

	@Override
	public HelpDeskTicket assignTicket(Long ticketId, Long adminId) {
		HelpDeskTicket ticket = getTicketById(ticketId);

		ticket.setAssignedToId(adminId);
		ticket.setStatus(TicketStatus.IN_PROGRESS);

		return helpDeskRepository.save(ticket);
	}

	@Override
	public HelpDeskTicket updateTicketStatus(Long ticketId, String status, String resolution) {
		HelpDeskTicket ticket = getTicketById(ticketId);

		// Prevent any changes if ticket is already CLOSED or RESOLVED
		if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.RESOLVED) {
			throw new IllegalStateException("Cannot change status of a closed or resolved ticket");
		}

		// Parse new status
		TicketStatus newStatus;
		try {
			newStatus = TicketStatus.valueOf(status.toUpperCase());
		} catch (IllegalArgumentException e) {
			throw new IllegalArgumentException("Invalid status: " + status);
		}

		// Handle status transitions with business logic
		switch (newStatus) {
		case OPEN:
			// Can reopen from any non-closed/resolved state
			ticket.setStatus(TicketStatus.OPEN);
			break;

		case ASSIGNED:
			// Assign ticket (usually from OPEN)
			ticket.setStatus(TicketStatus.ASSIGNED);
			break;

		case IN_PROGRESS:
			// Start working on ticket
			ticket.setStatus(TicketStatus.IN_PROGRESS);
			break;

		case RESOLVED:
			// Resolve ticket - requires resolution message
			if (resolution == null || resolution.trim().isEmpty()) {
				throw new IllegalArgumentException("Resolution message is required when resolving a ticket");
			}
			ticket.setStatus(TicketStatus.RESOLVED);
			ticket.setResolution(resolution);
			ticket.setResolvedAt(LocalDateTime.now());
			break;

		case CLOSED:
			// Close ticket - can be done from any state
			ticket.setStatus(TicketStatus.CLOSED);
			if (ticket.getResolvedAt() == null) {
				ticket.setResolvedAt(LocalDateTime.now());
			}
			break;

		default:
			throw new IllegalArgumentException("Unsupported status: " + status);
		}

		return helpDeskRepository.save(ticket);
	}

	@Override
	public HelpDeskTicket resolveTicket(Long ticketId, String resolution) {
		HelpDeskTicket ticket = getTicketById(ticketId);

		// Prevent resolving if already closed or resolved
		if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.RESOLVED) {
			throw new IllegalStateException("Cannot resolve a closed or resolved ticket");
		}

		ticket.setResolution(resolution);
		ticket.setStatus(TicketStatus.RESOLVED);
		ticket.setResolvedAt(LocalDateTime.now());

		return helpDeskRepository.save(ticket);
	}

	@Override
	public void deleteTicket(Long ticketId) {
		HelpDeskTicket ticket = getTicketById(ticketId);
		helpDeskRepository.delete(ticket);
	}
}
