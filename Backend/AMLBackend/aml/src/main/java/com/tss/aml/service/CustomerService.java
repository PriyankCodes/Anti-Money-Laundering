package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.request.CustomerProfileUpdateRequest;
import com.tss.aml.dto.response.CustomerProfileDto;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.enums.AccountStatus;

public interface CustomerService {
    CustomerProfileDto getCustomerProfile(Long customerId);
    CustomerProfileDto updateCustomerProfile(Long customerId, CustomerProfileUpdateRequest request);
    void sendProfileUpdateOtp(String email);
    void updateCustomerAccountStatus(Long customerId, AccountStatus status, String reason);
    List<Customer> getAllCustomers(int page, int size);
    Customer getCustomerById(Long customerId);
}
