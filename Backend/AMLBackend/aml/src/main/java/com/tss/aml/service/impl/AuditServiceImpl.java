package com.tss.aml.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.aml.entity.AuditLog;
import com.tss.aml.entity.enums.AuditAction;
import com.tss.aml.entity.enums.AuditResourceType;
import com.tss.aml.entity.enums.AuditStatus;
import com.tss.aml.repository.AuditLogRepository;
import com.tss.aml.service.AuditService;

@Service
public class AuditServiceImpl implements AuditService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Override
    public void logAction(AuditAction action, AuditResourceType resourceType, Long resourceId, 
                         Long userId, String username, String details, String ipAddress, String userAgent) {
        logAction(action, resourceType, resourceId, userId, username, details, ipAddress, userAgent, AuditStatus.SUCCESS);
    }

    @Override
    public void logAction(AuditAction action, AuditResourceType resourceType, Long resourceId, 
                         Long userId, String username, String details, String ipAddress, String userAgent, AuditStatus status) {
        // Provide default IP address if null to prevent database constraint violations
        String finalIpAddress = (ipAddress != null && !ipAddress.trim().isEmpty()) ? ipAddress : "0.0.0.0";
        
        AuditLog auditLog = new AuditLog(action, resourceType, resourceId, userId, username, details, finalIpAddress, userAgent);
        auditLog.setStatus(status);
        auditLogRepository.save(auditLog);
    }

    @Override
    public void logSuccess(AuditAction action, AuditResourceType resourceType, Long resourceId, 
                          Long userId, String username, String details, String ipAddress) {
        logAction(action, resourceType, resourceId, userId, username, details, ipAddress, null, AuditStatus.SUCCESS);
    }

    @Override
    public void logFailure(AuditAction action, AuditResourceType resourceType, Long resourceId, 
                          Long userId, String username, String details, String ipAddress) {
        logAction(action, resourceType, resourceId, userId, username, details, ipAddress, null, AuditStatus.FAILURE);
    }
}
