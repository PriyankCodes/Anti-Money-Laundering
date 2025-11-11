package com.tss.aml.service.impl;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.dto.request.ForgotPasswordRequest;
import com.tss.aml.dto.request.ResetPasswordWithOtpRequest;
import com.tss.aml.dto.response.AuthResponse;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.User;
import com.tss.aml.entity.enums.AuditAction;
import com.tss.aml.entity.enums.AuditResourceType;
import com.tss.aml.exception.InvalidTokenException;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.AuditService;
import com.tss.aml.service.EmailService;
import com.tss.aml.service.PasswordResetService;

@Service
@Transactional
public class PasswordResetServiceImpl implements PasswordResetService {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditService auditService;

    @Value("${app.password-reset.otp-expiry-minutes:10}")
    private int otpExpiryMinutes;

    @Value("${app.password-reset.max-requests-per-hour:3}")
    private int maxRequestsPerHour;

    @Override
    public AuthResponse initiatePasswordReset(ForgotPasswordRequest request, String ipAddress, String userAgent) {
        String email = request.getEmail().toLowerCase().trim();
        
        // Find user by email
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Don't reveal if email exists or not for security
       
            return AuthResponse.builder()
                .success(true)
                .message("If the email exists in our system, you will receive an OTP to reset your password.")
                .build();
        }

        User user = userOpt.get();

        // Generate 6-digit OTP
        String otp = generateOtp();
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(otpExpiryMinutes);

        // Save OTP to user
        user.setPasswordResetOtp(otp);
        user.setPasswordResetOtpExpiry(expiryDate);
        userRepository.save(user);

        // Get user name for email
        String userName = "User";
        if (user instanceof Customer) {
            Customer customer = (Customer) user;
            userName = customer.getFirstName();
        }

        // Send OTP email
        try {
            emailService.sendPasswordResetOtpEmail(user.getEmail(), otp, userName);
            
            auditService.logSuccess(AuditAction.PASSWORD_RESET_REQUEST, AuditResourceType.USER, 
                user.getUserId(), null, email, "Password reset OTP sent successfully", ipAddress);
        } catch (Exception e) {
            auditService.logFailure(AuditAction.PASSWORD_RESET_REQUEST, AuditResourceType.USER, 
                user.getUserId(), null, email, "Failed to send password reset OTP: " + e.getMessage(), ipAddress);
            throw new RuntimeException("Failed to send password reset OTP. Please try again later.");
        }

        return AuthResponse.builder()
            .success(true)
            .message("Password reset OTP has been sent to your email address.")
            .build();
    }

    public AuthResponse resetPasswordWithOtp(ResetPasswordWithOtpRequest request, String ipAddress, String userAgent) {
        String email = request.getEmail().toLowerCase().trim();
        String otp = request.getOtp();
        String newPassword = request.getNewPassword();

        // Find user by email
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            auditService.logFailure(AuditAction.PASSWORD_RESET, AuditResourceType.USER, 
                null, null, email, "Password reset attempted with invalid email", ipAddress);
            throw new InvalidTokenException("Invalid email or OTP.");
        }

        User user = userOpt.get();

        // Validate OTP
        if (user.getPasswordResetOtp() == null || !user.getPasswordResetOtp().equals(otp)) {
            auditService.logFailure(AuditAction.PASSWORD_RESET, AuditResourceType.USER, 
                user.getUserId(), null, email, "Invalid OTP used for password reset", ipAddress);
            throw new InvalidTokenException("Invalid email or OTP.");
        }

        // Check if OTP is expired
        if (user.getPasswordResetOtpExpiry() == null || LocalDateTime.now().isAfter(user.getPasswordResetOtpExpiry())) {
            auditService.logFailure(AuditAction.PASSWORD_RESET, AuditResourceType.USER, 
                user.getUserId(), null, email, "Expired OTP used for password reset", ipAddress);
            throw new InvalidTokenException("OTP has expired. Please request a new one.");
        }

        // Update password
        String hashedPassword = passwordEncoder.encode(newPassword);
        user.setPasswordHash(hashedPassword);
        
        // Clear OTP fields
        user.setPasswordResetOtp(null);
        user.setPasswordResetOtpExpiry(null);
        
        userRepository.save(user);

        // Send confirmation email
        try {
            String userName = "User";
            if (user instanceof Customer) {
                Customer customer = (Customer) user;
                userName = customer.getFirstName();
            }
            emailService.sendPasswordChangeConfirmationEmail(user.getEmail(), userName);
        } catch (Exception e) {
            // Don't fail the password reset if email fails
            System.err.println("Failed to send password change confirmation email: " + e.getMessage());
        }

        auditService.logSuccess(AuditAction.PASSWORD_RESET, AuditResourceType.USER, 
            user.getUserId(), null, user.getEmail(), "Password reset completed successfully with OTP", ipAddress);

        return AuthResponse.builder()
            .success(true)
            .message("Your password has been reset successfully. You can now log in with your new password.")
            .build();
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}
