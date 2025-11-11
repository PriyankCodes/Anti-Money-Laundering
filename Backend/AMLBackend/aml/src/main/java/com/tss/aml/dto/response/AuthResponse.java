package com.tss.aml.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private boolean success;
    private String token;
    private String email;
    private String role;
    private String message;

    public AuthResponse(String message) {
        this.message = message;
    }
}
