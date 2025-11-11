package com.tss.aml.entity;

import java.time.LocalDateTime;

import com.tss.aml.entity.enums.TicketPriority;
import com.tss.aml.entity.enums.TicketStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "helpdesk_tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HelpDeskTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ticketId;

    @NotNull
    @Column(name = "customer_id")
    private Long customerId;
    
    @NotNull
    @Column(name = "customer_name")
    private String customerName;

    @NotNull
    @Column(length = 200)
    private String subject;

    @NotNull
    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @NotNull
    private TicketStatus status = TicketStatus.OPEN;

    @Enumerated(EnumType.STRING)
    @NotNull
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Column(name = "assigned_to_id")
    private Long assignedToId;
    
    @Column(name = "alert_id")
    private Long alertId;

    @Column(columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
