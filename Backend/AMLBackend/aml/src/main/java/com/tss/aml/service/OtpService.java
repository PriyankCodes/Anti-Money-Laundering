package com.tss.aml.service;

public interface OtpService {
    String generateOtp(String email);
    boolean verifyOtp(String email, String otp);
    void invalidateOtp(String email);
}
