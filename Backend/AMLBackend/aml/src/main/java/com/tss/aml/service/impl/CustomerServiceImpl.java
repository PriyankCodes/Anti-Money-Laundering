package com.tss.aml.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.aml.dto.request.CustomerProfileUpdateRequest;
import com.tss.aml.dto.response.CustomerProfileDto;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.enums.AccountStatus;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.service.CustomerService;
import com.tss.aml.service.EmailService;
import com.tss.aml.service.OtpService;

@Service
@Transactional
public class CustomerServiceImpl implements CustomerService {

	@Autowired
	private CustomerRepository customerRepository;

	@Autowired
	private EmailService emailService;

	@Autowired
	private OtpService otpService;
	

	@Override
	public CustomerProfileDto getCustomerProfile(Long customerId) {
		Customer customer = customerRepository.findById(customerId)
				.orElseThrow(() -> new RuntimeException("Customer not found"));

		CustomerProfileDto dto = new CustomerProfileDto();
		dto.setCustomerId(customer.getUserId());
		dto.setFirstName(customer.getFirstName());
		dto.setLastName(customer.getLastName());
		dto.setEmail(customer.getEmail());
		dto.setContactNumber(customer.getContactNumber());
		dto.setNationality(customer.getNationality());
		dto.setDateOfBirth(customer.getDateOfBirth());
		dto.setStreet(customer.getStreet());
		dto.setCity(customer.getCity());
		dto.setState(customer.getState());
		dto.setCountry(customer.getCountry());
		dto.setPincode(customer.getPincode());
		dto.setKycStatus(customer.getKycStatus());
		dto.setStatus(customer.getStatus());
		dto.setCreatedAt(customer.getCreatedAt());
		dto.setLastLogin(customer.getLastLogin());
		dto.setEmailVerified(customer.isEmailVerified());

		return dto;
	}

	@Override
	public CustomerProfileDto updateCustomerProfile(Long customerId, CustomerProfileUpdateRequest request) {
		// Verify OTP first
		if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
			throw new RuntimeException("Invalid OTP");
		}

		Customer customer = customerRepository.findById(customerId)
				.orElseThrow(() -> new RuntimeException("Customer not found"));

		// Check if phone number already exists (excluding current user)
		if (request.getContactNumber() != null && !request.getContactNumber().trim().isEmpty()) {
			if (customerRepository.existsByContactNumberAndUserIdNot(request.getContactNumber().trim(), customerId)) {
				throw new RuntimeException("Phone number already registered. Please use a different phone number.");
			}
		}

		// Update profile fields
		if (request.getFirstName() != null) {
			customer.setFirstName(request.getFirstName());
		}
		if (request.getLastName() != null) {
			customer.setLastName(request.getLastName());
		}
		if (request.getContactNumber() != null) {
			customer.setContactNumber(request.getContactNumber());
		}
		if (request.getStreet() != null) {
			customer.setStreet(request.getStreet());
		}
		if (request.getCity() != null) {
			customer.setCity(request.getCity());
		}
		if (request.getState() != null) {
			customer.setState(request.getState());
		}
		if (request.getPincode() != null) {
			customer.setPincode(request.getPincode());
		}
		if (request.getNationality() != null) {
			customer.setNationality(request.getNationality());
		}
		if (request.getDateOfBirth() != null) {
			customer.setDateOfBirth(request.getDateOfBirth());
		}

		customer = customerRepository.save(customer);
		return getCustomerProfile(customer.getUserId());
	}

	@Override
	public void sendProfileUpdateOtp(String email) {
		String otp = otpService.generateOtp(email);
		emailService.sendOtpEmail(email, otp);
	}

	@Override
	public void updateCustomerAccountStatus(Long customerId, AccountStatus status, String reason) {
		Customer customer = customerRepository.findById(customerId)
				.orElseThrow(() -> new RuntimeException("Customer not found"));

		customer.setStatus(com.tss.aml.entity.enums.UserStatus.valueOf(status.name()));
		customerRepository.save(customer);

		// Send notification email
		String subject = "Account Status Update";
		String message = String.format("Your account status has been updated to: %s. Reason: %s", status.toString(),
				reason);
		emailService.sendNotificationEmail(customer.getEmail(), subject, message);
	}

	@Override
	public List<Customer> getAllCustomers(int page, int size) {
		Pageable pageable = PageRequest.of(page, size);
		return customerRepository.findAll(pageable).getContent();
	}

	@Override
	public Customer getCustomerById(Long customerId) {
		return customerRepository.findById(customerId).orElseThrow(() -> new RuntimeException("Customer not found"));
	}
}
