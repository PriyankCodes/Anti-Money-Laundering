package com.tss.aml.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.tss.aml.entity.enums.KycStatus;
import com.tss.aml.entity.enums.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProfileDto {
    private Long customerId;
    private String email;
    private String firstName;
    private String middleName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String nationality;
    private String street;
    private String city;
    private String state;
    private String country;
    private String pincode;
    private String contactNumber;
    private KycStatus kycStatus;
    private UserStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private boolean emailVerified;
}
