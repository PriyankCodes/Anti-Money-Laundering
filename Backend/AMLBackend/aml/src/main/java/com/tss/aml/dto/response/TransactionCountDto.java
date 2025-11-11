package com.tss.aml.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionCountDto {
	private Long totalTransactions;
	private Long flaggedTransactions;
	private Long blockedTransactions;
	private Long completedTransactions;
	private Long pendingTransactions;
}