package com.tss.aml.dto.request;

import com.tss.aml.entity.enums.RuleType;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RuleRequest {
    @NotBlank
    private String name;
    
    private String description;
    
    @NotNull
    private RuleType type;
    
    private String conditions; // JSON string
    
    @Min(0) @Max(100)
    private Integer riskScoreImpact;
    
    private Boolean active = true;

    // Getters & Setters
}