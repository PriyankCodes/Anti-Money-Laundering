package com.tss.aml.service;

import com.tss.aml.dto.request.ChangePasswordRequest;
import com.tss.aml.dto.request.LoginRequest;
import com.tss.aml.dto.request.RegisterRequest;
import com.tss.aml.dto.request.VerifyOtpRequest;
import com.tss.aml.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse VerifyOtpRequest(VerifyOtpRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse resendOtp(String email);
    AuthResponse changePassword(Long userId, ChangePasswordRequest request);
}
