package com.tss.aml.service;

public interface EmailService {
    void sendOtpEmail(String toEmail, String otp);
    void sendWelcomeEmail(String toEmail, String firstName);
    void sendNotificationEmail(String email, String subject, String message);
    void sendAccountCreatedEmail(String toEmail, String firstName, String accountNumber, String currency, String accountType, String initialBalance);
    void sendPasswordResetOtpEmail(String toEmail, String otp, String userName);
    void sendPasswordChangeConfirmationEmail(String toEmail, String userName);
    void sendOfficerAccountCreatedEmail(String toEmail, String firstName, String lastName, String email, String temporaryPassword, String loginUrl);
    void sendTransactionFlaggedEmail(String toEmail, String firstName, String transactionId, String amount, String currency, String transactionType, String riskScore, String reason);
    void sendTransactionBlockedEmail(String toEmail, String firstName, String transactionId, String amount, String currency, String transactionType, String riskScore, String reason);
    void sendAccountDeactivatedEmail(String toEmail, String firstName, String accountNumber, String reason);
}
