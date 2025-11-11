package com.tss.aml.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.entity.AuditLog;
import com.tss.aml.entity.enums.AuditAction;
import com.tss.aml.entity.enums.AuditResourceType;
import com.tss.aml.repository.AuditLogRepository;
import com.tss.aml.service.AuditService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/admin/audit")
public class AuditController {

	@Autowired
	private AuditLogRepository auditLogRepository;

	@Autowired
	private AuditService auditService;

	@GetMapping("/logs")
	public ResponseEntity<List<AuditLog>> getAllAuditLogs(@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "50") int size, HttpServletRequest request) {

		String ipAddress = getClientIpAddress(request);

		// For simplicity, returning all logs. In production, implement pagination
		List<AuditLog> logs = auditLogRepository.findAll();

		auditService.logSuccess(AuditAction.DATA_VIEWED, AuditResourceType.AUDIT_LOG, null, null, null,
				"Audit logs viewed by admin", ipAddress);

		return ResponseEntity.ok(logs);
	}

	@GetMapping("/logs/user/{userId}")
	public ResponseEntity<List<AuditLog>> getAuditLogsByUser(@PathVariable Long userId, HttpServletRequest request) {

		String ipAddress = getClientIpAddress(request);

		List<AuditLog> logs = auditLogRepository.findByUserId(userId);

		auditService.logSuccess(AuditAction.DATA_VIEWED, AuditResourceType.AUDIT_LOG, null, null, null,
				"Audit logs viewed for user: " + userId, ipAddress);

		return ResponseEntity.ok(logs);
	}

	@GetMapping("/logs/action/{action}")
	public ResponseEntity<List<AuditLog>> getAuditLogsByAction(@PathVariable AuditAction action,
			HttpServletRequest request) {

		String ipAddress = getClientIpAddress(request);

		List<AuditLog> logs = auditLogRepository.findByAction(action);

		auditService.logSuccess(AuditAction.DATA_VIEWED, AuditResourceType.AUDIT_LOG, null, null, null,
				"Audit logs viewed for action: " + action, ipAddress);

		return ResponseEntity.ok(logs);
	}

	private String getClientIpAddress(HttpServletRequest request) {
		String xForwardedFor = request.getHeader("X-Forwarded-For");
		if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
			return xForwardedFor.split(",")[0].trim();
		}

		String xRealIp = request.getHeader("X-Real-IP");
		if (xRealIp != null && !xRealIp.isEmpty()) {
			return xRealIp;
		}

		return request.getRemoteAddr();
	}

}
