package com.tss.aml.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSarRequest {
    
    @Size(max = 10000, message = "Summary must not exceed 10000 characters")
    private String summary;
    
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
    
    @Size(max = 255, message = "Suspicion type must not exceed 255 characters")
    private String suspicionType;
}
