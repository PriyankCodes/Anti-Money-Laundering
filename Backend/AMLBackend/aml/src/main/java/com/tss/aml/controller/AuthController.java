package com.tss.aml.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tss.aml.dto.request.ChangePasswordRequest;
import com.tss.aml.dto.request.ForgotPasswordRequest;
import com.tss.aml.dto.request.LoginRequest;
import com.tss.aml.dto.request.RegisterRequest;
import com.tss.aml.dto.request.ResetPasswordWithOtpRequest;
import com.tss.aml.dto.request.VerifyOtpRequest;
import com.tss.aml.dto.response.AuthResponse;
import com.tss.aml.entity.ComplianceOfficer;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.User;
import com.tss.aml.entity.enums.AuditAction;
import com.tss.aml.entity.enums.AuditResourceType;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.AuditService;
import com.tss.aml.service.AuthService;
import com.tss.aml.service.PasswordResetService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

	@Autowired
	private AuthService authService;

	@Autowired
	private AuditService auditService;

	@Autowired
	private PasswordResetService passwordResetService;

	@Autowired
	private UserRepository userRepository;

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
			HttpServletRequest httpRequest) {
		String ipAddress = getClientIpAddress(httpRequest);
		try {
			AuthResponse response = authService.register(request);
			auditService.logSuccess(AuditAction.REGISTER, AuditResourceType.USER, null, null, request.getEmail(),
					"User registration successful", ipAddress);
			return ResponseEntity.status(HttpStatus.CREATED).body(response);
		} catch (Exception e) {
			auditService.logFailure(AuditAction.REGISTER, AuditResourceType.USER, null, null, request.getEmail(),
					"User registration failed: " + e.getMessage(), ipAddress);
			throw e;
		}
	}

	@PostMapping("/verify-otp")
	public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
		AuthResponse response = authService.VerifyOtpRequest(request);
		return ResponseEntity.ok(response);
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
			HttpServletRequest httpRequest) {
		String ipAddress = getClientIpAddress(httpRequest);
		try {
			AuthResponse response = authService.login(request);
			auditService.logSuccess(AuditAction.LOGIN, AuditResourceType.USER, null, null, request.getEmail(),
					"User login successful", ipAddress);
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			auditService.logFailure(AuditAction.LOGIN, AuditResourceType.USER, null, null, request.getEmail(),
					"User login failed: " + e.getMessage(), ipAddress);
			throw e;
		}
	}

	@PostMapping("/resend-otp")
	public ResponseEntity<AuthResponse> resendOtp(@RequestParam String email, HttpServletRequest httpRequest) {
		String ipAddress = getClientIpAddress(httpRequest);

		AuthResponse response = authService.resendOtp(email);
		auditService.logSuccess(AuditAction.LOGIN, AuditResourceType.USER, null, null, email, "OTP resend requested",
				ipAddress);
		return ResponseEntity.ok(response);
	}

	@PostMapping("/forgot-password")
	public ResponseEntity<AuthResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,
			HttpServletRequest httpRequest) {
		String ipAddress = getClientIpAddress(httpRequest);
		String userAgent = httpRequest.getHeader("User-Agent");

		try {
			AuthResponse response = passwordResetService.initiatePasswordReset(request, ipAddress, userAgent);
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			auditService.logFailure(AuditAction.PASSWORD_RESET_REQUEST, AuditResourceType.USER, null, null,
					request.getEmail(), "Password reset request failed: " + e.getMessage(), ipAddress);
			throw e;
		}
	}

	@PostMapping("/reset-password")
	public ResponseEntity<AuthResponse> resetPassword(@Valid @RequestBody ResetPasswordWithOtpRequest request,
			HttpServletRequest httpRequest) {
		String ipAddress = getClientIpAddress(httpRequest);
		String userAgent = httpRequest.getHeader("User-Agent");

		// Validate password confirmation
		if (!request.isPasswordsMatch()) {
			auditService.logFailure(AuditAction.PASSWORD_RESET, AuditResourceType.USER, null, null, request.getEmail(),
					"Password reset failed: passwords do not match", ipAddress);
			return ResponseEntity.badRequest()
					.body(AuthResponse.builder().success(false).message("Passwords do not match.").build());
		}

		try {
			AuthResponse response = passwordResetService.resetPasswordWithOtp(request, ipAddress, userAgent);
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			auditService.logFailure(AuditAction.PASSWORD_RESET, AuditResourceType.USER, null, null, request.getEmail(),
					"Password reset failed: " + e.getMessage(), ipAddress);
			throw e;
		}
	}

	@PostMapping("/change-password")
	public ResponseEntity<AuthResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request,
			HttpServletRequest httpRequest) {

		String ipAddress = getClientIpAddress(httpRequest);

		// Get authentication principal
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		Object principal = authentication.getPrincipal();
		String email;

		if (principal instanceof UserDetails) {
			email = ((UserDetails) principal).getUsername(); // Spring default
		} else if (principal instanceof Customer) {
			email = ((Customer) principal).getEmail(); // Customer entity
		} else if (principal instanceof ComplianceOfficer) {
			email = ((ComplianceOfficer) principal).getEmail(); 
		} else if (principal instanceof User) {
			email = ((User) principal).getEmail(); 
		} else if (principal instanceof String) {
			email = (String) principal; // fallback
		} else {
			throw new RuntimeException("Cannot extract email from authentication principal");
		}

		System.out.println("Email from JWT/Principal: " + email);

		// Lookup user
		User user = userRepository.findByEmailIgnoreCase(email)
				.orElseThrow(() -> new RuntimeException("User not found with email: " + email));

		System.out.println("Found user: " + user.getEmail() + " with ID: " + user.getUserId());

		try {
			AuthResponse response = authService.changePassword(user.getUserId(), request);
			auditService.logSuccess(AuditAction.PASSWORD_RESET, AuditResourceType.USER, user.getUserId(), null, email,
					"Password changed successfully", ipAddress);
			return ResponseEntity.ok(response);
		} catch (Exception e) {
			auditService.logFailure(AuditAction.PASSWORD_RESET, AuditResourceType.USER, user.getUserId(), null, email,
					"Password change failed: " + e.getMessage(), ipAddress);
			throw e;
		}
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
