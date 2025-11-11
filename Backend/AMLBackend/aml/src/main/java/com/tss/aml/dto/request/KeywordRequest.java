package com.tss.aml.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KeywordRequest {
    @NotBlank
    private String word;
    
    @NotBlank
    private String category;
    
    @Min(1) @Max(10)
    private Integer severity;
    
    private Boolean active = true;

    // Getters & Setters
}