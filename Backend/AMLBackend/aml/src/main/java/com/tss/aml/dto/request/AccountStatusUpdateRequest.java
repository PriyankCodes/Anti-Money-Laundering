package com.tss.aml.dto.request;

import com.tss.aml.entity.enums.AccountStatus;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountStatusUpdateRequest {
    @NotNull(message = "Account status is required")
    private AccountStatus status;
    
    private String reason;
}
