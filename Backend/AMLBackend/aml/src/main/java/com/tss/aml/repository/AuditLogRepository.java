package com.tss.aml.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.tss.aml.entity.AuditLog;
import com.tss.aml.entity.enums.AuditAction;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByUserId(Long userId, Pageable pageable);
    Page<AuditLog> findByAction(AuditAction action, Pageable pageable);
    
    // Non-paginated methods for simple queries
    List<AuditLog> findByUserId(Long userId);
    List<AuditLog> findByAction(AuditAction action);
    
    // Method for admin dashboard
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
}