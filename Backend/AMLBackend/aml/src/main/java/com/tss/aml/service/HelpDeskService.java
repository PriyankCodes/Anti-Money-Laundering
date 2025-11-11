package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.request.HelpDeskTicketRequest;
import com.tss.aml.entity.HelpDeskTicket;

public interface HelpDeskService {
    HelpDeskTicket createTicket(Long customerId, HelpDeskTicketRequest request);
    List<HelpDeskTicket> getCustomerTickets(Long customerId);
    HelpDeskTicket updateTicketDescription(Long ticketId, Long customerId, String description);
    
    /**
     * Get all tickets with optional status filter
     */
    List<HelpDeskTicket> getAllTickets(String status);
    
    /**
     * Get tickets assigned to a specific officer
     */
    List<HelpDeskTicket> getTicketsByAssignedOfficer(Long officerId);
    
    /**
     * Get ticket by ID
     */
    HelpDeskTicket getTicketById(Long ticketId);
    
    /**
     * Assign ticket to an officer
     */
    HelpDeskTicket assignTicket(Long ticketId, Long adminId);
    
    /**
     * Resolve a ticket
     */
    HelpDeskTicket resolveTicket(Long ticketId, String resolution);
    
    /**
     * Delete a ticket
     */
    void deleteTicket(Long ticketId);
    
    HelpDeskTicket updateTicketStatus(Long ticketId, String status, String resolution);
    
}
