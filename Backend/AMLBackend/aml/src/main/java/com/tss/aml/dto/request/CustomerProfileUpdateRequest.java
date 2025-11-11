package com.tss.aml.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileUpdateRequest {
    private String firstName;
    
    private String middleName;
    
    private String lastName;
    
    private LocalDate dateOfBirth;
    
    private String street;
    private String city;
    private String state;
    private String pincode;
    
    private String contactNumber;
    
    @NotBlank(message = "OTP is required for profile update")
    private String otp;
    
    @NotBlank(message = "Email is required for OTP verification")
    private String email;
    
    private String nationality;
}
