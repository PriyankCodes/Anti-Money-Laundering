package com.tss.aml.dto.request;

import com.tss.aml.entity.enums.RiskLevel;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskyCountryRequest {
    @NotBlank @Size(min = 2, max = 2)
    private String countryCode;
    
    @NotBlank
    private String countryName;
    
    @NotNull
    private RiskLevel riskLevel;

    // Getters & Setters
}