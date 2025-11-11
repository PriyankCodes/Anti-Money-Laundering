package com.tss.aml.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.tss.aml.service.EmailService;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@aml.com}")
    private String fromEmail;
    
    // HTML Email Templates with inline CSS
    private static final String EMAIL_BASE_TEMPLATE = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>%s</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
                .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); padding: 30px; text-align: center; }
                .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; }
                .content { padding: 40px 30px; }
                .otp-box { background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
                .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; font-family: 'Courier New', monospace; }
                .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 500; margin: 20px 0; }
                .footer { background-color: #2c3e50; color: #ecf0f1; padding: 20px; text-align: center; font-size: 14px; }
                .highlight { color: #667eea; font-weight: 600; }
                .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .success { background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🛡️ AML System</h1>
                </div>
                <div class="content">
                    %s
                </div>
                <div class="footer">
                    <p>© 2024 AML System. All rights reserved.</p>
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """;
    
    private static final String OTP_EMAIL_CONTENT = """
        <h2>Email Verification Required</h2>
        <p>Dear User,</p>
        <p>Thank you for registering with our AML System. To complete your registration, please verify your email address using the OTP below:</p>
        
        <div class="otp-box">
            <p style="margin: 0; font-size: 16px; color: #666;">Your verification code is:</p>
            <div class="otp-code">%s</div>
        </div>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> This OTP is valid for <strong>10 minutes only</strong>. Please use it promptly to verify your account.
        </div>
        
        <p>If you did not request this verification, please ignore this email or contact our support team.</p>
        
        <p>Best regards,<br>
        <span class="highlight">AML Security Team</span></p>
        """;
    
    private static final String WELCOME_EMAIL_CONTENT = """
        <h2>🎉 Welcome to AML System!</h2>
        <p>Dear <span class="highlight">%s</span>,</p>
        
        <div class="success">
            <strong>✅ Account Activated Successfully!</strong><br>
            Your email has been verified and your account is now fully active.
        </div>
        
        <p>You now have access to our comprehensive Anti-Money Laundering system with the following features:</p>
        
        <ul style="line-height: 1.8;">
            <li>🏦 <strong>Account Management</strong> - Create and manage multiple currency accounts</li>
            <li>💸 <strong>Secure Transactions</strong> - Transfer funds with real-time AML monitoring</li>
            <li>🔍 <strong>Transaction History</strong> - View detailed transaction records and status</li>
            <li>📊 <strong>Risk Assessment</strong> - Advanced fraud detection and compliance monitoring</li>
            <li>🌍 <strong>Multi-Currency Support</strong> - Handle transactions in various currencies</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" class="button">Access Your Dashboard</a>
        </div>
        
        <p>If you have any questions or need assistance, our support team is here to help.</p>
        
        <p>Welcome aboard!<br>
        <span class="highlight">The AML Team</span></p>
        """;
    
    private static final String ACCOUNT_CREATED_EMAIL_CONTENT = """
        <h2>🏦 New Account Created Successfully!</h2>
        <p>Dear <span class="highlight">%s</span>,</p>
        
        <div class="success">
            <strong>✅ Account Created!</strong><br>
            Your new %s account has been successfully created and is ready to use.
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">📋 Account Details</h3>
            <table style="width: 100%%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Account Number:</td>
                    <td style="padding: 10px 0; font-family: 'Courier New', monospace; color: #667eea;">%s</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Currency:</td>
                    <td style="padding: 10px 0;">%s</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Account Type:</td>
                    <td style="padding: 10px 0;">%s</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; font-weight: 600;">Initial Balance:</td>
                    <td style="padding: 10px 0; color: #28a745; font-weight: 600;">%s %s</td>
                </tr>
            </table>
        </div>
        
        <div class="warning">
            <strong>🔒 Security Notice:</strong> Keep your account number confidential and never share it with unauthorized parties.
        </div>
        
        <p>You can now:</p>
        <ul style="line-height: 1.8;">
            <li>💰 Make deposits and withdrawals</li>
            <li>🔄 Transfer funds to other accounts</li>
            <li>📊 Monitor your transaction history</li>
            <li>🛡️ Benefit from our advanced AML protection</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" class="button">View Account Dashboard</a>
        </div>
        
        <p>Thank you for choosing our AML System for your financial needs.</p>
        
        <p>Best regards,<br>
        <span class="highlight">AML Account Services</span></p>
        """;
    
    private static final String PASSWORD_RESET_OTP_EMAIL_CONTENT = """
        <h2>🔐 Password Reset OTP</h2>
        <p>Dear %s,</p>
        
        <p>We received a request to reset your password for your AML System account. Please use the following One-Time Password (OTP) to complete your password reset:</p>
        
        <div style="background-color: #f8f9fa; border: 2px solid #667eea; border-radius: 10px; padding: 30px; text-align: center; margin: 30px 0;">
            <p style="margin: 0; font-size: 16px; color: #666; margin-bottom: 15px;">Your Password Reset OTP:</p>
            <div style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; margin: 10px 0;">%s</div>
            <p style="margin: 0; font-size: 14px; color: #999; margin-top: 10px;">Valid for 10 minutes only</p>
        </div>
        
        <div class="warning">
            <strong>⚠️ Important Security Information:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This OTP is valid for <strong>10 minutes only</strong></li>
                <li>You can only use this OTP once</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your current password remains unchanged until you complete the reset</li>
            </ul>
        </div>
        
        <p>If you did not request a password reset, please ignore this email or contact our security team immediately if you suspect unauthorized access to your account.</p>
        
        <p>For security reasons, we recommend:</p>
        <ul style="line-height: 1.8;">
            <li>🔒 Using a strong, unique password</li>
            <li>🔄 Changing your password regularly</li>
            <li>🚫 Never sharing your login credentials</li>
            <li>📱 Enabling two-factor authentication when available</li>
        </ul>
        
        <p>Best regards,<br>
        <span class="highlight">AML Security Team</span></p>
        """;
    
    private static final String PASSWORD_CHANGE_CONFIRMATION_EMAIL_CONTENT = """
        <h2>✅ Password Successfully Changed</h2>
        <p>Dear %s User,</p>
        
        <div class="success">
            <strong>🔐 Password Updated!</strong><br>
            Your password has been successfully changed for your AML System account.
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">📋 Change Details</h3>
            <table style="width: 100%%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Date & Time:</td>
                    <td style="padding: 10px 0;">%s</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Account Type:</td>
                    <td style="padding: 10px 0;">%s</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; font-weight: 600;">Status:</td>
                    <td style="padding: 10px 0; color: #28a745; font-weight: 600;">✅ Completed Successfully</td>
                </tr>
            </table>
        </div>
        
        <div class="warning">
            <strong>🚨 Security Alert:</strong> If you did not make this change, please contact our security team immediately and consider the following actions:
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Contact our support team right away</li>
                <li>Review your account for any unauthorized activity</li>
                <li>Consider enabling additional security measures</li>
            </ul>
        </div>
        
        <p>Your account security is our top priority. Here are some security best practices:</p>
        <ul style="line-height: 1.8;">
            <li>🔒 Keep your password confidential and secure</li>
            <li>🔄 Use unique passwords for different accounts</li>
            <li>📱 Monitor your account regularly for suspicious activity</li>
            <li>🛡️ Log out from shared or public computers</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" class="button">Access Your Account</a>
        </div>
        
        <p>Thank you for keeping your AML System account secure.</p>
        
        <p>Best regards,<br>
        <span class="highlight">AML Security Team</span></p>
        """;

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🛡️ AML - Email Verification Required");
            
            String content = String.format(OTP_EMAIL_CONTENT, otp);
            String htmlContent = String.format(EMAIL_BASE_TEMPLATE, "Email Verification", content);
            
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        }
    }

    @Override
    @Async
    public void sendWelcomeEmail(String toEmail, String firstName) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🎉 Welcome to AML System - Account Activated!");
            
            String content = String.format(WELCOME_EMAIL_CONTENT, firstName);
            String htmlContent = String.format(EMAIL_BASE_TEMPLATE, "Welcome to AML System", content);
            
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            // Don't throw exception for welcome email failure
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }
    }

	@Override
	@Async
	public void sendNotificationEmail(String email, String subject, String message) {
		try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("🛡️ AML - " + subject);
            
            // Simple notification template
            String content = String.format("""
                <h2>%s</h2>
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    %s
                </div>
                <p>If you have any questions, please contact our support team.</p>
                <p>Best regards,<br>
                <span class="highlight">AML System</span></p>
                """, subject, message);
            
            String htmlContent = String.format(EMAIL_BASE_TEMPLATE, subject, content);
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Failed to send notification email: " + e.getMessage());
        }
	}

    @Override
    @Async
    public void sendAccountCreatedEmail(String toEmail, String firstName, String accountNumber, String currency, String accountType, String initialBalance) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🏦 New Account Created - " + accountNumber);
            
            String content = String.format(ACCOUNT_CREATED_EMAIL_CONTENT, 
                firstName, currency, accountNumber, currency, accountType, initialBalance, currency);
            String htmlContent = String.format(EMAIL_BASE_TEMPLATE, "Account Created Successfully", content);
            
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Failed to send account created email: " + e.getMessage());
        }
    }

    @Override
    public void sendPasswordResetOtpEmail(String toEmail, String otp, String userName) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🔐 AML - Password Reset OTP");
            
            String content = String.format(PASSWORD_RESET_OTP_EMAIL_CONTENT, userName, otp);
            String htmlContent = String.format(EMAIL_BASE_TEMPLATE, "Password Reset OTP", content);
            
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send password reset OTP email: " + e.getMessage());
        }
    }

    @Override
    @Async
    public void sendPasswordChangeConfirmationEmail(String toEmail, String userType) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("✅ AML - Password Successfully Changed");
            
            String currentDateTime = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm"));
            
            String content = String.format(PASSWORD_CHANGE_CONFIRMATION_EMAIL_CONTENT, 
                userType, currentDateTime, userType);
            String htmlContent = String.format(EMAIL_BASE_TEMPLATE, "Password Successfully Changed", content);
            
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Failed to send password change confirmation email: " + e.getMessage());
        }
    }

    @Override
    @Async
    public void sendOfficerAccountCreatedEmail(String toEmail, String firstName, String lastName, String email, String temporaryPassword, String loginUrl) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(toEmail);
            helper.setSubject("🏛️ Welcome to AML System - Compliance Officer Account Created");
            helper.setFrom("noreply@amlsystem.com");
            
            // Debug: Print the number of arguments
            System.out.println("Formatting officer content with 7 arguments:");
            System.out.println("1. firstName: " + firstName);
            System.out.println("2. lastName: " + lastName);
            System.out.println("3. email: " + email);
            System.out.println("4. temporaryPassword: " + temporaryPassword);
            System.out.println("5. loginUrl (button): " + loginUrl);
            System.out.println("6. loginUrl (link href): " + loginUrl);
            System.out.println("7. loginUrl (display): " + loginUrl);
            
            // First format the content with the officer details
            String formattedContent = String.format(OFFICER_ACCOUNT_CREATED_CONTENT, 
                firstName, lastName, email, temporaryPassword, loginUrl, loginUrl, loginUrl);
            
            System.out.println("Officer content formatted successfully");
            
            // Use a simpler template to avoid CSS %% conflicts
            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Compliance Officer Account Created</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; }
                        .highlight { color: #007bff; font-weight: bold; }
                        .success { background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
                        .info { background-color: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; border-radius: 5px; }
                        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        """ + formattedContent + """
                    </div>
                </body>
                </html>
                """;
            
            System.out.println("Base template formatted successfully");
            
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
            
            System.out.println("Officer account creation email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send officer account creation email: " + e.getMessage());
            e.printStackTrace(); // Print full stack trace for debugging
        }
    }

    private static final String OFFICER_ACCOUNT_CREATED_CONTENT = """
        <h2>🏛️ Welcome to AML System - Compliance Officer</h2>
        <p>Dear <span class="highlight">%s %s</span>,</p>
        
        <div class="success">
            <strong>✅ Your Compliance Officer Account Has Been Created!</strong><br>
            An administrator has created your account in the AML (Anti-Money Laundering) System.
        </div>
        
        <div class="info">
            <h3>📋 Your Account Details:</h3>
            <p><strong>Email/Username:</strong> <span class="highlight">%s</span></p>
            <p><strong>Temporary Password:</strong> <span class="highlight">%s</span></p>
            <p><strong>Role:</strong> Compliance Officer</p>
        </div>
        
        <div class="warning">
            <strong>🔐 Important Security Notice:</strong><br>
            Please change your password immediately after your first login for security purposes.
        </div>
        
        <p><strong>🎯 Your Responsibilities as a Compliance Officer:</strong></p>
        <ul style="line-height: 1.8;">
            <li>🚨 <strong>Alert Management</strong> - Review and investigate suspicious activity alerts</li>
            <li>📋 <strong>SAR Generation</strong> - Create and submit Suspicious Activity Reports</li>
            <li>🔍 <strong>Transaction Monitoring</strong> - Monitor high-risk transactions and patterns</li>
            <li>📄 <strong>KYC Document Verification</strong> - Verify customer identity documents</li>
            <li>📊 <strong>Compliance Reporting</strong> - Generate compliance reports and analytics</li>
            <li>👥 <strong>Customer Risk Assessment</strong> - Evaluate customer risk profiles</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="%s" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                🔑 Login to AML System
            </a>
        </div>
        
        <p><strong>📞 Need Help?</strong></p>
        <p>If you have any questions or need assistance, please contact the system administrator or IT support team.</p>
        
        <div class="info">
            <p><strong>Login URL:</strong> <a href="%s">%s</a></p>
            <p><strong>System:</strong> Anti-Money Laundering Compliance Platform</p>
        </div>
        """;

    private static final String TRANSACTION_FLAGGED_EMAIL_CONTENT = """
        <h2>⚠️ Transaction Flagged for Review</h2>
        <p>Dear <span class="highlight">%s</span>,</p>
        
        <div class="warning">
            <strong>⚠️ Transaction Under Review</strong><br>
            One of your transactions has been flagged by our Anti-Money Laundering system for additional review.
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">📋 Transaction Details</h3>
            <table style="width: 100%%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Transaction ID:</td>
                    <td style="padding: 10px 0; font-family: 'Courier New', monospace; color: #667eea;">%s</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Amount:</td>
                    <td style="padding: 10px 0; color: #ffc107; font-weight: 600;">%s %s</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Transaction Type:</td>
                    <td style="padding: 10px 0;">%s</td>
                </tr>
            
                <tr>
                    <td style="padding: 10px 0; font-weight: 600;">Status:</td>
                    <td style="padding: 10px 0; color: #ffc107; font-weight: 600;">⚠️ FLAGGED</td>
                </tr>
            </table>
        </div>
        
     
        <p><strong>What This Means:</strong></p>
        <ul style="line-height: 1.8;">
            <li>🔍 Your transaction is being reviewed by our compliance team</li>
            <li>⏳ The transaction is temporarily on hold pending review</li>
            <li>📞 You may be contacted for additional information</li>
            <li>✅ If approved, the transaction will be processed normally</li>
        </ul>
        
        <p><strong>What You Should Do:</strong></p>
        <ul style="line-height: 1.8;">
            <li>📧 Keep an eye on your email for any requests for information</li>
            <li>📱 Ensure your contact details are up to date</li>
            <li>🕐 Allow 1-3 business days for review completion</li>
            <li>📞 Contact support if you have questions about this transaction</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" class="button">View Transaction Details</a>
        </div>
        
        <p>This is a routine security measure to protect you and comply with financial regulations. We appreciate your patience and understanding.</p>
        
        <p>Best regards,<br>
        <span class="highlight">AML Compliance Team</span></p>
        """;

    private static final String TRANSACTION_BLOCKED_EMAIL_CONTENT = """
        <h2>🚫 Transaction Blocked</h2>
        <p>Dear <span class="highlight">%s</span>,</p>
        
        <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <strong>🚫 Transaction Blocked</strong><br>
            One of your transactions has been blocked by our Anti-Money Laundering system due to high-risk indicators.
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">📋 Transaction Details</h3>
            <table style="width: 100%%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Transaction ID:</td>
                    <td style="padding: 10px 0; font-family: 'Courier New', monospace; color: #667eea;">%s</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Amount:</td>
                    <td style="padding: 10px 0; color: #dc3545; font-weight: 600;">%s %s</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Transaction Type:</td>
                    <td style="padding: 10px 0;">%s</td>
                </tr>
              
                <tr>
                    <td style="padding: 10px 0; font-weight: 600;">Status:</td>
                    <td style="padding: 10px 0; color: #dc3545; font-weight: 600;">🚫 BLOCKED</td>
                </tr>
            </table>
        </div>

        
        <p><strong>What This Means:</strong></p>
        <ul style="line-height: 1.8;">
            <li>🚫 This transaction has been blocked and will not be processed</li>
            <li>💰 No funds have been transferred</li>
            <li>🔒 Your account security is our priority</li>
            <li>📞 Our compliance team will review this case</li>
        </ul>
        
        <p><strong>Next Steps:</strong></p>
        <ul style="line-height: 1.8;">
            <li>📧 Our compliance team may contact you for additional verification</li>
            <li>📄 You may be asked to provide supporting documentation</li>
            <li>🔍 A thorough review will be conducted</li>
            <li>📞 Contact our support team if you believe this is an error</li>
        </ul>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> Repeated blocked transactions may result in account restrictions. Please ensure all your transactions comply with our terms of service and applicable regulations.
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" class="button">Contact Support</a>
        </div>
        
        <p>We take financial security and regulatory compliance seriously. Thank you for your understanding.</p>
        
        <p>Best regards,<br>
        <span class="highlight">AML Compliance Team</span></p>
        """;

    private static final String ACCOUNT_DEACTIVATED_EMAIL_CONTENT = """
        <h2>🔒 Account Deactivated</h2>
        <p>Dear <span class="highlight">%s</span>,</p>
        
        <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <strong>🔒 Account Deactivation Notice</strong><br>
            Your account has been deactivated by our administration team.
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">📋 Account Details</h3>
            <table style="width: 100%%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Account Number:</td>
                    <td style="padding: 10px 0; font-family: 'Courier New', monospace; color: #667eea;">%s</td>
                </tr>
                <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 10px 0; font-weight: 600;">Status:</td>
                    <td style="padding: 10px 0; color: #dc3545; font-weight: 600;">🔒 DEACTIVATED</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; font-weight: 600;">Date:</td>
                    <td style="padding: 10px 0;">%s</td>
                </tr>
            </table>
        </div>
        
        <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <strong>📌 Reason for Deactivation:</strong><br>
            %s
        </div>
        
        <p><strong>What This Means:</strong></p>
        <ul style="line-height: 1.8;">
            <li>🚫 You cannot perform any new transactions on this account</li>
            <li>💰 Your existing balance remains secure</li>
            <li>🔒 Access to account features is restricted</li>
            <li>📧 You will receive further instructions if applicable</li>
        </ul>
        
        <p><strong>If You Believe This Is An Error:</strong></p>
        <ul style="line-height: 1.8;">
            <li>📞 Contact our customer support team immediately</li>
            <li>📧 Provide your account details and any relevant information</li>
            <li>📄 Be prepared to provide additional documentation if requested</li>
            <li>⏰ Our team will review your case within 2-3 business days</li>
        </ul>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> This action was taken to ensure compliance with financial regulations and to protect the security of our platform. If you have any questions or concerns, please contact our support team.
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" class="button">Contact Support</a>
        </div>
        
        <p>We appreciate your understanding in this matter.</p>
        
        <p>Best regards,<br>
        <span class="highlight">AML Administration Team</span></p>
        """;

    @Override
    @Async
    public void sendTransactionFlaggedEmail(String toEmail, String firstName, String transactionId, 
            String amount, String currency, String transactionType, String riskScore, String reason) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("⚠️ AML - Transaction Flagged for Review");
            
            String content = String.format(TRANSACTION_FLAGGED_EMAIL_CONTENT, 
                firstName, transactionId, amount, currency, transactionType, riskScore, reason);
            String htmlContent = String.format(EMAIL_BASE_TEMPLATE, "Transaction Flagged", content);
            
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Failed to send transaction flagged email: " + e.getMessage());
        }
    }

    @Override
    @Async
    public void sendTransactionBlockedEmail(String toEmail, String firstName, String transactionId, 
            String amount, String currency, String transactionType, String riskScore, String reason) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🚫 AML - Transaction Blocked");
            
            String content = String.format(TRANSACTION_BLOCKED_EMAIL_CONTENT, 
                firstName, transactionId, amount, currency, transactionType, riskScore, reason);
            String htmlContent = String.format(EMAIL_BASE_TEMPLATE, "Transaction Blocked", content);
            
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Failed to send transaction blocked email: " + e.getMessage());
        }
    }

    @Override
    @Async
    public void sendAccountDeactivatedEmail(String toEmail, String firstName, String accountNumber, String reason) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🔒 AML - Account Deactivated");
            
            String currentDateTime = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' HH:mm"));
            
            String content = String.format(ACCOUNT_DEACTIVATED_EMAIL_CONTENT, 
                firstName, accountNumber, currentDateTime, reason);
            String htmlContent = String.format(EMAIL_BASE_TEMPLATE, "Account Deactivated", content);
            
            helper.setText(htmlContent, true);
            mailSender.send(mimeMessage);
        } catch (Exception e) {
            System.err.println("Failed to send account deactivated email: " + e.getMessage());
        }
    }
}
