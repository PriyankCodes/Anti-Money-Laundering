package com.tss.aml.service;

import java.util.List;

import com.tss.aml.dto.request.DepositRequest;
import com.tss.aml.dto.request.TransferRequest;
import com.tss.aml.dto.request.WithdrawalRequest;
import com.tss.aml.dto.response.TransactionCountDto;
import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.TransactionStatus;

public interface TransactionService {
    Transaction processTransaction(Transaction transaction);
    Transaction transferFunds(TransferRequest transferRequest, Long userId, String ipAddress, String userAgent);
    Transaction depositFunds(DepositRequest depositRequest, Long userId, String ipAddress, String userAgent);
    Transaction withdrawFunds(WithdrawalRequest withdrawalRequest, Long userId, String ipAddress, String userAgent);
    
    // New methods for customer controller
    List<Transaction> getTransactionsByCustomerId(Long customerId);
//    List<Transaction> getTransactionsByCustomerIdAndAccountNumber(Long customerId, String accountNumber);
    Transaction getTransactionByIdAndCustomerId(Long transactionId, Long customerId);
    List<Transaction> getTransactionsByCustomerIdAndStatus(Long customerId, List<TransactionStatus> statuses);
    TransactionCountDto getTransactionCountsByCustomerId(Long customerId);
    
    List<Transaction> getFlaggedTransactionsByCustomerId(Long customerId);
    
    // Method for compliance officers and admins to view all transactions
    List<Transaction> getAllTransactions();
}