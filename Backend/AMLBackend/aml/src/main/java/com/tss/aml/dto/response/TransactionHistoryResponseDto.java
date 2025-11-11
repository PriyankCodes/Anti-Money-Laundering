package com.tss.aml.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.tss.aml.entity.enums.TransactionStatus;
import com.tss.aml.entity.enums.TransactionType;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionHistoryResponseDto {

	private Long transactionId;
	private String senderAccountNumber;
	private BigDecimal amount;
	private String currency;
	private TransactionType transactionType;
	private TransactionStatus status;
	private LocalDateTime timestamp;
	private String countryCode;
}