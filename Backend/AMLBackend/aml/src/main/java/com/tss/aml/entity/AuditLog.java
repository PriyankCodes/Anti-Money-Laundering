package com.tss.aml.entity;

import java.time.LocalDateTime;

import com.tss.aml.entity.enums.AuditAction;
import com.tss.aml.entity.enums.AuditResourceType;
import com.tss.aml.entity.enums.AuditStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "audit_logs")

public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private AuditAction action; // e.g., LOGIN, REGISTER, TRANSFER_FUNDS, etc.

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private AuditResourceType resourceType; // e.g., USER, TRANSACTION, ACCOUNT, etc.

    private Long resourceId; // ID of the affected resource

    private Long userId; // Who performed the action (User ID)

    @Column(length = 100)
    private String username; // Username for easier identification

    @Lob
    private String details; // JSON or descriptive text of what changed

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 1000)
    private String userAgent; // Browser/client information

    @Enumerated(EnumType.STRING)
    private AuditStatus status = AuditStatus.SUCCESS; // SUCCESS, FAILURE, PENDING

    private LocalDateTime timestamp = LocalDateTime.now();

    // Constructors
    public AuditLog() {}

    public AuditLog(AuditAction action, AuditResourceType resourceType, Long resourceId, 
                    Long userId, String username, String details, String ipAddress, String userAgent) {
        this.action = action;
        this.resourceType = resourceType;
        this.resourceId = resourceId;
        this.userId = userId;
        this.username = username;
        this.details = details;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    // Getters & Setters
    public Long getLogId() { return logId; }
    public AuditAction getAction() { return action; }
    public void setAction(AuditAction action) { this.action = action; }
    public AuditResourceType getResourceType() { return resourceType; }
    public void setResourceType(AuditResourceType resourceType) { this.resourceType = resourceType; }
    public Long getResourceId() { return resourceId; }
    public void setResourceId(Long resourceId) { this.resourceId = resourceId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public AuditStatus getStatus() { return status; }
    public void setStatus(AuditStatus status) { this.status = status; }
    public LocalDateTime getTimestamp() { return timestamp; }
}