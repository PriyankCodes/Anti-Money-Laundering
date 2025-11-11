package com.tss.aml.service;

import com.tss.aml.dto.request.ForgotPasswordRequest;
import com.tss.aml.dto.request.ResetPasswordWithOtpRequest;
import com.tss.aml.dto.response.AuthResponse;

public interface PasswordResetService {
    
    /**
     * Initiates password reset process by generating OTP and sending email
     */
    AuthResponse initiatePasswordReset(ForgotPasswordRequest request, String ipAddress, String userAgent);
    
    /**
     * Validates reset OTP and updates password
     */
    AuthResponse resetPasswordWithOtp(ResetPasswordWithOtpRequest request, String ipAddress, String userAgent);
}
