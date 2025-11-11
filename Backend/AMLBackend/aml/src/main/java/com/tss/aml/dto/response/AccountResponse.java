package com.tss.aml.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponse {
	private Long accountId;
	private String accountNumber;
	private String accountType;
	private String currency;
	private BigDecimal balance;
	private String status;
	private LocalDateTime createdAt;
	private String customerEmail;

}
