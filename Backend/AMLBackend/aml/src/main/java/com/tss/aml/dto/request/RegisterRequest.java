package com.tss.aml.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

	@NotBlank(message = "Email is required")
	@Email(message = "Invalid email format")
	private String email;

	@NotBlank(message = "Password is required")
	@Size(min = 8, message = "Password must be at least 8 characters")
	@Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$", message = "Password must contain at least one digit, one lowercase, one uppercase, and one special character")
	private String password;

	@NotBlank(message = "First name is required")
	private String firstName;

	private String middleName;

	@NotBlank(message = "Last name is required")
	private String lastName;

	@NotNull(message = "Date of birth is required")
	@Past(message = "Date of birth must be in the past")
	private LocalDate dateOfBirth;

	@NotBlank(message = "Nationality is required")
	private String nationality;

	@NotBlank(message = "Contact number is required")
	@Pattern(regexp = "^[0-9]{10,15}$", message = "Contact number must be 10-15 digits")
	private String contactNumber;

	private String street;

	@NotBlank(message = "city is required")
	private String city;

	@NotBlank(message = "state is required")
	private String state;

	@NotBlank(message = "country is required")
	private String country;

	@NotBlank(message = "pincode is required")
	@Pattern(regexp = "^[0-9]{6}$", message = "Pincode must be exactly 6 digits")
	private String pincode;

}
