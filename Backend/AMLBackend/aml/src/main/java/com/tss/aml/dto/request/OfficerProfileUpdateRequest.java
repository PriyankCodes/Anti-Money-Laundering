package com.tss.aml.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OfficerProfileUpdateRequest {
	private String firstName;
	private String lastName;
	private String phoneNumber;
	private String department;

	@NotBlank(message = "Email is required for profile update")
	private String email;

	@NotBlank(message = "OTP is required for profile update")
	private String otp;

}
