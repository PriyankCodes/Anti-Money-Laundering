package com.tss.aml.service.impl;

import java.security.SecureRandom;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.aml.dto.request.CreateAccountRequest;
import com.tss.aml.entity.Account;
import com.tss.aml.entity.Customer;
import com.tss.aml.entity.enums.AccountType;
import com.tss.aml.entity.enums.Currency;
import com.tss.aml.exception.KycNotVerifiedException;
import com.tss.aml.exception.UserApiException;
import com.tss.aml.repository.AccountRepository;
import com.tss.aml.repository.CustomerRepository;
import com.tss.aml.repository.KycDocumentRepository;
import com.tss.aml.service.AccountService;
import com.tss.aml.service.EmailService;

@Service
public class AccountServiceImpl implements AccountService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private CustomerRepository customerRepository;
    
    @Autowired
    private KycDocumentRepository kycDocumentRepository;
    
    @Autowired
    private EmailService emailService;

    private static final SecureRandom RANDOM = new SecureRandom();

    @Override
    public Account createAccount(CreateAccountRequest request, Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new UserApiException("Customer not found"));

        // Check if customer has at least one verified KYC document
        long verifiedDocuments = kycDocumentRepository.countVerifiedDocumentsByCustomer(customerId);
        if (verifiedDocuments == 0) {
            throw new KycNotVerifiedException(
                "Cannot create account. You must have at least one verified KYC document before creating an account. Please upload and verify your documents first."
            );
        }

        if (!AccountType.isValid(request.getAccountType())) {
            throw new IllegalArgumentException("Invalid account type: " + request.getAccountType());
        }


        if (!Currency.isValidCurrency(request.getCurrency())) {
            throw new IllegalArgumentException("Invalid currency: " + request.getCurrency());
        }

        Account account = new Account();
        account.setAccountType(AccountType.valueOf(request.getAccountType().toUpperCase()));
        account.setCurrency(request.getCurrency().toUpperCase());
        account.setBalance(request.getBalance());
        account.setCustomer(customer);

        // Generate a unique 12-digit account number
        String uniqueAccountNumber = generateUniqueAccountNumber();
        account.setAccountNumber(uniqueAccountNumber);

        Account savedAccount = accountRepository.save(account);
        
        // Send account creation email notification
        try {
            emailService.sendAccountCreatedEmail(
                customer.getEmail(),
                customer.getFirstName(),
                savedAccount.getAccountNumber(),
                savedAccount.getCurrency(),
                savedAccount.getAccountType().name(),
                savedAccount.getBalance().toString()
            );
        } catch (Exception e) {
            // Don't fail account creation if email fails
            System.err.println("Failed to send account creation email: " + e.getMessage());
        }

        return savedAccount;
    }

    @Override
    public Account getAccountByNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber);
    }

    @Override
    public boolean isAccountOwnedByUser(String accountNumber, Long userId) {
        Account account = accountRepository.findByAccountNumber(accountNumber);
        return account != null && account.getCustomer() != null && 
               account.getCustomer().getUserId().equals(userId);
    }

    @Override
    public List<Account> getAccountsByCustomerId(Long customerId) {
        try {
            System.out.println("Fetching accounts for customer ID: " + customerId);
            List<Account> accounts = accountRepository.findByCustomerUserId(customerId);
            System.out.println("Found " + accounts.size() + " accounts for customer " + customerId);
            return accounts;
        } catch (Exception e) {
            System.err.println("Error fetching accounts for customer " + customerId + ": " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch accounts: " + e.getMessage(), e);
        }
    }

    /**
     * Generates a unique 12-digit random account number.
     */
    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            accountNumber = generateRandom12DigitNumber();
        } while (accountRepository.findByAccountNumber(accountNumber) != null);
        return accountNumber;
    }

    /**
     * Generates a random 12-digit number as a String (no prefix, just digits).
     */
    private String generateRandom12DigitNumber() {
        long number = 100000000000L + (Math.abs(RANDOM.nextLong()) % 900000000000L);
        return String.valueOf(number);
    }
}
