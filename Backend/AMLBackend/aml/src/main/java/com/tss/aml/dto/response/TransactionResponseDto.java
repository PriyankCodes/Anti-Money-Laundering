package com.tss.aml.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.tss.aml.entity.Transaction;
import com.tss.aml.entity.enums.TransactionStatus;
import com.tss.aml.entity.enums.TransactionType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionResponseDto {
    private Long transactionId;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String senderAccountNumber;
    private BigDecimal amount;
    private String currency;
    private LocalDateTime timestamp;
    private String description;
    private String counterpartyName;
    private String counterpartyAccount;
    private String countryCode;
    private TransactionType transactionType;
    private TransactionStatus status;
    private Integer riskScore;

    // Constructor from Transaction entity
    public TransactionResponseDto(Transaction transaction) {
        this.transactionId = transaction.getTransactionId();
        this.customerId = transaction.getCustomer() != null ? transaction.getCustomer().getUserId() : null;
        this.customerName = transaction.getCustomer() != null ? 
            transaction.getCustomer().getFirstName() + " " + transaction.getCustomer().getLastName() : null;
        this.customerEmail = transaction.getCustomer() != null ? transaction.getCustomer().getEmail() : null;
        this.senderAccountNumber = transaction.getSenderAccountNumber();
        this.amount = transaction.getAmount();
        this.currency = transaction.getCurrency();
        this.timestamp = transaction.getTimestamp();
        this.description = transaction.getDescription();
        this.counterpartyName = transaction.getCounterpartyName();
        this.counterpartyAccount = transaction.getCounterpartyAccount();
        this.countryCode = transaction.getCountryCode();
        this.transactionType = transaction.getTransactionType();
        this.status = transaction.getStatus();
        this.riskScore = transaction.getRiskScore();
    }
}
