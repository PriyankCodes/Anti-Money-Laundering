package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.request.CreateAccountRequest;
import com.tss.aml.entity.Account;

public interface AccountService {
    Account createAccount(CreateAccountRequest request, Long customerId);
    Account getAccountByNumber(String accountNumber);
    boolean isAccountOwnedByUser(String accountNumber, Long userId);
    List<Account> getAccountsByCustomerId(Long customerId);

}
