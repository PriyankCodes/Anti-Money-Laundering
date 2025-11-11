package com.tss.aml.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountDeactivationRequest {
    private Long accountId;
    private String reason;
    private Boolean deactivateTransactions; // Whether to also deactivate all transactions
}
