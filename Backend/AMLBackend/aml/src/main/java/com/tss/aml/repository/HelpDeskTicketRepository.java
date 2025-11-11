package com.tss.aml.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tss.aml.entity.HelpDeskTicket;
import com.tss.aml.entity.enums.TicketStatus;

@Repository
public interface HelpDeskTicketRepository extends JpaRepository<HelpDeskTicket, Long> {
    
    List<HelpDeskTicket> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    
    List<HelpDeskTicket> findByStatusOrderByCreatedAtDesc(TicketStatus status);
    
    List<HelpDeskTicket> findAllByOrderByCreatedAtDesc();
    
    List<HelpDeskTicket> findByAssignedToIdOrderByCreatedAtDesc(Long assignedToId);
    
    long countByStatus(TicketStatus status);
}
