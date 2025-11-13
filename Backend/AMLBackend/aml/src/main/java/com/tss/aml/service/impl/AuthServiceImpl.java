package com.tss.aml.service.impl;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.dto.request.ChangePasswordRequest;
import com.tss.aml.dto.request.LoginRequest;
import com.tss.aml.dto.request.RegisterRequest;
import com.tss.aml.dto.request.VerifyOtpRequest;
import com.tss.aml.dto.response.AuthResponse;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.User;
import com.tss.aml.entity.enums.UserRole;
import com.tss.aml.entity.enums.UserStatus;
import com.tss.aml.exception.UserApiException;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.UserRepository;
import com.tss.aml.service.AuthService;
import com.tss.aml.service.EmailService;
import com.tss.aml.util.JwtUtil;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

	@Autowired
	private CustomerRepository customerRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private EmailService emailService;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private JwtUtil jwtUtil;
	

	private static final int OTP_EXPIRY_MINUTES = 10;

	// In-memory storage for pending registrations
	private final Map<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();

	// Inner class to hold pending registration data
	private static class PendingRegistration {
		private final RegisterRequest registerRequest;
		private final String hashedPassword;
		private final String otp;
		private final LocalDateTime otpExpiryTime;

		public PendingRegistration(RegisterRequest registerRequest, String hashedPassword, String otp,
				LocalDateTime otpExpiryTime) {
			this.registerRequest = registerRequest;
			this.hashedPassword = hashedPassword;
			this.otp = otp;
			this.otpExpiryTime = otpExpiryTime;
		}

		public RegisterRequest getRegisterRequest() {
			return registerRequest;
		}

		public String getHashedPassword() {
			return hashedPassword;
		}

		public String getOtp() {
			return otp;
		}

		public boolean isExpired() {
			return LocalDateTime.now().isAfter(otpExpiryTime);
		}
	}

	@Override
	public AuthResponse register(RegisterRequest request) {
		// Check if email already exists in main database
		if (userRepository.findByEmail(request.getEmail()).isPresent()) {
			throw new UserApiException("Email already registered");
		}
		
		// Check if phone number already exists
		if (request.getContactNumber() != null && !request.getContactNumber().trim().isEmpty()) {
			if (customerRepository.existsByContactNumber(request.getContactNumber().trim())) {
				throw new UserApiException("Phone number already registered. Please use a different phone number.");
			}
		}

		// Remove any existing pending registration for this email
		pendingRegistrations.remove(request.getEmail());

		// Clean up expired registrations
		cleanupExpiredRegistrations();

		// Hash password
		String hashedPassword = passwordEncoder.encode(request.getPassword());

		// Generate OTP
		String otp = generateOtp();
		LocalDateTime otpExpiryTime = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

		// Store registration data temporarily in memory (NOT in database)
		PendingRegistration pendingRegistration = new PendingRegistration(request, hashedPassword, otp, otpExpiryTime);
		pendingRegistrations.put(request.getEmail(), pendingRegistration);

		// Send OTP email
		try {
			emailService.sendOtpEmail(request.getEmail(), otp);
		} catch (Exception e) {
			// If email fails, remove the pending registration
			pendingRegistrations.remove(request.getEmail());
			throw new UserApiException("Failed to send OTP email. Please try again.");
		}

		return AuthResponse.builder()
			.success(true)
			.message("Registration successful! Please check your email for OTP verification.")
			.build();
	}

	@Override
	public AuthResponse VerifyOtpRequest(VerifyOtpRequest request) {
		// Clean up expired registrations first
		cleanupExpiredRegistrations();

		// Check if user already exists in main database
		if (userRepository.findByEmail(request.getEmail()).isPresent()) {
			throw new UserApiException("Email already registered. Please login.");
		}

		// Find pending registration
		PendingRegistration pendingRegistration = pendingRegistrations.get(request.getEmail());
		if (pendingRegistration == null) {
			throw new UserApiException("Registration not found. Please register again.");
		}

		// Check if OTP matches
		if (!request.getOtp().equals(pendingRegistration.getOtp())) {
			throw new UserApiException("Invalid OTP");
		}

		// Check if OTP expired
		if (pendingRegistration.isExpired()) {
			pendingRegistrations.remove(request.getEmail());
			throw new UserApiException("OTP has expired. Please register again.");
		}

		// Create actual customer from pending registration data
		RegisterRequest registerRequest = pendingRegistration.getRegisterRequest();
		Customer customer = new Customer();
		customer.setEmail(registerRequest.getEmail());
		customer.setPasswordHash(pendingRegistration.getHashedPassword());
		customer.setRole(UserRole.CUSTOMER);
		customer.setFirstName(registerRequest.getFirstName());
		customer.setMiddleName(registerRequest.getMiddleName());
		customer.setLastName(registerRequest.getLastName());
		customer.setDateOfBirth(registerRequest.getDateOfBirth());
		customer.setNationality(registerRequest.getNationality());
		customer.setContactNumber(registerRequest.getContactNumber());
		customer.setStreet(registerRequest.getStreet());
		customer.setCity(registerRequest.getCity());
		customer.setState(registerRequest.getState());
		customer.setCountry(registerRequest.getCountry());
		customer.setPincode(registerRequest.getPincode());
		customer.setStatus(UserStatus.ACTIVE);
		customer.setEmailVerified(true);

		// Save customer to database (commit the registration)
		customerRepository.save(customer);

		// Remove from pending registrations
		pendingRegistrations.remove(request.getEmail());

		// Send welcome email
		try {
			emailService.sendWelcomeEmail(customer.getEmail(), customer.getFirstName());
		} catch (Exception e) {
			// Continue even if welcome email fails
		}

		return AuthResponse.builder()
			.success(true)
			.message("Email verified successfully! You can now login.")
			.build();
	}

	@Override
	public AuthResponse login(LoginRequest request) {
		// Find user by email
		User user = userRepository.findByEmail(request.getEmail())
				.orElseThrow(() -> new UserApiException("Invalid email or password"));

		// Check if email is verified
		if (!user.isEmailVerified()) {
			throw new UserApiException("Email not verified. Please verify your email first.");
		}

		// Check if account is active
		if (user.getStatus() != UserStatus.ACTIVE) {
			throw new UserApiException("Account is not active. Please contact support.");
		}

		// Verify password
		if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
			throw new UserApiException("Invalid email or password");
		}

		// Update last login
		user.setLastLogin(LocalDateTime.now());
		userRepository.save(user);

		// Generate JWT token
		String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

		return AuthResponse.builder()
			.success(true)
			.token(token)
			.email(user.getEmail())
			.role(user.getRole().name())
			.message("Login successful")
			.build();
	}

	@Override
	public AuthResponse resendOtp(String email) {
		// Clean up expired registrations first
		cleanupExpiredRegistrations();

		// Check if user already exists in main database
		if (userRepository.findByEmail(email).isPresent()) {
			throw new UserApiException("Email already registered. Please login.");
		}

		// Find pending registration
		PendingRegistration pendingRegistration = pendingRegistrations.get(email);
		if (pendingRegistration == null) {
			throw new UserApiException("Registration not found. Please register again.");
		}

		// Generate new OTP
		String newOtp = generateOtp();
		LocalDateTime newOtpExpiryTime = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);

		// Update pending registration with new OTP
		RegisterRequest registerRequest = pendingRegistration.getRegisterRequest();
		PendingRegistration updatedRegistration = new PendingRegistration(registerRequest,
				pendingRegistration.getHashedPassword(), newOtp, newOtpExpiryTime);
		pendingRegistrations.put(email, updatedRegistration);

		// Send OTP email
		try {
			emailService.sendOtpEmail(email, newOtp);
		} catch (Exception e) {
			throw new UserApiException("Failed to send OTP email. Please try again.");
		}

		return AuthResponse.builder()
			.success(true)
			.message("OTP has been resent to your email.")
			.build();
	}

	private String generateOtp() {
		Random random = new Random();
		int otp = 100000 + random.nextInt(900000);
		return String.valueOf(otp);
	}



    @Override
    @Transactional 
    public AuthResponse changePassword(Long userId, ChangePasswordRequest request) {

        if (!request.isPasswordsMatch()) {
            throw new UserApiException("New password and confirm password do not match");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserApiException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new UserApiException("Current password is incorrect");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new UserApiException("New password must be different from current password");
        }

        String newHashedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPasswordHash(newHashedPassword);
        userRepository.save(user);

        // Send confirmation email
        try {
            emailService.sendPasswordChangeConfirmationEmail(user.getEmail(), "User");
        } catch (Exception e) {
            // Log but continue
            System.err.println("Failed to send email: " + e.getMessage());
        }

        return AuthResponse.builder()
                .success(true)
                .message("Password changed successfully")
                .build();
    }

	// Helper method to clean up expired registrations
	private void cleanupExpiredRegistrations() {
		pendingRegistrations.entrySet().removeIf(entry -> entry.getValue().isExpired());
	}
}
