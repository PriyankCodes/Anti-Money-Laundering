package com.tss.aml.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AccountUpdateRequest {
    
    @NotBlank(message = "Account type is required")
    private String accountType; // SAVINGS, CHECKING, BUSINESS
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Balance cannot be negative")
    private BigDecimal balance;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Daily limit cannot be negative")
    private BigDecimal dailyTransactionLimit;
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Monthly limit cannot be negative")
    private BigDecimal monthlyTransactionLimit;
    
    private String status; // ACTIVE, FROZEN, CLOSED
    
    @Size(max = 500, message = "Notes must not exceed 500 characters")
    private String notes;
    
    private String riskLevel; // LOW, MEDIUM, HIGH
}
